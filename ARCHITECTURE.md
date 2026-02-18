# Arquitectura Técnica - Photolarm

## Resumen Ejecutivo

Photolarm es una aplicación móvil desarrollada con **Expo (React Native + TypeScript)** que convierte documentos médicos en alarmas y recordatorios automatizados. La app utiliza visión por computadora (OCR) y procesamiento de lenguaje natural (LLM) para extraer planes de alarmas de recetas, instrucciones médicas y documentos de tratamiento.

## Decisiones Técnicas Principales

### 1. Framework: Expo

**Decisión**: Expo en lugar de React Native CLI  
**Justificación**:
- Desarrollo más rápido con herramientas integradas
- Manejo nativo de notificaciones, cámara, permisos
- EAS Build para compilación en la nube
- Actualización OTA (Over-The-Air)
- Menor fricción para prototipo y MVP

**Trade-offs**:
- ✅ Velocidad de desarrollo
- ✅ Mantenimiento más simple
- ⚠️ Tamaño de app ligeramente mayor
- ⚠️ Menos control sobre módulos nativos (aceptable para nuestro caso)

### 2. Estado: Zustand

**Decisión**: Zustand con MMKV persist middleware  
**Justificación**:
- Menos boilerplate que Redux Toolkit
- Performance superior para actualizaciones frecuentes
- API simple y TypeScript-friendly
- Middleware nativo para persistencia

**Estructura de Stores**:
```
stores/
├── usePreferencesStore.ts    # Preferencias de usuario
├── usePlansStore.ts          # Planes extraídos
├── useSchedulesStore.ts      # Schedules y alarmas
└── useDocumentsStore.ts      # Historial de documentos
```

### 3. Persistencia: MMKV

**Decisión**: react-native-mmkv en lugar de AsyncStorage  
**Justificación**:
- ~30x más rápido que AsyncStorage
- Operaciones síncronas (mejor UX)
- Cifrado nativo disponible
- Perfecto para listas grandes de alarmas

### 4. Notificaciones: expo-notifications

**Decisión**: expo-notifications + expo-task-manager  
**Justificación**:
- Integración nativa con Expo
- Manejo de notificaciones locales y push
- Background tasks para alarmas recurrentes
- Buena documentación y ejemplos

**Limitaciones conocidas**:
- iOS limita notificaciones en background (64 max programadas)
- Android más permisivo pero requiere optimización de batería
- Solución: programar lotes de notificaciones dinámicamente

### 5. OCR: Google Cloud Vision API

**Decisión**: Cloud Vision API con fallback manual  
**Justificación**:
- No hay solución 100% offline confiable en Expo
- Vision API tiene tier gratuito generoso (1000 requests/mes)
- Precisión excelente para texto médico
- Fallback: permitir edición manual del texto extraído

**Alternativas consideradas**:
- ❌ ML Kit (requiere native modules no soportados en Expo)
- ❌ Tesseract.js (precisión inferior, lento en móviles)
- ✅ Cloud Vision API (mejor trade-off)

### 6. LLM: OpenAI GPT-4o-mini

**Decisión**: GPT-4o-mini con JSON mode  
**Justificación**:
- Excelente relación calidad/precio para extracción estructurada
- JSON mode nativo (garantiza salida válida)
- Manejo superior de ambigüedad médica
- API simple y estable

**Configuración**:
- Temperatura: 0.1 (consistencia)
- Reintentos: 2
- Validación con Zod post-extracción

### 7. Validación: Zod

**Decisión**: Zod para runtime validation  
**Justificación**:
- Integración nativa con TypeScript
- Schemas reutilizables (types + validation)
- Errores descriptivos
- Parsing automático

### 8. QR: expo-barcode-scanner + TweetNaCl

**Decisión**: Barcode scanner nativo + Ed25519 para firmas  
**Justificación**:
- Barcode scanner integrado en Expo
- Ed25519 (TweetNaCl) para firmas criptográficas pequeñas y rápidas
- Payload JSON compacto en QR

**Modos de QR**:
1. **MVP**: Plan embebido en QR (limitado a ~2KB)
2. **Enterprise**: Referencia firmada + fetch desde backend

## Arquitectura de Datos

### Flujo Principal

```
[Documento]
    ↓
[OCR/PDF Extract] → Texto normalizado
    ↓
[LLM Extractor] → DocumentParse (con plans[])
    ↓
[User Review] → Selección de plan + configuración
    ↓
[Schedule Generator] → Schedule (lista de alarms)
    ↓
[Scheduler Service] → Notificaciones nativas programadas
```

### Modelos de Datos

#### Plan (Núcleo del Sistema)

```typescript
Plan {
  mode: 'fixed' | 'flexible'
  
  // Fixed mode:
  fixed_events: [
    {datetime, title, repeat?, alert_before?}
  ]
  
  // Flexible mode:
  flexible_pattern: {
    items: [{
      interval_hours? | times_per_day? | times_of_day?
      duration_days? | duration_doses?
      constraints: [meal-related, sleep-related, etc.]
    }]
  }
}
```

#### Schedule

```typescript
Schedule {
  plan_id: string
  anchor?: Anchor  // For flexible plans
  alarms: Alarm[]  // Lista completa de notificaciones
}
```

### Preferencias de Usuario

```typescript
UserPreferences {
  sleepWindow: {start, end}
  nightShiftMode: boolean
  mealTimes?: {breakfast?, lunch?, dinner?}
  doNotDisturb: boolean
  allowSleepInterruptions: boolean
}
```

Estas preferencias influyen en:
1. **Anchor Recommendation**: Evita programar alarmas durante sueño
2. **Constraint Resolution**: Resuelve "with_meal" usando meal times
3. **Notification Behavior**: Respeta DND settings

## Motor de Scheduling

### Algoritmo para Planes Flexibles

```typescript
function generateFlexibleSchedule(
  plan: Plan,
  anchor: Anchor,
  preferences: UserPreferences
): Schedule {
  const alarms = [];
  const startTime = parseISO(anchor.datetime);
  
  for (const item of plan.flexible_pattern.items) {
    if (item.interval_hours) {
      // Ej: "Cada 8 horas por 7 días"
      const totalDoses = Math.ceil(
        (item.duration_days * 24) / item.interval_hours
      );
      
      for (let i = 0; i < totalDoses; i++) {
        let alarmTime = addHours(startTime, i * item.interval_hours);
        
        // Aplicar constraints
        alarmTime = applyConstraints(
          alarmTime,
          item.constraints,
          preferences
        );
        
        alarms.push(createAlarm(alarmTime, item));
      }
    } else if (item.times_per_day) {
      // Ej: "3 veces al día por 5 días"
      const timesOfDay = item.times_of_day || distributeEvenly(item.times_per_day);
      
      for (let day = 0; day < item.duration_days; day++) {
        for (const time of timesOfDay) {
          const alarmTime = setTime(
            addDays(startTime, day),
            time
          );
          
          alarms.push(createAlarm(alarmTime, item));
        }
      }
    }
  }
  
  return {alarms, ...};
}
```

### Anchor Recommendation

```typescript
function recommendAnchor(
  plan: Plan,
  preferences: UserPreferences,
  now: Date
): Anchor {
  const pattern = plan.flexible_pattern;
  
  // Analizar constraints
  const hasWithMeal = pattern.items.some(
    item => item.constraints?.some(c => c.type === 'with_meal')
  );
  
  const hasSleepConstraint = pattern.items.some(
    item => item.constraints?.some(
      c => c.type === 'before_sleep' || c.type === 'avoid_sleep'
    )
  );
  
  // Si hay constraint de comida, recomendar próxima comida
  if (hasWithMeal && preferences.mealTimes) {
    return {
      datetime: nextMealTime(now, preferences.mealTimes),
      reason: 'Aligned with next meal'
    };
  }
  
  // Si hay constraint de sueño, evitar sleep window
  if (hasSleepConstraint) {
    const nextWakeTime = calculateNextWakeTime(
      now,
      preferences.sleepWindow
    );
    return {
      datetime: nextWakeTime,
      reason: 'Avoids sleep interruption'
    };
  }
  
  // Default: siguiente hora redonda
  return {
    datetime: nextHour(now),
    reason: 'Next convenient time'
  };
}
```

## Seguridad (QR Enterprise)

### Payload Firmado

```typescript
// Generación (QR Studio)
const payload: QRPayload = {
  version: '1',
  type: 'reference',
  planId: 'plan_abc123',
  planUrl: 'https://api.example.com/plans/abc123',
  issuerId: 'clinic_xyz',
  expiresAt: '2026-01-01T00:00:00Z',
};

const signature = ed25519.sign(
  serialize(payload),
  privateKey
);

payload.signature = base64(signature);
```

### Validación (App)

```typescript
// En la app
const payload = parseQR(qrData);

// 1. Verificar expiración
if (isExpired(payload.expiresAt)) {
  throw new Error('QR expired');
}

// 2. Verificar firma
const publicKey = getIssuerPublicKey(payload.issuerId);
const isValid = ed25519.verify(
  signature,
  serialize(payload),
  publicKey
);

if (!isValid) {
  throw new Error('Invalid signature');
}

// 3. Fetch plan
const plan = await fetchPlan(payload.planId, payload.planUrl);
```

## Navegación

### Stack de Pantallas

```
AppNavigator
├── HomeScreen               # Selección de entrada
├── ImportStack
│   ├── PhotoImportScreen    # Cámara + OCR
│   ├── PdfImportScreen      # Picker + extract
│   ├── TextImportScreen     # Textarea
│   └── QrScanScreen         # QR scanner
├── ResultsScreen            # Lista de planes detectados
├── PlanConfigScreen         # Configurar plan (fixed/flexible)
├── PreviewScheduleScreen    # Preview de alarmas
├── SettingsScreen           # Preferencias de usuario
└── QrStudioScreen           # B2B: Generar QRs
```

## Estructura de Servicios

```
services/
├── extractor.service.ts     # LLM extraction (OpenAI)
├── ocr.service.ts          # Google Cloud Vision
├── pdf.service.ts          # PDF text extraction
├── scheduler.service.ts    # Notification scheduling
├── qr.service.ts           # QR generation & validation
└── storage.service.ts      # MMKV wrapper
```

## Testing Strategy

### Unit Tests
- Schedule generator (pure functions)
- Zod schema validation
- Constraint resolution logic

### Integration Tests
- Extractor service (with mocked OpenAI)
- OCR service (with sample images)
- QR signature validation

### E2E Tests (futuro)
- Flujo completo: Photo → Extract → Schedule → Alarm

## Optimizaciones

### Performance
1. **Lazy Loading**: Cargar servicios bajo demanda
2. **Memoization**: React.memo para componentes de lista
3. **Virtualization**: FlatList para listas largas de alarmas
4. **Debouncing**: En inputs de texto

### Batería
1. **Batch Notifications**: Programar en lotes (iOS limit)
2. **Smart Refresh**: Solo refrescar alarmas cuando cambia el schedule
3. **Background Task Optimization**: Minimizar work en background

### Tamaño de App
1. **Tree Shaking**: Expo optimize
2. **Asset Optimization**: Comprimir imágenes
3. **Code Splitting**: Dynamic imports

## Próximos Pasos (Post-MVP)

1. **Offline Mode**: Cache de documentos + queue de sync
2. **Backend**: Para QR Enterprise y analytics
3. **ML Kit On-Device**: Si/cuando Expo lo soporte
4. **Apple Watch / Wear OS**: Notificaciones en wearables
5. **HealthKit Integration**: Logging de adherencia
6. **Multi-idioma**: i18n para ES/EN
7. **Accessibility**: VoiceOver, font scaling

---

**Fecha**: Diciembre 2025  
**Versión**: 1.0.0-alpha  
**Autor**: Lead Engineer
