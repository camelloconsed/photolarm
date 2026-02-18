# Photolarm - Plan de Implementación

## ✅ COMPLETADO (Paso 1 & 2)

- [x] Proyecto Expo inicializado
- [x] Dependencias instaladas
- [x] Estructura de carpetas creada
- [x] Tipos TypeScript y schemas Zod definidos
- [x] Interfaces de servicios definidas
- [x] Prompt del LLM extractor creado
- [x] Servicio de extracción OpenAI implementado (con mock)
- [x] Constantes y configuración base
- [x] Documentación de arquitectura

## 🚧 PASO 3: Servicios Restantes

### 3.1 Storage Service (MMKV)
**Archivo**: `src/services/storage.service.ts`

```typescript
import { MMKV } from 'react-native-mmkv';

export class MMKVStorageService implements IStorageService {
  private storage: MMKV;
  
  constructor() {
    this.storage = new MMKV();
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    this.storage.set(key, JSON.stringify(value));
  }
  
  async get<T>(key: string): Promise<T | null> {
    const raw = this.storage.getString(key);
    return raw ? JSON.parse(raw) : null;
  }
  
  // ... resto de métodos
}
```

### 3.2 OCR Service (Google Cloud Vision)
**Archivo**: `src/services/ocr.service.ts`

**API de Google Cloud Vision**:
```typescript
POST https://vision.googleapis.com/v1/images:annotate
{
  "requests": [{
    "image": { "content": "base64ImageData" },
    "features": [{ "type": "TEXT_DETECTION" }]
  }]
}
```

### 3.3 PDF Service
**Archivo**: `src/services/pdf.service.ts`

Usar `react-native-pdf` o `expo-file-system` + API externa para extracción.

### 3.4 Scheduler Service (expo-notifications)
**Archivo**: `src/services/scheduler.service.ts`

```typescript
import * as Notifications from 'expo-notifications';

export class ExpoSchedulerService implements ISchedulerService {
  async createAlarms(schedule: Schedule): Promise<string[]> {
    const ids: string[] = [];
    
    for (const alarm of schedule.alarms) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: alarm.title,
          body: alarm.body,
        },
        trigger: {
          date: new Date(alarm.datetime),
        },
      });
      
      ids.push(id);
    }
    
    return ids;
  }
  
  // ... resto
}
```

### 3.5 QR Service
**Archivo**: `src/services/qr.service.ts`

Usar:
- `react-native-qrcode-svg` para generación
- `tweetnacl` para firmas Ed25519

## 🚧 PASO 4: Motor de Schedule

### 4.1 Schedule Generator
**Archivo**: `src/lib/schedule-generator.ts`

Implementar:
- `generateFixedSchedule()`
- `generateFlexibleSchedule()`
- `recommendAnchor()`

### 4.2 Constraint Resolver
**Archivo**: `src/lib/constraint-resolver.ts`

Resolver constraints como:
- `with_meal` → ajustar a meal time
- `avoid_sleep` → evitar sleep window
- `before_sleep` → programar antes de dormir

### 4.3 Utilidades de Fecha
**Archivo**: `src/lib/date-utils.ts`

Usar `date-fns` para:
- Parsing de fechas relativas
- Cálculos de intervalos
- Timezone handling

## 🚧 PASO 5: Zustand Stores

### 5.1 Preferences Store
**Archivo**: `src/store/usePreferencesStore.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const usePreferencesStore = create(
  persist(
    (set) => ({
      preferences: null,
      setPreferences: (prefs) => set({ preferences: prefs }),
    }),
    {
      name: 'preferences',
      storage: createJSONStorage(() => ({
        getItem: (key) => storage.getString(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      })),
    }
  )
);
```

### 5.2 Plans Store
**Archivo**: `src/store/usePlansStore.ts`

Maneja:
- Lista de planes extraídos
- Plan actualmente editándose
- Historial de planes

### 5.3 Schedules Store
**Archivo**: `src/store/useSchedulesStore.ts`

Maneja:
- Schedules creados
- Alarmas activas
- Estado de alarmas (triggered, completed)

### 5.4 Documents Store
**Archivo**: `src/store/useDocumentsStore.ts`

Historial de documentos procesados.

## 🚧 PASO 6: Componentes UI

### 6.1 Componentes Básicos
**Carpeta**: `src/components/`

- `Button.tsx`
- `Card.tsx`
- `Input.tsx`
- `LoadingSpinner.tsx`
- `Alert.tsx`

### 6.2 Componentes Específicos
- `PlanCard.tsx`: Mostrar plan extraído
- `AlarmListItem.tsx`: Item de alarma en lista
- `ConstraintBadge.tsx`: Badge visual para constraints
- `AnchorPicker.tsx`: Selector de ancla (now/custom/recommended)

## 🚧 PASO 7: Pantallas (Screens)

### 7.1 HomeScreen
**Archivo**: `src/screens/HomeScreen.tsx`

4 botones principales:
- 📸 Tomar Foto
- 📄 Importar PDF
- ✍️ Pegar Texto
- 📱 Escanear QR

### 7.2 PhotoImportScreen
**Archivo**: `src/screens/PhotoImportScreen.tsx`

1. Cámara (expo-camera)
2. OCR → texto
3. Mostrar texto extraído (editable)
4. Botón "Analizar"

### 7.3 ResultsScreen
**Archivo**: `src/screens/ResultsScreen.tsx`

Lista de planes detectados con:
- Domain badge
- Confidence score
- Evidence quote
- Botón "Configurar"

### 7.4 PlanConfigScreen
**Archivo**: `src/screens/PlanConfigScreen.tsx`

**Si Fixed**:
- Lista de eventos
- Toggle anticipación
- Configurar repeticiones

**Si Flexible**:
- Selector de ancla:
  - [ ] Desde ahora
  - [ ] Desde hora elegida (DatePicker)
  - [ ] Hora recomendada (mostrar razón)

### 7.5 PreviewScheduleScreen
**Archivo**: `src/screens/PreviewScheduleScreen.tsx`

FlatList de alarmas con:
- Datetime
- Title
- Toggle enable/disable individual
- Botón "Crear Todas"

### 7.6 SettingsScreen
**Archivo**: `src/screens/SettingsScreen.tsx`

Formulario para:
- Sleep window
- Night shift mode
- Meal times
- DND settings

### 7.7 QrStudioScreen (B2B)
**Archivo**: `src/screens/QrStudioScreen.tsx`

Herramienta para generar QRs:
1. Seleccionar plan (de lista o nuevo)
2. Elegir tipo (embedded/reference)
3. Configurar expiración
4. Generar y mostrar QR
5. Opción de compartir

## 🚧 PASO 8: Navegación

### 8.1 App Navigator
**Archivo**: `src/navigation/AppNavigator.tsx`

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PhotoImport" component={PhotoImportScreen} />
        {/* ... resto */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### 8.2 Actualizar App.tsx
```typescript
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}
```

## 🚧 PASO 9: Permisos y Setup Inicial

### 9.1 Notification Permissions
```typescript
// En App.tsx o useEffect inicial
await Notifications.requestPermissionsAsync();
```

### 9.2 Camera Permissions
```typescript
await Camera.requestCameraPermissionsAsync();
```

### 9.3 Variables de Entorno
Crear `.env`:
```
OPENAI_API_KEY=sk-...
GOOGLE_CLOUD_VISION_API_KEY=AIza...
```

Usar `react-native-dotenv` o similar.

## 🚧 PASO 10: Testing

### 10.1 Unit Tests
**Carpeta**: `__tests__/`

- `schedule-generator.test.ts`
- `constraint-resolver.test.ts`
- `date-utils.test.ts`
- Schemas Zod validation tests

### 10.2 Integration Tests
- Mock extractor service
- Mock OCR service
- Test full flow: text → extract → schedule

## 🚧 PASO 11: Pulir y Optimizar

### 11.1 Error Handling
- Agregar boundaries de error
- Manejo de API failures
- Retry logic

### 11.2 Loading States
- Skeletons mientras carga
- Progress indicators

### 11.3 Optimización
- Memoization con React.memo
- useMemo/useCallback en componentes
- FlatList virtualization

## 🚧 PASO 12: QR Enterprise (Backend)

### 12.1 Backend Endpoints
```
POST /api/plans          # Crear plan
GET  /api/plans/:id      # Obtener plan
POST /api/qr/generate    # Generar QR firmado
POST /api/qr/validate    # Validar firma
```

### 12.2 Autenticación
- API keys para clínicas
- Rate limiting

## 📋 ORDEN RECOMENDADO DE IMPLEMENTACIÓN

1. ✅ Setup y tipos (HECHO)
2. **Storage Service** → Base para todo lo demás
3. **Schedule Generator** → Lógica core
4. **Zustand Stores** → Estado de la app
5. **Componentes básicos** → UI foundation
6. **HomeScreen + Navigation** → Estructura navegable
7. **TextImportScreen** → Más fácil para testear extractor
8. **ResultsScreen + PlanConfigScreen** → Flujo básico
9. **PreviewScheduleScreen** → Ver alarmas
10. **Scheduler Service** → Crear notificaciones reales
11. **PhotoImportScreen (OCR)** → Feature completo
12. **PdfImportScreen** → Similar a foto
13. **QrScanScreen** → Escanear QRs
14. **SettingsScreen** → Preferencias
15. **QrStudioScreen** → B2B tool
16. **Testing** → Validar todo
17. **Pulir** → UX/UI refinement

## 🎯 MVP Mínimo (Para Demo)

Si quieres algo funcional rápido:

1. ✅ Setup (HECHO)
2. Storage Service
3. Schedule Generator (solo básico)
4. Zustand Stores (solo Plans + Schedules)
5. HomeScreen
6. TextImportScreen (con mock extractor)
7. ResultsScreen
8. PlanConfigScreen (solo flexible, ancla "now")
9. PreviewScheduleScreen
10. Scheduler Service (expo-notifications)

**Tiempo estimado MVP**: 2-3 días de desarrollo

## 📝 Notas Importantes

### API Keys Necesarias
- OpenAI (para extractor real)
- Google Cloud Vision (para OCR real)

### Permisos iOS/Android
- Notifications
- Camera
- File access

### Testing
Siempre testear en:
- iOS Simulator
- Android Emulator
- Dispositivo físico (notificaciones funcionan diferente)

---

**¿Por dónde empezar ahora?**

Te recomiendo empezar con:
1. Storage Service
2. Schedule Generator (lógica pura, fácil de testear)
3. Stores básicos

Esto te dará la base para construir el resto de la app. ¿Quieres que implemente alguno de estos pasos ahora?
