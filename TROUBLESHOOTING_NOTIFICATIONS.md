# 🧪 Troubleshooting de Notificaciones

## ❌ Problema: "Las alarmas no suenan"

Si programaste alarmas pero no suenan, sigue esta guía de diagnóstico:

---

## 📋 Checklist de Verificación

### 1. Permisos ✅

**Verificar**:
- Ve a Configuración del dispositivo → Aplicaciones → Photolarm → Notificaciones
- Asegúrate de que **todas las notificaciones estén habilitadas**
- En Android: También verifica que "Mostrar como emergente" esté activado

**Síntomas si falta**:
- La app no solicita permisos
- No aparece el diálogo de permisos al confirmar alarmas

### 2. Modo No Molestar / Silencio 🔕

**Verificar**:
- Desactiva "No molestar" / "Do Not Disturb"
- Desactiva modo silencio
- **Sube el volumen** del dispositivo

**Síntomas si está activo**:
- Las notificaciones se programan pero no suenan
- Puedes ver las notificaciones en la barra pero sin sonido

### 3. Optimización de Batería 🔋

**Android específicamente**:
- Ve a Configuración → Batería → Optimización de batería
- Busca "Photolarm"
- Selecciona "No optimizar"

**Síntomas si está activo**:
- Las alarmas no se disparan si la app está cerrada
- Funcionan solo con la app abierta

### 4. Alarmas Programadas 📅

**Verificar**:
- Usa la pantalla de test (botón 🧪 en HomeScreen)
- Tap en "📋 Ver Alarmas Programadas"
- Deberías ver tu alarma listada

**Síntomas si no hay alarmas**:
- El sistema operativo no tiene alarmas
- Algo falló en la programación

### 5. Timing ⏰

**Verificar**:
- Las alarmas deben ser **futuras**
- Si programas una alarma "ahora", ya pasó
- Usa la pantalla de test para programar alarmas en 5-10 segundos

**Síntomas**:
- Alarmas no se programan (filtradas por createAlarms)
- Ver logs: "⏭️ Saltando alarma (tiempo pasado)"

---

## 🧪 Usar la Pantalla de Test

### Acceso

1. Abre Photolarm
2. En HomeScreen, tap en el botón **🧪** (arriba a la izquierda)
3. Verás la pantalla "Test de Notificaciones"

### Pruebas Disponibles

#### ⚡ Notificación Inmediata (1s)
- Programa una notificación para dentro de 1 segundo
- **Usa esta para verificar que las notificaciones funcionan en general**
- Deberías ver/escuchar la notificación casi inmediatamente

#### 🔔 Alarma en 5/10/30/60 segundos
- Programa una alarma de prueba
- **Espera el tiempo indicado**
- La notificación debería aparecer con sonido

#### 📋 Ver Alarmas Programadas
- Lista todas las alarmas en el sistema operativo
- Muestra título y hora de cada una
- **Útil para verificar que se programaron correctamente**

#### 🗑️ Cancelar Todas
- Cancela todas las alarmas programadas
- Útil para limpiar antes de probar de nuevo

---

## 🔍 Interpretar los Logs

Cuando programas una alarma, deberías ver en los logs de Expo:

### ✅ Programación Exitosa

```
LOG  📅 Programando 3 alarmas...
LOG    ✅ Alarma programada: Tomar ibuprofeno - 1/9/2026, 10:30:00 AM
LOG    ✅ Alarma programada: Tomar ibuprofeno - 1/9/2026, 6:30:00 PM
LOG    ✅ Alarma programada: Tomar ibuprofeno - 1/10/2026, 2:30:00 AM
LOG  ✅ 3 alarmas programadas exitosamente
```

### ❌ Alarmas Saltadas (Tiempo Pasado)

```
LOG  📅 Programando 5 alarmas...
LOG    ⏭️ Saltando alarma alarm-1 (tiempo pasado)
LOG    ⏭️ Saltando alarma alarm-2 (tiempo pasado)
LOG    ✅ Alarma programada: ... (solo futuras)
LOG  ✅ 1 alarmas programadas exitosamente
```

**Solución**: Cambia la hora de inicio del schedule a una hora futura

### ❌ Sin Permisos

```
WARN  ⚠️ Permisos de notificaciones denegados
ERROR  Notification permissions denied
```

**Solución**: 
1. Ve a Configuración del dispositivo
2. Aplicaciones → Photolarm → Notificaciones
3. Activa todas las notificaciones

---

## 🐛 Problemas Comunes

### "Programé una alarma para 'ahora' pero no suena"

**Causa**: "Ahora" ya pasó cuando se programa.

**Solución**:
1. Ve a la pantalla de test (🧪)
2. Usa "Alarma en 10 segundos"
3. **Espera** 10 segundos
4. Debería sonar

### "Las alarmas aparecen en 'Ver Alarmas Programadas' pero no suenan"

**Causa**: Modo No Molestar o volumen en 0

**Solución**:
1. Desactiva "No Molestar"
2. Sube el volumen
3. Verifica sonido de notificaciones en Configuración

### "Solo suenan si la app está abierta"

**Causa**: Optimización de batería

**Solución** (Android):
1. Configuración → Batería
2. Optimización de batería
3. Photolarm → "No optimizar"

### "No veo el diálogo de permisos"

**Causa**: Ya negaste los permisos antes

**Solución**:
1. Desinstala la app
2. Vuelve a instalar
3. O ve a Configuración y activa manualmente

---

## ✅ Test Final: Alarma de 10 Segundos

**Procedimiento**:

1. Abre Photolarm
2. Tap en 🧪 (Test)
3. Tap en "🔔 Alarma en 10 segundos"
4. Verás un alert confirmando
5. **Cierra la app** (o minimízala)
6. **Espera 10 segundos**
7. 🔔 Debería sonar una notificación con título "🧪 ALARMA DE PRUEBA"

**Si suena**: ✅ ¡Las notificaciones funcionan! El problema era otra cosa.

**Si no suena**: ❌ Revisa el checklist arriba, especialmente:
- Permisos
- Modo No Molestar
- Volumen
- Optimización de batería

---

## 📱 Diferencias iOS vs Android

### iOS
- Solicita permisos la primera vez automáticamente
- Límite de 64 notificaciones programadas
- No permite "botones" en notificaciones locales
- Modo No Molestar más restrictivo

### Android
- Más flexible con permisos
- Sin límite de notificaciones
- Permite botones de acción (completar, snooze)
- Optimización de batería puede interferir

---

## 🚨 Si Nada Funciona

1. **Verifica los logs completos**:
   ```bash
   adb logcat | grep -i "notification\|alarm\|expo"
   ```

2. **Reinstala la app**:
   ```bash
   npm run android
   ```

3. **Prueba en otro dispositivo**:
   - Algunos dispositivos tienen restricciones adicionales
   - Xiaomi, Huawei tienen optimizaciones agresivas

4. **Verifica la versión de Android**:
   - Android 12+ tiene cambios en notificaciones
   - Necesita `POST_NOTIFICATIONS` permission explícita

---

## 💡 Consejo Pro

**Para testear rápidamente**:

1. Ve a Test (🧪)
2. "Alarma en 5 segundos"
3. Espera 5 segundos
4. Debería sonar

**Para testear schedules reales**:

1. Crea un schedule nuevo
2. Selecciona "Comenzar ahora"
3. En preview, verifica que la primera alarma sea **futura** (no ya pasada)
4. Confirma
5. Espera a que llegue la hora
6. 🔔 Debería sonar

---

## 📊 Debug Logs Importantes

Busca estos logs para diagnosticar:

```
✅ BUENOS:
LOG  🔔 Solicitando permisos de notificaciones...
LOG  ✅ NotificationService inicializado
LOG  📅 Programando 5 alarmas...
LOG    ✅ Alarma programada: ...
LOG  📋 5 notificaciones programadas en el sistema

❌ PROBLEMAS:
WARN  ⚠️ Permisos de notificaciones denegados
LOG    ⏭️ Saltando alarma (tiempo pasado)
ERROR  Cannot find native module 'ExpoNotifications'
```

---

**¿Sigue sin funcionar?**

Comparte los logs completos y el resultado de:
- "Ver Alarmas Programadas"
- Configuración de permisos del dispositivo
- Versión de Android/iOS

¡Suerte! 🍀
