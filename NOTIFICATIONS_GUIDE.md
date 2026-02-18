# 🔔 Sistema de Notificaciones - Guía Completa

## 📱 Resumen

El sistema de notificaciones de Photolarm programa alarmas reales en el dispositivo usando **expo-notifications**. Las alarmas se disparan automáticamente en los horarios especificados, incluso si la app está cerrada.

---

## 🏗️ Arquitectura

### Componentes Principales

```
NotificationService (notification.service.ts)
├── Solicitud de permisos
├── Programación de alarmas
├── Cancelación de alarmas
└── Manejo de interacciones (completar, snooze)

PreviewScheduleScreen
├── Integración con NotificationService
├── UI de confirmación
└── Manejo de errores

App.tsx
└── Inicialización del servicio
```

---

## 🚀 Cómo Funciona

### 1. Inicialización (App.tsx)

Cuando la app arranca, se inicializa el servicio:

```typescript
useEffect(() => {
  const initNotifications = async () => {
    await notificationService.initialize();
  };
  initNotifications();
}, []);
```

Esto:
- ✅ Verifica si hay permisos
- ✅ Los solicita si es necesario
- ✅ Configura handlers de notificaciones

### 2. Programación de Alarmas (PreviewScheduleScreen)

Cuando el usuario confirma un schedule:

```typescript
const notificationIds = await notificationService.createAlarms(schedule);
```

Esto:
- ✅ Filtra alarmas habilitadas y no completadas
- ✅ Verifica que sean futuras
- ✅ Programa cada alarma en el sistema operativo
- ✅ Retorna los IDs de las notificaciones

### 3. Disparo de Alarma

Cuando llega la hora de una alarma:
- 📱 El sistema operativo dispara la notificación
- 🔔 Se muestra con sonido y vibración
- 👆 Usuario puede:
  - Abrir la app (toca la notificación)
  - Descartar la notificación
  - Completar desde la notificación (Android)

---

## 🔐 Permisos

### iOS

Configurado en `app.json`:
```json
{
  "ios": {
    "infoPlist": {
      "NSUserNotificationsUsageDescription": "Para programar alarmas de medicamentos"
    }
  }
}
```

### Android

Configurado en `app.json`:
```json
{
  "android": {
    "permissions": [
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE"
    ]
  }
}
```

---

## 📊 API del Servicio

### `initialize(): Promise<void>`

Inicializa el servicio y solicita permisos.

```typescript
await notificationService.initialize();
```

### `requestPermissions(): Promise<boolean>`

Solicita permisos de notificaciones al usuario.

```typescript
const granted = await notificationService.requestPermissions();
if (!granted) {
  // Manejar rechazo
}
```

### `hasPermissions(): Promise<boolean>`

Verifica si los permisos están otorgados.

```typescript
const hasPerms = await notificationService.hasPermissions();
```

### `createAlarms(schedule: Schedule): Promise<string[]>`

Programa todas las alarmas de un schedule.

```typescript
const notificationIds = await notificationService.createAlarms(schedule);
// Retorna: ['notif-id-1', 'notif-id-2', ...]
```

### `cancelAlarm(notificationId: string): Promise<void>`

Cancela una alarma específica.

```typescript
await notificationService.cancelAlarm('notif-id-1');
```

### `cancelAlarms(alarmIds: string[]): Promise<void>`

Cancela múltiples alarmas.

```typescript
await notificationService.cancelAlarms(['id1', 'id2', 'id3']);
```

### `cancelAllAlarms(): Promise<void>`

Cancela TODAS las alarmas programadas.

```typescript
await notificationService.cancelAllAlarms();
```

### `getAllAlarms(): Promise<Alarm[]>`

Obtiene todas las alarmas programadas en el sistema.

```typescript
const alarms = await notificationService.getAllAlarms();
console.log(`${alarms.length} alarmas programadas`);
```

### `snoozeAlarm(alarmId: string, minutes: number): Promise<void>`

Pospone una alarma X minutos.

```typescript
await notificationService.snoozeAlarm('alarm-123', 10); // 10 minutos
```

---

## 🧪 Testing

### 1. Verificar Permisos

```typescript
// En cualquier screen
useEffect(() => {
  const checkPerms = async () => {
    const hasPerms = await notificationService.hasPermissions();
    console.log('Permisos:', hasPerms ? 'OK' : 'Faltantes');
  };
  checkPerms();
}, []);
```

### 2. Programar Alarma de Prueba

```typescript
const testNotification = async () => {
  const testSchedule = {
    id: 'test-1',
    plan_id: 'plan-1',
    alarms: [{
      id: 'alarm-1',
      plan_id: 'plan-1',
      datetime: new Date(Date.now() + 10000).toISOString(), // +10 segundos
      timezone: 'local',
      title: '🧪 Alarma de Prueba',
      body: 'Si ves esto, ¡funciona!',
      enabled: true,
      snoozeable: true,
      triggered: false,
      completed: false,
      metadata: {},
    }],
    anchor: { type: 'now', datetime: new Date().toISOString() },
    created_at: new Date().toISOString(),
  };

  const ids = await notificationService.createAlarms(testSchedule);
  console.log('Alarma de prueba programada:', ids);
};
```

### 3. Ver Alarmas Programadas

```typescript
const debugAlarms = async () => {
  const alarms = await notificationService.getAllAlarms();
  alarms.forEach(alarm => {
    console.log(`- ${alarm.title}: ${alarm.datetime}`);
  });
};
```

---

## ⚠️ Limitaciones Conocidas

### iOS

- **Máximo 64 notificaciones** programadas simultáneamente
- **Solución**: Programar en lotes dinámicamente
- Las notificaciones no se disparan si el dispositivo está apagado

### Android

- Más permisivo (sin límite estricto)
- Optimización de batería puede afectar notificaciones
- Usuario puede desactivar notificaciones por app en Configuración

### Ambos

- **Precisión**: ±1 minuto (depende del SO)
- **Alarmas pasadas**: No se programan si la fecha ya pasó
- **Alarmas deshabilitadas**: No se programan si `enabled: false`

---

## 🔧 Troubleshooting

### "Notification permissions denied"

**Problema**: Usuario rechazó permisos.

**Solución**:
```typescript
Alert.alert(
  'Permisos necesarios',
  'Ve a Configuración > Photolarm > Notificaciones y actívalas',
  [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Ir a Configuración', onPress: openSettings },
  ]
);
```

### "Alarmas no se disparan"

**Verificar**:
1. ✅ Permisos otorgados: `hasPermissions()`
2. ✅ Alarma es futura: `new Date(alarm.datetime) > new Date()`
3. ✅ Alarma habilitada: `alarm.enabled === true`
4. ✅ Device.isDevice: Simuladores tienen limitaciones

**Debug**:
```typescript
const scheduledNotifs = await Notifications.getAllScheduledNotificationsAsync();
console.log('Notificaciones programadas:', scheduledNotifs.length);
```

### "Too many notifications"

**iOS**: Excediste 64 notificaciones.

**Solución**: Cancelar alarmas antiguas antes de programar nuevas:
```typescript
await notificationService.cancelAllAlarms();
await notificationService.createAlarms(newSchedule);
```

---

## 🎯 Best Practices

### 1. Manejo de Errores

```typescript
try {
  await notificationService.createAlarms(schedule);
} catch (error) {
  if (error.message.includes('permissions')) {
    // Solicitar permisos de nuevo
  } else {
    // Otro error
  }
}
```

### 2. Feedback al Usuario

```typescript
const [isScheduling, setIsScheduling] = useState(false);

const handleConfirm = async () => {
  setIsScheduling(true);
  try {
    await notificationService.createAlarms(schedule);
    Alert.alert('✅ Alarmas programadas');
  } finally {
    setIsScheduling(false);
  }
};
```

### 3. Limpiar Alarmas Antiguas

```typescript
// Al eliminar un schedule
const handleDelete = async (scheduleId: string) => {
  // 1. Cancelar notificaciones
  await notificationService.cancelAlarms(schedule.notificationIds);
  
  // 2. Eliminar del store
  deleteSchedule(scheduleId);
};
```

---

## 🚀 Próximos Pasos

### Features Pendientes

- [ ] **Background scheduling**: Re-programar alarmas cuando se acaban las 64
- [ ] **Notification actions**: Botones de "Completar" y "Snooze" en la notificación (Android)
- [ ] **Deep linking**: Abrir screen específica al tocar notificación
- [ ] **Persistir notificationIds**: Guardar IDs en el schedule para poder cancelar después
- [ ] **Batch scheduling**: Programar solo próximas 7 días, re-schedule después

### Mejoras de UX

- [ ] Sonidos personalizados por categoría (health, cooking, etc.)
- [ ] Vibración patterns diferentes
- [ ] Notificaciones de resumen diario
- [ ] Estadísticas de adherencia

---

## 📚 Referencias

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [iOS Local Notifications Guide](https://developer.apple.com/documentation/usernotifications)
- [Android Notifications Guide](https://developer.android.com/develop/ui/views/notifications)
- [Photolarm Architecture](./ARCHITECTURE.md)

---

**¿Dudas?** Revisa los logs con:
```typescript
await notificationService.getAllAlarms();
```

¡Buena suerte! 🍀
