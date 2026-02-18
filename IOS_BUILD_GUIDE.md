# 📱 Guía: Build iOS Development para Photolarm

## 🎯 Objetivo
Crear un development build de Photolarm para iOS que permita usar hot reload en tu iPhone, igual que en Android.

---

## ⚡ Comandos Rápidos

```bash
# 1. Instalar EAS CLI (solo primera vez)
npm install -g eas-cli

# 2. Login en Expo
eas login

# 3. Build para iOS
cd /Users/joaquinnavarro/personal/photolarm
eas build --platform ios --profile development
```

---

## 📋 Paso a Paso Detallado

### Paso 1: Instalar EAS CLI ⚙️

```bash
npm install -g eas-cli
```

**Tiempo**: ~30 segundos  
**Qué hace**: Instala la herramienta de línea de comandos de Expo Application Services.

---

### Paso 2: Login en Expo 🔐

```bash
eas login
```

**Te pedirá**:
- Email o username de tu cuenta Expo
- Password

**Si no tienes cuenta Expo**:
```bash
eas register
```

O regístrate en: https://expo.dev/signup

---

### Paso 3: Construir para iOS 🏗️

```bash
cd /Users/joaquinnavarro/personal/photolarm
eas build --platform ios --profile development
```

**Tiempo**: 10-15 minutos  

**Qué sucederá**:
1. EAS sube tu código a la nube
2. Construye el .ipa en servidores de Expo
3. Genera certificados de Apple automáticamente (primera vez)
4. Te da un link y QR para instalar

**Preguntas que te hará (primera vez)**:
- ✅ "Generate a new Apple Distribution Certificate?" → **YES**
- ✅ "Generate a new Apple Provisioning Profile?" → **YES**
- ✅ "Register devices for development?" → **YES**

Expo maneja todo automáticamente, no necesitas ir a Apple Developer Portal.

---

### Paso 4: Instalar en tu iPhone 📲

**Cuando el build termine**, verás algo como:

```
✔ Build finished
    https://expo.dev/artifacts/eas/abcd1234.ipa
    
📱 Install on device:
    https://qr.expo.dev/eas-build?id=...
```

**Opciones para instalar**:

#### Opción A: Link directo
1. Abre el link en **Safari** en tu iPhone
2. Toca "Install"
3. Ve a Ajustes → General → VPN y administración de dispositivos
4. Confía en el perfil de desarrollador
5. Abre la app

#### Opción B: QR Code
1. Abre la cámara de tu iPhone
2. Escanea el QR que aparece en la terminal
3. Sigue los mismos pasos de instalación

---

### Paso 5: Conectar con Hot Reload 🔥

Una vez instalada la app:

1. **Asegúrate que iPhone y Mac estén en la misma WiFi**

2. **En tu Mac**, asegúrate que el dev server esté corriendo:
   ```bash
   npx expo start --dev-client
   ```

3. **En tu iPhone**, abre la app Photolarm

4. Verás la pantalla de **Expo Dev Client** con opciones:
   - "Scan QR code"
   - "Enter URL manually"
   - Lista de servidores recientes

5. **Escanea el QR** que muestra la terminal del dev server

6. ¡Listo! La app cargará y tendrás hot reload funcionando

---

## 🔄 Cuándo Necesitas Rebuildar

**NO necesitas rebuildar para**:
- ✅ Cambios en código JavaScript/TypeScript
- ✅ Cambios en componentes React
- ✅ Cambios en estilos
- ✅ Cambios en lógica de negocio

**SÍ necesitas rebuildar cuando**:
- ⚠️ Agregas nuevas dependencias nativas (ej: expo-camera)
- ⚠️ Cambias configuración en `app.json`
- ⚠️ Cambias plugins en `app.json`
- ⚠️ Actualizas Expo SDK

---

## 💰 Límites y Costos

**Free Tier de Expo**:
- ✅ 30 builds/mes gratis
- ✅ Unlimited actualizaciones OTA
- ✅ Certificados manejados automáticamente

**Para más builds**:
- Plan Production: $99/mes (unlimited builds)

---

## 🐛 Solución de Problemas

### Error: "No valid provisioning profile"
**Solución**: Ejecuta nuevamente el build, Expo regenerará los perfiles:
```bash
eas build --platform ios --profile development --clear-cache
```

### Error: "Device not registered"
**Solución**: Registra tu iPhone:
```bash
eas device:create
```
Sigue las instrucciones para agregar tu UDID.

### App no conecta al dev server
**Checklist**:
1. ✅ iPhone y Mac en la misma WiFi
2. ✅ Firewall del Mac permite conexiones
3. ✅ Dev server corriendo (`npx expo start --dev-client`)
4. ✅ Escanea el QR correctamente

**Manual**: Ingresa la URL manualmente en la app:
```
exp://[TU-IP]:8081
```

Ejemplo: `exp://192.168.1.100:8081`

---

## 📊 Comparación Android vs iOS

| Característica | Android | iOS |
|---------------|---------|-----|
| Tiempo de build | ~5-8 min | ~10-15 min |
| Formato | .apk | .ipa |
| Instalación | Directa (sideload) | Safari + perfil |
| Certificados | No requeridos | Manejados por Expo |
| Hot reload | ✅ | ✅ |

---

## 🎉 Una Vez Instalado

Ahora puedes:
- ✅ Desarrollar con hot reload en iOS y Android simultáneamente
- ✅ Probar todas las features que implementamos
- ✅ Ver categorías visuales (💊 Salud, 🍳 Cocina, etc.)
- ✅ Probar anchor selection para planes flexibles
- ✅ Probar reminder checkboxes para planes fixed
- ✅ Iterar súper rápido sin rebuildar

---

## 🔗 Links Útiles

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [iOS Simulator Setup](https://docs.expo.dev/build/simulator/)
- [Device Registration](https://docs.expo.dev/build/internal-distribution/)
- [Expo Dashboard](https://expo.dev/) (ver tus builds)

---

**Creado**: 19 de diciembre de 2025  
**Para**: Photolarm MVP Development
