# 🎯 Pantalla de Alarma de Pantalla Completa

## ¿Qué se implementó?

Se creó una **experiencia de alarma similar a la app nativa de Reloj**, pero completamente dentro de Photolarm:

- ✅ Pantalla de pantalla completa cuando suena la alarma
- ✅ Reloj en tiempo real con hora y fecha
- ✅ Vibración continua mientras la alarma está activa
- ✅ Botones grandes de "Apagar" y "Posponer"
- ✅ Múltiples opciones de posponer (5, 10, 15 minutos)
- ✅ Diseño minimalista tipo iOS/Android nativo

---

## 🎨 Diseño de la Pantalla

```
┌─────────────────────────────┐
│                             │
│         18:30:45            │ ← Hora en tiempo real (grande)
│    Jueves, 9 de enero       │ ← Fecha actual
│                             │
│            ⏰               │ ← Emoji de alarma
│    Tomar Ibuprofeno 400mg   │ ← Título de la alarma
│   ¡Es hora de tu medicina!  │ ← Descripción (opcional)
│                             │
│                             │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │+5min│ │+10m │ │+15m │   │ ← Botones de posponer
│  └─────┘ └─────┘ └─────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │  Apagar Alarma      │   │ ← Botón principal (rojo)
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

---

## 🔄 Flujo de Funcionamiento

### 1. **Alarma se dispara**
```typescript
// Sistema operativo → expo-notifications → App.tsx listener
Notifications.addNotificationReceivedListener((notification) => {
  // Detectar que es una alarma
  if (notification.data.type === 'alarm') {
    // Navegar a AlarmScreen automáticamente
    navigation.navigate('Alarm', {
      alarmId: notification.data.alarmId,
      scheduleId: notification.data.scheduleId,
      title: notification.content.title,
      body: notification.content.body,
      notificationId: notification.identifier,
    });
  }
});
```

### 2. **Pantalla se muestra**
- Fondo negro (como alarma nativa)
- Reloj se actualiza cada segundo
- Vibración continua (1s on, 1s off, repetir)
- No se puede cerrar con gesto swipe

### 3. **Usuario interactúa**

**Opción A: Posponer**
```typescript
handleSnooze(minutes) {
  Vibration.cancel();                      // Detener vibración
  notificationService.snoozeAlarm(...);   // Crear nueva alarma +X min
  navigation.goBack();                     // Cerrar pantalla
}
```

**Opción B: Apagar**
```typescript
handleDismiss() {
  Vibration.cancel();                      // Detener vibración
  notificationService.completeAlarm(...); // Marcar como completada
  navigation.goBack();                     // Cerrar pantalla
}
```

---

## 📱 Archivos Modificados/Creados

### 1. **AlarmScreen.tsx** (NUEVO)
Pantalla de pantalla completa con:
- Reloj en tiempo real
- Información de la alarma
- Vibración continua
- Botones de acción

**Ubicación:** `/src/screens/AlarmScreen.tsx`

### 2. **App.tsx** (MODIFICADO)
- Agregado `navigationRef` para navegación desde listeners
- Agregado listener `addNotificationReceivedListener` (app en foreground)
- Agregado listener `addNotificationResponseReceivedListener` (tap en notificación)
- Agregada ruta `Alarm` al Stack.Navigator con `fullScreenModal`

### 3. **notification.service.ts** (SIN CAMBIOS)
Ya tenía todo lo necesario:
- `snoozeAlarm(alarmId, minutes)` - Posponer alarma
- `completeAlarm(notificationId)` - Apagar alarma
- Canal de alarma con `AndroidAudioUsage.ALARM`

### 4. **screens/index.ts** (MODIFICADO)
- Exportado `AlarmScreen`

### 5. **HomeScreen.tsx** (MODIFICADO)
- Actualizado `RootStackParamList` para incluir ruta `Alarm`

---

## 🧪 Cómo Probar

### 1. Reload la app
```bash
# En terminal de Expo
Presiona 'r'
```

### 2. Prueba desde TestNotificationScreen

1. Abre la app
2. Tap en 🧪 (botón de pruebas)
3. Tap "⚡ Notificación Inmediata (1s)"
4. **Espera 1 segundo**

**Resultado esperado:**
- ✅ App navega automáticamente a AlarmScreen
- ✅ Pantalla negra de pantalla completa
- ✅ Reloj mostrando hora actual
- ✅ Vibración continua
- ✅ Título de la alarma visible
- ✅ Botones de posponer y apagar

### 3. Prueba interacciones

**Posponer 5 minutos:**
1. Tap en "+5 min"
2. Pantalla se cierra
3. Vibración se detiene
4. Nueva alarma programada para 5 minutos después

**Apagar:**
1. Tap en "Apagar Alarma"
2. Pantalla se cierra
3. Vibración se detiene
4. Alarma marcada como completada

---

## ⚙️ Configuración Técnica

### Navegación
```typescript
// App.tsx - Configuración de la ruta Alarm
<Stack.Screen
  name="Alarm"
  component={AlarmScreen}
  options={{
    presentation: 'fullScreenModal',  // Pantalla completa
    animation: 'fade',                // Animación suave
    gestureEnabled: false,            // No cerrar con swipe
  }}
/>
```

### Vibración
```typescript
// Android: Patrón personalizado
Vibration.vibrate([0, 1000, 1000], true); // [delay, on, off], repeat

// iOS: Loop manual (no soporta patrones)
setInterval(() => {
  Vibration.vibrate(1000);
}, 2000);
```

### Listeners de Notificaciones
```typescript
// 1. App en primer plano
Notifications.addNotificationReceivedListener((notification) => {
  // Navegar directamente a AlarmScreen
});

// 2. Usuario toca notificación
Notifications.addNotificationResponseReceivedListener((response) => {
  // Navegar a AlarmScreen
});
```

---

## 🎯 Características Clave

### ✅ Similitudes con Apps Nativas

| Característica | App Nativa | Photolarm | Estado |
|---------------|------------|-----------|--------|
| Pantalla completa | ✅ | ✅ | Implementado |
| Reloj en tiempo real | ✅ | ✅ | Implementado |
| Vibración continua | ✅ | ✅ | Implementado |
| Botón "Apagar" grande | ✅ | ✅ | Implementado |
| Botones de posponer | ✅ | ✅ | Implementado |
| Sonido de alarma fuerte | ✅ | ✅ | Implementado (canal ALARM) |
| Ignora Do Not Disturb | ✅ | ✅ | Implementado (si permisos) |
| No se puede cerrar con swipe | ✅ | ✅ | Implementado |

### 🚫 Diferencias

| Característica | App Nativa | Photolarm | Razón |
|---------------|------------|-----------|-------|
| Funciona con app cerrada | ✅ | ⚠️ Limitado | React Native necesita proceso en background |
| Aparece en app Reloj | ✅ | ❌ | APIs privadas del sistema |
| Wake lock (pantalla encendida) | ✅ | ❌ | Requiere módulo nativo adicional |

---

## 📊 Estados de la Alarma

```
┌─────────────────┐
│ Alarma Programada│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Alarma Dispara │ ← Sistema operativo la ejecuta
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Listener Detecta│ ← App.tsx recibe notificación
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AlarmScreen     │ ← Pantalla completa se muestra
│ (vibrando)      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌───────┐
│Posponer│ │Apagar │
└───┬────┘ └───┬───┘
    │          │
    ▼          ▼
┌────────┐ ┌───────┐
│Nueva   │ │Marca  │
│Alarma  │ │Como   │
│+X min  │ │Completa│
└────────┘ └───────┘
```

---

## 🐛 Debugging

### Verificar que los listeners están funcionando

En los logs de Expo, deberías ver:

```
✅ NotificationService inicializado
📢 Canal de alarma configurado
🔔 Notificación recibida en foreground: {...}
```

### Si la pantalla no se abre automáticamente

1. **Verifica que la app esté en primer plano**
   - Los listeners solo funcionan si la app está abierta

2. **Verifica los datos de la notificación**
   ```javascript
   console.log(notification.request.content.data);
   // Debe incluir: { type: 'alarm', alarmId: '...', scheduleId: '...' }
   ```

3. **Verifica el navigationRef**
   ```javascript
   console.log('navigationRef actual:', navigationRef.current);
   // No debe ser null
   ```

---

## 🎨 Personalización

### Cambiar colores
```typescript
// AlarmScreen.tsx - styles
dismissButton: {
  backgroundColor: '#FF3B30', // ← Cambiar color del botón
}
```

### Cambiar opciones de posponer
```typescript
// AlarmScreen.tsx - render
<TouchableOpacity onPress={() => handleSnooze(5)}>  {/* 5 minutos */}
<TouchableOpacity onPress={() => handleSnooze(10)}> {/* 10 minutos */}
<TouchableOpacity onPress={() => handleSnooze(30)}> {/* Agregar 30 minutos */}
```

### Cambiar patrón de vibración
```typescript
// AlarmScreen.tsx - useEffect
const vibrationPattern = [0, 1000, 1000]; // [delay, on, off] en ms
//                          ▲   ▲     ▲
//                          │   │     └── Pausa entre vibraciones
//                          │   └──────── Duración de vibración
//                          └──────────── Delay inicial
```

---

## 📈 Próximas Mejoras (Opcional)

### 1. **Wake Lock** (mantener pantalla encendida)
```bash
npx expo install expo-keep-awake
```

### 2. **Animaciones más fluidas**
```bash
npx expo install react-native-reanimated
```

### 3. **Deslizar para apagar**
- Implementar gesto de swipe para apagar la alarma

### 4. **Historial de alarmas**
- Guardar cuándo fueron apagadas/pospuestas

---

## ✅ Resumen

**Lo que tienes ahora:**

1. ✅ Notificaciones que suenan **como alarmas** (volumen ALARM, ignora DND)
2. ✅ Pantalla de pantalla completa **estilo app nativa** cuando suena
3. ✅ Reloj en tiempo real
4. ✅ Vibración continua
5. ✅ Botones para posponer (5/10/15 min) o apagar
6. ✅ Navegación automática cuando llega la notificación
7. ✅ Integrado con tu sistema de horarios existente

**La experiencia es casi idéntica a las apps de Reloj nativas**, con la ventaja de que está completamente integrada en tu flujo de medicamentos. 🎯
