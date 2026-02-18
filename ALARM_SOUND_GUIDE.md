# 🔔 Guía de Sonido de Alarma

## ¿Qué se implementó?

Se configuró el sistema de notificaciones para que **suene como una ALARMA del teléfono**, no como una notificación normal.

## Diferencias clave

### 📱 Notificación Normal
- Sonido suave
- Se silencia en modo "No Molestar"
- Volumen de notificaciones
- Puede no despertar al usuario

### ⏰ Alarma (lo que implementamos)
- Sonido más fuerte e insistente
- **Suena incluso en modo "No Molestar"**
- Volumen de alarma
- Vibración más intensa
- Diseñada para despertar/alertar al usuario

---

## 🔧 Implementación Técnica

### Android
Se creó un **canal de notificación especial** con:

```typescript
audioAttributes: {
  usage: Notifications.AndroidAudioUsage.ALARM, // ← CLAVE
  contentType: Notifications.AndroidAudioContentType.SONIFICATION,
  flags: {
    enforceAudibility: true, // Fuerza que suene
  },
}
```

**`AndroidAudioUsage.ALARM`** le dice al sistema Android que:
- Use el volumen de ALARMA (no el de notificaciones)
- Suene incluso en "No Molestar" (si el usuario lo permite)
- Tenga prioridad máxima

### iOS
Se configuró **interrupción crítica**:

```typescript
interruptionLevel: 'critical'
```

Esto hace que:
- Suene incluso en "No Molestar"
- Suene incluso si el teléfono está en silencio
- Ignore la configuración de volumen (usa volumen de alarma)

---

## 📋 Permisos Necesarios

### Android
- **Permisos automáticos** (se solicitan en `initialize()`)
- El usuario puede deshabilitar "Ignorar No Molestar" en la configuración del sistema

### iOS
- **Permisos de Critical Alerts** (se solicitan en `requestPermissions()`)
- Requiere permiso especial de Apple para apps de salud/alarmas

---

## ✅ Configuración Aplicada

### 1. **Canal de Alarma (Android)**
```typescript
await Notifications.setNotificationChannelAsync('alarm', {
  name: 'Alarmas de Medicamentos',
  importance: Notifications.AndroidImportance.MAX,
  sound: 'default',
  enableVibrate: true,
  vibrationPattern: [0, 500, 500, 500], // Vibración intensa
  audioAttributes: {
    usage: Notifications.AndroidAudioUsage.ALARM, // ¡SONIDO DE ALARMA!
    contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    flags: { enforceAudibility: true },
  },
  bypassDnd: true, // Ignora "No Molestar"
});
```

### 2. **Notificación Individual**
```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    title: '💊 Tomar Ibuprofeno',
    body: '¡Es hora de tu medicamento!',
    sound: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
    vibrate: [0, 500, 500, 500],
    // iOS: Alerta crítica
    ...(Platform.OS === 'ios' && {
      interruptionLevel: 'critical',
    }),
  },
  trigger: {
    date: new Date('2026-01-09T18:00:00'),
    // Android: Usar canal "alarm"
    ...(Platform.OS === 'android' && {
      channelId: 'alarm',
    }),
  },
});
```

---

## 🧪 Cómo Probar

### 1. Reload la app
```bash
# En el terminal de Expo
Presiona 'r'
```

### 2. Prueba básica
1. Abre la app
2. Tap en 🧪 (botón de pruebas)
3. Tap "⚡ Notificación Inmediata (1s)"
4. **Debería sonar FUERTE como alarma**

### 3. Prueba con "No Molestar"
1. Activa "No Molestar" en tu teléfono
2. Programa una alarma de prueba (10 segundos)
3. Espera
4. **Debería sonar de todos modos** (si otorgaste permisos)

### 4. Prueba en modo silencio
- **Android**: Debería sonar (usa volumen de alarma)
- **iOS**: Depende de si otorgaste permisos de Critical Alerts

---

## ⚠️ Consideraciones Importantes

### Permisos DND (Do Not Disturb)

**Android:**
- Primera vez: Se solicita permiso especial "Ignorar No Molestar"
- Usuario puede revocarlo en: Configuración → Apps → Photolarm → Notificaciones

**iOS:**
- Requiere permiso "Critical Alerts"
- Apple requiere justificación para apps en App Store
- OK para uso personal/testing

### Volumen

El sonido **NO** usa el volumen de medios/notificaciones, usa:
- **Android**: Volumen de ALARMA
- **iOS**: Volumen de RINGER (si critical alerts permitido)

El usuario debe tener el volumen de alarma > 0 para escucharla.

---

## 🎯 Resultado Esperado

Cuando llegue la hora de una alarma:

✅ **Sonido fuerte** (como despertador)
✅ **Vibración intensa** (500ms on, 500ms off, repetido)
✅ **Funciona en "No Molestar"** (si se otorgaron permisos)
✅ **Pantalla se enciende** (Android con importance MAX)
✅ **Badge en el ícono de la app** (iOS)

---

## 🔍 Logs para Debugging

Cuando inicializes la app, verás:
```
✅ NotificationService inicializado
📢 Canal de alarma configurado (Android only)
```

Cuando programes una alarma:
```
📅 Programando 1 alarmas...
  ✅ Alarma programada: [título] - [fecha]
✅ 1 alarmas programadas exitosamente
```

---

## 📚 Referencias

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Android AudioAttributes](https://developer.android.com/reference/android/media/AudioAttributes)
- [iOS Critical Alerts](https://developer.apple.com/documentation/usernotifications/unnotificationcontent)
