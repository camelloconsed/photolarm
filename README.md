# Photolarm

**Alarmas automáticas desde documentos médicos, con IA.**

Photolarm es una aplicación móvil (React Native + Expo) que convierte documentos médicos (recetas, instrucciones de tratamiento) en alarmas y recordatorios inteligentes usando visión por computadora y procesamiento de lenguaje natural.

## 🎯 Características Principales

### Modos de Entrada
- **📸 Foto**: Toma una foto del documento → OCR → Extracción
- **📄 PDF**: Importa un PDF → Extrae texto → Extracción
- **✍️ Texto**: Pega o escribe texto directamente
- **📱 QR**: Escanea un código QR generado por un médico/farmacia

### Tipos de Planes
- **Fixed (Exacto)**: Fechas y horas específicas (ej: "Cita el 25/12 a las 10:00 AM")
- **Flexible (Desde un inicio)**: Intervalos/frecuencias que necesitan un "ancla" (ej: "Cada 8 horas por 7 días")

### Anclas para Planes Flexibles
1. **Desde ahora**: Empieza inmediatamente
2. **Desde una hora elegida**: El usuario selecciona cuándo comenzar
3. **Desde una hora recomendada**: La IA optimiza para minimizar interrupciones de sueño

### QR Studio (B2B)
- Generación de QRs firmados criptográficamente
- Modo MVP: Payload embebido
- Modo Enterprise: Referencia a backend + validación

## 🏗️ Arquitectura Técnica

### Stack
- **Framework**: Expo (React Native + TypeScript)
- **Navegación**: React Navigation
- **Estado**: Zustand con persistencia MMKV
- **Notificaciones**: expo-notifications
- **OCR**: Google Cloud Vision API
- **LLM**: OpenAI GPT-4o-mini
- **Validación**: Zod
- **Criptografía**: TweetNaCl (Ed25519)

### Estructura del Proyecto
```
src/
├── types/          # Tipos TypeScript y schemas Zod
├── services/       # Servicios (OCR, PDF, LLM, Scheduler, QR)
├── lib/            # Utilidades (scheduler engine, crypto)
├── store/          # Zustand stores
├── screens/        # Pantallas de la app
├── components/     # Componentes reutilizables
├── constants/      # Constantes y configuración
└── prompts/        # Prompts del LLM
```

## 🚀 Getting Started

### Prerequisitos
- Node.js >= 20.19.4
- npm o yarn
- Expo CLI
- Cuenta de Google Cloud (para Vision API)
- API Key de OpenAI

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/camelloconsed/photolarm.git
cd photolarm

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys
```

### Configuración de API Keys

Crea un archivo `.env` en la raíz:

```env
OPENAI_API_KEY=sk-...
GOOGLE_CLOUD_VISION_API_KEY=AIza...
```

### Ejecutar la App

```bash
# iOS (requiere macOS y Xcode)
npm run ios

# Android (requiere Android Studio y emulador)
npm run android

# Desarrollo con Expo Go (recomendado para testing rápido)
npm start
# Escanea el QR con Expo Go app en tu dispositivo
```

**Nota**: La app está optimizada solo para iOS y Android. No incluye soporte web.

## 📱 Flujo de Usuario

1. **Home**: Usuario elige método de entrada (Foto/PDF/Texto/QR)
2. **Import**: Captura o importa el documento
3. **Extraction**: El LLM extrae planes de alarmas
4. **Results**: Muestra planes detectados (si hay múltiples)
5. **PlanConfig**: 
   - Si Fixed → Configurar anticipación, repeticiones
   - Si Flexible → Elegir ancla
6. **PreviewSchedule**: Revisa lista de alarmas a crear
7. **Confirm**: Crea las alarmas en el sistema

## 🔐 Seguridad (QR Enterprise)

### Payload del QR v1

```typescript
{
  version: "1",
  type: "embedded" | "reference",
  // MVP Embedded:
  plan: Plan,
  // Enterprise Reference:
  planId: string,
  planUrl: string,
  issuerId: string,
  expiresAt: ISO8601,
  signature: base64(Ed25519)
}
```

### Validación
- Firma Ed25519 con clave pública del emisor
- Verificación de expiración
- Sin datos sensibles del paciente en QR

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests (cuando se implementen)
npm run test:e2e
```

## 📄 Licencia

MIT

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor abre un issue primero para discutir cambios mayores.

---

**Nota**: Este proyecto está en desarrollo activo. La API puede cambiar.
