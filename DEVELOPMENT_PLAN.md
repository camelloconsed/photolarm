# 🚀 PHOTOLARM - Plan de Desarrollo Completo

**Última actualización**: 19 de diciembre de 2025  
**Versión**: 1.0

---

## 📋 Índice

1. [Visión del Producto](#visión-del-producto)
2. [Estado Actual](#estado-actual)
3. [Roadmap Priorizado](#roadmap-priorizado)
4. [Fases de Desarrollo](#fases-de-desarrollo)
5. [Detalles Técnicos por Feature](#detalles-técnicos-por-feature)
6. [Testing Strategy](#testing-strategy)
7. [Deployment & Release](#deployment--release)

---

## 🎯 Visión del Producto

### Problema a Resolver
Las personas olvidan tomar medicamentos, asistir a citas médicas, o seguir tratamientos porque:
- Configurar alarmas manualmente es tedioso y propenso a errores
- Los documentos médicos tienen información compleja (dosis, intervalos, duración)
- No hay forma fácil de convertir una receta en recordatorios automáticos

### Solución: Photolarm
Una app móvil que convierte **documentos médicos en alarmas inteligentes** usando IA.

### Propuesta de Valor
1. **Para usuarios finales**: 
   - Toma foto de receta → alarmas automáticas en 30 segundos
   - Seguimiento de tratamientos sin esfuerzo
   
2. **Para empresas (B2B)**:
   - Hospitales/clínicas generan QR codes para pacientes
   - Pacientes escanean QR → alarmas instaladas automáticamente
   - Mejor adherencia al tratamiento = mejores resultados

---

## 📊 Estado Actual

### ✅ Implementado (70% del MVP)

#### Arquitectura Base
- [x] Proyecto Expo configurado (SDK 54)
- [x] TypeScript + Zod para type safety
- [x] React Navigation configurada
- [x] Zustand stores con AsyncStorage persistence
- [x] Hot reload funcionando (Development Build instalado en Android)

#### Tipos y Modelos de Datos
- [x] 48 tipos TypeScript completos
- [x] Schemas Zod para validación runtime
- [x] Tipos para planes Fixed y Flexible
- [x] Tipos para QR payloads (B2B)

#### Servicios Core
- [x] **ExtractorService** (OpenAI + Mock)
  - Prompt optimizado para extracción médica
  - Manejo de abreviaturas médicas
  - Mock service para testing sin API
- [x] **StorageService** (AsyncStorage + Mock)
  - Wrapper type-safe
  - Persistencia de planes y schedules

#### Motor de Schedules
- [x] **ScheduleGenerator** (650 líneas)
  - Generación de alarmas Fixed (fechas específicas)
  - Generación de alarmas Flexible (3 modos)
  - Optimización de hora de inicio (recomendación)
  - Sistema de constraints (8 tipos)
  - Scoring de schedules

#### State Management (Zustand)
- [x] **PreferencesStore** - Configuración usuario
- [x] **PlansStore** - CRUD de planes extraídos
- [x] **SchedulesStore** - CRUD de schedules y alarmas

#### UI Components
- [x] **ActionButtons** - Botones Cancel/Confirm consistentes
- [x] **Button** - 4 variantes, 3 tamaños, loading states
- [x] **Card** - Contenedor reutilizable
- [x] **Input** - Inputs con validación
- [x] **AlarmCard** - Tarjeta especializada para alarmas
- [x] **PlanCard** - Tarjeta especializada para planes
- [x] **EmptyState** - Estados vacíos
- [x] **LoadingSpinner** - Indicadores de carga

#### Screens Implementadas
- [x] **HomeScreen** - Dashboard con próximas alarmas
- [x] **TextImportScreen** - Importar texto/copiar-pegar
- [x] **ResultsScreen** - Revisar planes extraídos
- [x] **PreviewScheduleScreen** - Preview de alarmas antes de confirmar

#### Bugs Recientes Solucionados
- [x] Infinite loop por duplicate keys en plans
- [x] Button layout overflow (creación de ActionButtons)
- [x] Text sizing en botones (adjustsFontSizeToFit)
- [x] Altura fija de botones para consistencia visual

---

### ❌ No Implementado (30% restante para MVP + Features B2B)

#### Servicios Faltantes
- [ ] **OCR Service** (Google Cloud Vision API)
- [ ] **PDF Service** (extracción de texto)
- [ ] **Scheduler Service** (expo-notifications)
- [ ] **QR Service** (generación y escaneo)
- [ ] **Camera Service** (tomar fotos de documentos)

#### Screens Faltantes
- [ ] **CameraScreen** - Captura de documentos
- [ ] **PhotoReviewScreen** - Revisar foto antes de procesar
- [ ] **PDFImportScreen** - Importar y procesar PDFs
- [ ] **QRScanScreen** - Escanear QR de empresas
- [ ] **QRStudioScreen** (B2B) - Generar QRs para pacientes
- [ ] **SettingsScreen** - Preferencias de usuario
- [ ] **AlarmDetailScreen** - Detalles de alarma individual
- [ ] **HistoryScreen** - Historial de documentos procesados

#### Funcionalidades Core
- [ ] Integración real con OpenAI API
- [ ] Procesamiento de imágenes con OCR
- [ ] Programación real de notificaciones nativas
- [ ] Sistema de permisos (cámara, notificaciones, almacenamiento)
- [ ] Manejo de alarmas en background
- [ ] Snooze y complete de alarmas

#### Features B2B (QR Studio)
- [ ] Generación criptográfica de QR codes
- [ ] Firma digital de payloads (Ed25519)
- [ ] Modo Enterprise con backend
- [ ] Panel para médicos/clínicas

---

## 🗺️ Roadmap Priorizado

### Fase 1: MVP Funcional (2-3 semanas)
**Objetivo**: App que funcione end-to-end con Foto + Texto

**Entregables**:
1. Integración real con OpenAI API ✅ (código ya existe, solo configurar API key)
2. OCR Service con Google Cloud Vision API
3. Camera Service + CameraScreen
4. Scheduler Service + notificaciones reales
5. Sistema de permisos completo
6. Testing con casos reales (recetas médicas)

**User Flow**:
```
Usuario abre app
  → Toma foto de receta O pega texto
  → AI extrae plan de medicación
  → Usuario revisa plan
  → Usuario selecciona modo de inicio (ahora/hora específica/recomendada)
  → Preview de alarmas
  → Confirma → Alarmas programadas
  → Recibe notificaciones en horarios correctos
```

---

### Fase 2: Funcionalidades Avanzadas (1-2 semanas)
**Objetivo**: Mejorar UX y agregar features secundarios

**Entregables**:
1. PDF Import + PDFImportScreen
2. SettingsScreen con configuración avanzada
3. HistoryScreen - ver documentos anteriores
4. AlarmDetailScreen - editar alarmas individuales
5. Manejo de alarmas recurrentes
6. Optimización de batería

**Mejoras de UX**:
- Onboarding para nuevos usuarios
- Tutorial interactivo
- Mejora de mensajes de error
- Loading skeletons
- Animaciones suaves

---

### Fase 3: B2B - QR Studio (2-3 semanas)
**Objetivo**: Habilitar modo empresa para hospitales/clínicas

**Entregables**:
1. QR Service con criptografía (TweetNaCl)
2. QRStudioScreen para generar QRs
3. QRScanScreen para escanear QRs
4. Sistema de firma digital
5. Validación de QR codes
6. Dashboard B2B (opcional: web panel separado)

**Modos de QR**:
- **MVP Mode**: Plan embebido en QR (~2KB limit)
- **Enterprise Mode**: Referencia + fetch desde backend

---

### Fase 4: Polish & Launch (1-2 semanas)
**Objetivo**: Preparar para lanzamiento público

**Entregables**:
1. Testing exhaustivo (unit + integration + E2E)
2. Performance optimization
3. Diseño final de iconos y splash screen
4. App Store assets (screenshots, descripción)
5. Privacy Policy y Terms of Service
6. Build de producción con EAS
7. Submit a Google Play Store (Android primero)
8. Beta testing con usuarios reales

---

## 🛠️ Fases de Desarrollo - Detalle

## FASE 1: MVP FUNCIONAL

### 1.1 Integración OpenAI Real
**Prioridad**: P0 (Crítico)  
**Tiempo estimado**: 1-2 horas  
**Status**: ⚠️ Código existe, solo falta configurar API key

**Tareas**:
- [ ] Crear cuenta OpenAI (si no existe)
- [ ] Obtener API key
- [ ] Crear archivo `.env` en raíz del proyecto
- [ ] Agregar `OPENAI_API_KEY=sk-...` a `.env`
- [ ] Instalar `react-native-dotenv` para leer variables de entorno
- [ ] Actualizar `extractor.service.ts` para usar API key real
- [ ] Testing con textos de ejemplo

**Código necesario**:
```bash
npm install react-native-dotenv
```

```typescript
// src/services/extractor.service.ts
import { OPENAI_API_KEY } from '@env';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});
```

**Criterios de éxito**:
- ✅ Pegar texto de receta → obtener plan estructurado
- ✅ Manejo de errores de API (rate limit, network)
- ✅ Fallback a MockExtractor si API falla

---

### 1.2 OCR Service (Google Cloud Vision)
**Prioridad**: P0 (Crítico)  
**Tiempo estimado**: 4-6 horas

**Tareas**:
- [ ] Crear proyecto en Google Cloud Console
- [ ] Habilitar Vision API
- [ ] Obtener API key
- [ ] Agregar `GOOGLE_CLOUD_VISION_API_KEY` a `.env`
- [ ] Implementar `OCRService` en `src/services/ocr.service.ts`
- [ ] Testing con fotos de recetas

**Implementación**:
```typescript
// src/services/ocr.service.ts
import { GOOGLE_CLOUD_VISION_API_KEY } from '@env';

export class GoogleVisionOCRService implements IOCRService {
  async extractText(base64Image: string): Promise<OCRResult> {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }]
          }]
        })
      }
    );
    
    const data = await response.json();
    const text = data.responses[0]?.fullTextAnnotation?.text || '';
    
    return {
      text,
      confidence: calculateConfidence(data),
      language: 'es',
    };
  }
}
```

**Criterios de éxito**:
- ✅ Foto de receta → texto extraído con >85% precisión
- ✅ Manejo de errores (imagen borrosa, sin texto)
- ✅ Fallback: permitir edición manual del texto

---

### 1.3 Camera Service + CameraScreen
**Prioridad**: P0 (Crítico)  
**Tiempo estimado**: 6-8 horas

**Dependencias**:
```bash
# Ya instalado: expo-camera
npx expo install expo-image-manipulator
```

**Tareas**:
- [ ] Implementar `CameraService` en `src/services/camera.service.ts`
- [ ] Crear `CameraScreen.tsx`
- [ ] Crear `PhotoReviewScreen.tsx`
- [ ] Sistema de permisos de cámara
- [ ] UI para captura (botón, flash, flip camera)
- [ ] Pre-procesamiento de imagen (resize, contrast)

**Flow**:
```
HomeScreen
  → Presiona botón "📸 Tomar foto"
  → CameraScreen (pedir permisos)
  → Captura foto
  → PhotoReviewScreen (preview + retocar/recapturar)
  → Confirma → OCR processing
  → TextImportScreen (con texto pre-llenado + editable)
  → ResultsScreen
```

**Código base**:
```typescript
// src/screens/CameraScreen.tsx
import { CameraView, useCameraPermissions } from 'expo-camera';

export function CameraScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      base64: true,
    });
    
    navigation.navigate('PhotoReview', { photoUri: photo.uri });
  };
  
  if (!permission?.granted) {
    return <PermissionScreen onRequest={requestPermission} />;
  }
  
  return (
    <CameraView ref={cameraRef} style={styles.camera}>
      <ShutterButton onPress={takePicture} />
    </CameraView>
  );
}
```

**Criterios de éxito**:
- ✅ Tomar foto con buena calidad
- ✅ Manejo correcto de permisos
- ✅ Preview antes de procesar
- ✅ Retry si foto salió mal

---

### 1.4 Scheduler Service (Notificaciones)
**Prioridad**: P0 (Crítico)  
**Tiempo estimado**: 8-10 horas

**Tareas**:
- [ ] Implementar `SchedulerService` en `src/services/scheduler.service.ts`
- [ ] Sistema de permisos de notificaciones
- [ ] Programación de alarmas locales
- [ ] Manejo de alarmas recurrentes
- [ ] Background tasks para re-scheduling
- [ ] Testing en Android real

**Implementación**:
```typescript
// src/services/scheduler.service.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class ExpoSchedulerService implements ISchedulerService {
  async initialize(): Promise<void> {
    // Pedir permisos
    if (Device.isDevice) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permisos de notificaciones denegados');
      }
    }
  }
  
  async createAlarms(schedule: Schedule): Promise<string[]> {
    const notificationIds: string[] = [];
    
    for (const alarm of schedule.alarms) {
      const trigger = this.createTrigger(alarm);
      
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: alarm.title,
          body: alarm.body || '',
          data: { alarmId: alarm.id, scheduleId: schedule.id },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });
      
      notificationIds.push(id);
    }
    
    return notificationIds;
  }
  
  private createTrigger(alarm: Alarm) {
    const datetime = new Date(alarm.datetime);
    
    if (alarm.repeat) {
      // Recurrente
      return {
        hour: datetime.getHours(),
        minute: datetime.getMinutes(),
        repeats: true,
      };
    } else {
      // Una sola vez
      return {
        date: datetime,
      };
    }
  }
  
  async cancelAlarm(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
  
  async cancelAllAlarms(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}
```

**Limitaciones conocidas**:
- iOS limita a 64 notificaciones programadas máximo
- Solución: programar las próximas 7 días, re-schedule en background

**Tareas adicionales**:
- [ ] Background task para re-scheduling
- [ ] Listener de notificaciones (cuando usuario toca)
- [ ] Actualizar SchedulesStore cuando alarma se dispara
- [ ] Persistir notificationIds en store

**Criterios de éxito**:
- ✅ Alarmas se disparan en horario correcto
- ✅ Sonido y vibración funcionan
- ✅ Al tocar notificación, app abre en AlarmDetailScreen
- ✅ Botones de complete/snooze en notificación (Android)

---

### 1.5 Integración End-to-End
**Prioridad**: P0 (Crítico)  
**Tiempo estimado**: 4-6 horas

**Tareas**:
- [ ] Conectar CameraScreen → OCR → TextImport → Results → Preview
- [ ] Integrar SchedulerService en PreviewScheduleScreen
- [ ] Persistir schedules con notificationIds
- [ ] Testing del flujo completo
- [ ] Manejo de errores en cada paso

**Flow Completo**:
```
1. HomeScreen → "📸 Tomar foto"
2. CameraScreen → captura
3. PhotoReviewScreen → confirma
4. OCR processing (loading)
5. TextImportScreen (texto editable)
6. Usuario confirma → OpenAI extraction (loading)
7. ResultsScreen → selecciona plan
8. Usuario elige modo de inicio:
   - Ahora
   - Hora específica (DateTimePicker)
   - Hora recomendada (auto-optimizada)
9. PreviewScheduleScreen → lista de alarmas
10. Usuario confirma → SchedulerService programa notificaciones
11. HomeScreen actualizada con nuevas alarmas
12. ✅ Primera notificación se dispara!
```

**Criterios de éxito**:
- ✅ Usuario puede completar flujo sin crashes
- ✅ Errores se manejan gracefully
- ✅ Loading states claros
- ✅ Alarmas realmente suenan

---

## FASE 2: FUNCIONALIDADES AVANZADAS

### 2.1 PDF Import
**Prioridad**: P1 (Importante)  
**Tiempo estimado**: 6-8 horas

**Dependencias**:
```bash
# Ya instalado: expo-document-picker
npx expo install expo-sharing
```

**Tareas**:
- [ ] Implementar `PDFService` en `src/services/pdf.service.ts`
- [ ] Crear `PDFImportScreen.tsx`
- [ ] Extracción de texto de PDF
- [ ] Testing con PDFs de recetas

**Opciones técnicas**:
1. **Opción A**: PDF.js (pesado pero preciso)
2. **Opción B**: API externa (pdf.co, Adobe PDF Extract)
3. **Opción C**: OCR sobre imágenes renderizadas del PDF

**Implementación sugerida** (Opción B - API externa):
```typescript
// src/services/pdf.service.ts
export class PDFService implements IPDFService {
  async extractText(pdfUri: string): Promise<string> {
    // 1. Leer PDF como base64
    const base64 = await FileSystem.readAsStringAsync(pdfUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // 2. Enviar a API de extracción (ej: pdf.co)
    const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
      method: 'POST',
      headers: {
        'x-api-key': PDF_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: base64 }),
    });
    
    const data = await response.json();
    return data.text;
  }
}
```

---

### 2.2 Settings Screen
**Prioridad**: P1 (Importante)  
**Tiempo estimado**: 4-6 horas

**Features**:
- [ ] Editar ventana de sueño
- [ ] Editar horarios de comidas
- [ ] Timezone
- [ ] Sonido de notificaciones
- [ ] Vibración
- [ ] Idioma (futuro)
- [ ] Borrar todos los datos
- [ ] About / Version

---

### 2.3 History Screen
**Prioridad**: P2 (Deseable)  
**Tiempo estimado**: 4-6 horas

**Features**:
- [ ] Lista de documentos procesados
- [ ] Ver plans de cada documento
- [ ] Re-generar schedules
- [ ] Eliminar historial

---

### 2.4 Alarm Detail Screen
**Prioridad**: P1 (Importante)  
**Tiempo estimado**: 4-6 horas

**Features**:
- [ ] Ver detalles completos de alarma
- [ ] Editar hora
- [ ] Editar repetición
- [ ] Desactivar temporalmente
- [ ] Eliminar

---

## FASE 3: B2B - QR STUDIO

### 3.1 QR Service
**Prioridad**: P2 (B2B)  
**Tiempo estimado**: 8-10 horas

**Dependencias**:
```bash
npm install react-native-qrcode-svg
npm install tweetnacl tweetnacl-util
npm install @types/tweetnacl
```

**Tareas**:
- [ ] Implementar generación de QR codes
- [ ] Firma criptográfica con Ed25519
- [ ] Validación de firmas
- [ ] Escaneo de QR codes

**Implementación**:
```typescript
// src/services/qr.service.ts
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import QRCode from 'react-native-qrcode-svg';

export class QRService implements IQRService {
  // Generar par de claves (solo una vez, guardar en storage)
  generateKeyPair(): { publicKey: string; secretKey: string } {
    const keyPair = nacl.sign.keyPair();
    return {
      publicKey: naclUtil.encodeBase64(keyPair.publicKey),
      secretKey: naclUtil.encodeBase64(keyPair.secretKey),
    };
  }
  
  // Firmar payload
  signPayload(payload: QRPayload, secretKey: string): SignedQRPayload {
    const message = JSON.stringify(payload);
    const messageUint8 = naclUtil.decodeUTF8(message);
    const secretKeyUint8 = naclUtil.decodeBase64(secretKey);
    
    const signature = nacl.sign.detached(messageUint8, secretKeyUint8);
    
    return {
      payload,
      signature: naclUtil.encodeBase64(signature),
      publicKey: naclUtil.encodeBase64(
        nacl.sign.keyPair.fromSecretKey(secretKeyUint8).publicKey
      ),
    };
  }
  
  // Verificar firma
  verifySignature(signedPayload: SignedQRPayload): boolean {
    const message = JSON.stringify(signedPayload.payload);
    const messageUint8 = naclUtil.decodeUTF8(message);
    const signatureUint8 = naclUtil.decodeBase64(signedPayload.signature);
    const publicKeyUint8 = naclUtil.decodeBase64(signedPayload.publicKey);
    
    return nacl.sign.detached.verify(
      messageUint8,
      signatureUint8,
      publicKeyUint8
    );
  }
  
  // Generar QR code
  generateQR(plan: Plan, clinicInfo: ClinicInfo): QRPayload {
    return {
      version: 1,
      type: 'embedded',
      plan,
      clinic: clinicInfo,
      createdAt: new Date().toISOString(),
    };
  }
}
```

---

### 3.2 QR Studio Screen
**Prioridad**: P2 (B2B)  
**Tiempo estimado**: 6-8 horas

**Features**:
- [ ] Form para crear plan manualmente
- [ ] O importar plan desde documento
- [ ] Generar QR firmado
- [ ] Preview del QR
- [ ] Compartir QR (imagen o PDF)
- [ ] Historial de QRs generados

---

### 3.3 QR Scan Screen
**Prioridad**: P2 (B2B)  
**Tiempo estimado**: 4-6 horas

**Dependencias**:
```bash
npx expo install expo-barcode-scanner
```

**Features**:
- [ ] Escanear QR code
- [ ] Validar firma
- [ ] Mostrar preview del plan
- [ ] Confirmar → Generar schedule
- [ ] Manejar errores (QR inválido, firma incorrecta)

---

## FASE 4: POLISH & LAUNCH

### 4.1 Testing
**Prioridad**: P0 (Crítico)  
**Tiempo estimado**: 1 semana

**Tipos de testing**:
1. **Unit tests** (Jest)
   - Stores (Zustand)
   - Schedule generator
   - Validators

2. **Integration tests**
   - Flujo completo E2E
   - Integración con APIs

3. **Manual testing**
   - Testing en Android real
   - Testing con diferentes tipos de recetas
   - Edge cases

**Casos de prueba**:
- [ ] Receta con medicamento cada 8 horas por 7 días
- [ ] Receta con múltiples medicamentos
- [ ] Cita médica específica
- [ ] Tratamiento con horarios de comida
- [ ] QR code de clínica
- [ ] Pérdida de conexión durante procesamiento
- [ ] Notificaciones en background

---

### 4.2 Performance Optimization
**Prioridad**: P1 (Importante)  
**Tiempo estimado**: 3-4 días

**Áreas**:
- [ ] Optimizar re-renders (React.memo)
- [ ] Lazy loading de screens
- [ ] Image optimization
- [ ] Bundle size analysis
- [ ] Memory leaks check

---

### 4.3 App Store Preparation
**Prioridad**: P0 (Crítico)  
**Tiempo estimado**: 3-4 días

**Assets necesarios**:
- [ ] App icon (1024x1024)
- [ ] Splash screen
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (mínimo 2, ideal 5-8)
- [ ] App description (español + inglés)
- [ ] Privacy Policy
- [ ] Terms of Service

**Build de producción**:
```bash
# EAS Build
eas build --platform android --profile production
```

---

### 4.4 Beta Testing
**Prioridad**: P1 (Importante)  
**Tiempo estimado**: 1-2 semanas

**Plan**:
1. Internal testing (5-10 usuarios cercanos)
2. Closed beta (Google Play Internal Testing)
3. Open beta (100-500 usuarios)
4. Feedback collection
5. Bug fixes críticos
6. Lanzamiento público

---

## 📝 Detalles Técnicos por Feature

### Sistema de Permisos

**Permisos necesarios**:
- Camera (obligatorio para foto)
- Notifications (obligatorio para alarmas)
- Storage (opcional para PDFs)

**Implementación**:
```typescript
// src/services/permissions.service.ts
import * as Notifications from 'expo-notifications';
import * as Camera from 'expo-camera';

export class PermissionsService {
  async requestCamera(): Promise<boolean> {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  }
  
  async requestNotifications(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
  
  async checkAllPermissions(): Promise<{
    camera: boolean;
    notifications: boolean;
  }> {
    const cameraStatus = await Camera.getCameraPermissionsAsync();
    const notifStatus = await Notifications.getPermissionsAsync();
    
    return {
      camera: cameraStatus.status === 'granted',
      notifications: notifStatus.status === 'granted',
    };
  }
}
```

---

### Error Handling Strategy

**Tipos de errores**:
1. **Network errors** (API down, sin internet)
2. **API errors** (rate limit, invalid response)
3. **User errors** (permisos denegados, input inválido)
4. **System errors** (crashes, out of memory)

**Estrategia**:
```typescript
// src/utils/error-handler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public recoverable: boolean = true
  ) {
    super(message);
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('Network')) {
      return new AppError(
        error.message,
        'NETWORK_ERROR',
        'Sin conexión a internet. Revisa tu conexión e intenta de nuevo.',
        true
      );
    }
    
    // OpenAI API errors
    if (error.message.includes('rate_limit')) {
      return new AppError(
        error.message,
        'RATE_LIMIT',
        'Límite de uso alcanzado. Intenta de nuevo en unos minutos.',
        true
      );
    }
  }
  
  // Unknown error
  return new AppError(
    String(error),
    'UNKNOWN_ERROR',
    'Algo salió mal. Intenta de nuevo.',
    true
  );
}
```

**UI para errores**:
- Toast notifications para errores menores
- Alert dialogs para errores críticos
- ErrorBoundary para crashes
- Retry buttons cuando es recuperable

---

### Offline Support (Futuro)

**Estrategia**:
1. **Queue de procesamiento**: Guardar documentos para procesar cuando haya internet
2. **Cache de planes**: Permitir ver planes anteriores offline
3. **Notificaciones locales**: Funcionan sin internet una vez programadas

---

## 🧪 Testing Strategy

### Unit Tests (Jest)

**Archivo**: `src/lib/__tests__/schedule-generator.test.ts`

```typescript
describe('ScheduleGenerator', () => {
  it('should generate fixed schedule correctly', () => {
    const plan: Plan = {
      mode: 'fixed',
      fixed_events: [{
        datetime: '2025-12-25T10:00:00Z',
        title: 'Cita con Dr. González',
      }],
    };
    
    const schedule = generateFixedSchedule(plan);
    expect(schedule.alarms).toHaveLength(1);
    expect(schedule.alarms[0].datetime).toBe('2025-12-25T10:00:00Z');
  });
  
  it('should generate flexible schedule with interval', () => {
    const plan: Plan = {
      mode: 'flexible',
      flexible_pattern: {
        items: [{
          medication_name: 'Amoxicilina',
          interval_hours: 8,
          duration_days: 7,
        }],
      },
    };
    
    const anchor: Anchor = {
      type: 'now',
      datetime: '2025-12-19T08:00:00Z',
    };
    
    const schedule = generateFlexibleSchedule(plan, anchor);
    expect(schedule.alarms.length).toBe(21); // 3 veces al día x 7 días
  });
});
```

---

### Integration Tests

**Archivo**: `src/__tests__/integration/extraction-flow.test.ts`

```typescript
describe('Extraction Flow', () => {
  it('should extract plan from text', async () => {
    const text = 'Amoxicilina 500mg cada 8 horas por 7 días';
    const result = await extractorService.extract({
      type: 'text',
      content: text,
    });
    
    expect(result.plans).toHaveLength(1);
    expect(result.plans[0].mode).toBe('flexible');
  });
});
```

---

## 🚀 Deployment & Release

### Build Configuration

**Archivo**: `eas.json`

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./path/to/api-key.json"
      }
    }
  }
}
```

### Release Checklist

**Pre-lanzamiento**:
- [ ] Todos los tests pasan
- [ ] No hay console.logs en producción
- [ ] API keys en variables de entorno (no hardcoded)
- [ ] Versionado correcto (semver)
- [ ] Changelog actualizado

**Build de producción**:
```bash
# 1. Actualizar versión
# package.json: "version": "1.0.0"
# app.json: "version": "1.0.0", "android.versionCode": 1

# 2. Build
eas build --platform android --profile production

# 3. Submit
eas submit --platform android --latest
```

**Post-lanzamiento**:
- [ ] Monitor de crashes (Sentry)
- [ ] Analytics básicas (usuarios activos)
- [ ] Feedback collection
- [ ] Support plan

---

## 📊 Métricas de Éxito

### MVP (Fase 1)
- ✅ 10 usuarios testers completaron flujo end-to-end
- ✅ >80% de extracción correcta de recetas
- ✅ 0 crashes críticos
- ✅ Notificaciones suenan en 100% de los casos

### Post-launch
- 100 usuarios activos en primer mes
- 70% de retención a 7 días
- <5% crash rate
- 4+ estrellas en Play Store

### B2B
- 3 clínicas piloto usando QR Studio
- 500+ pacientes con alarmas desde QR
- Feedback positivo de médicos

---

## 🎯 Próximos Pasos Inmediatos

### Esta Semana (19-26 Dic)
1. **Configurar OpenAI API** (2h)
   - Obtener API key
   - Integrar en extractor service
   - Testing con textos reales

2. **Configurar Google Cloud Vision** (4h)
   - Crear proyecto
   - Obtener API key
   - Implementar OCR service

3. **Camera Screen** (8h)
   - Implementar UI
   - Manejo de permisos
   - PhotoReviewScreen

4. **Scheduler Service** (10h)
   - Implementar notificaciones
   - Testing en Android
   - Background scheduling

5. **Integración E2E** (6h)
   - Conectar todos los servicios
   - Testing flujo completo
   - Bug fixing

**Total**: ~30 horas → MVP funcional en 1 semana de trabajo full-time

---

## 📚 Recursos y Referencias

### Documentación
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)

### Ejemplos de código
- [Expo Notifications Example](https://github.com/expo/examples/tree/master/with-notifications)
- [Camera + OCR Example](https://github.com/expo/examples/tree/master/with-camera)

---

## 🤝 Colaboración y Feedback

### Proceso de desarrollo
1. Desarrollo en branch feature
2. Testing local en Android
3. Merge a `main` cuando está estable
4. Hot reload permite iteración rápida

### Comunicación
- Documentar decisiones importantes en commits
- Actualizar STATUS.md semanalmente
- Crear issues para bugs
- Celebrar milestones 🎉

---

**Última actualización**: 19 de diciembre de 2025  
**Próxima revisión**: Después de completar MVP (Fase 1)

