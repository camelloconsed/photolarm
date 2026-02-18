# Guía de Edición de Alarmas y Schedules

## Implementación Completa ✅

### Funcionalidades Implementadas

#### 1. Edición de Alarmas Individuales

**Acceso:** Desde el botón ✏️ en cada alarma dentro del acordeón.

**Opciones disponibles:**
- **Cambiar Título:** Permite editar el texto de la alarma
- **Cambiar Hora:** Permite modificar la fecha y hora de la alarma

**Componentes:**
- `EditAlarmModal.tsx` - Modal con DateTimePicker y TextInput
- Integrado en `ScheduleAccordion.tsx`

**Store Methods:**
```typescript
updateAlarm(scheduleId: string, alarmId: string, updates: Partial<Alarm>)
```

#### 2. Edición de Schedules Completos

**Acceso:** Desde el botón "Editar" en la parte superior del acordeón expandido.

**Opciones disponibles:**

##### a) Cambiar Horarios
- Ajusta todas las alarmas proporcionalmente
- Mantiene la frecuencia entre alarmas
- Útil para: Adelantar o atrasar todo el tratamiento

##### b) Modificar Duración
- Extiende o acorta el tratamiento
- Mantiene la frecuencia entre dosis
- Genera o elimina alarmas según sea necesario
- Útil para: Cambiar de 7 a 10 días de tratamiento

##### c) Configuración Avanzada
- Permite editar: hora de inicio, duración y frecuencia
- Regenera todas las alarmas con los nuevos parámetros
- Útil para: Cambios complejos (ej: de cada 8h a cada 6h)

**Componentes:**
- `EditScheduleModal.tsx` - Modal con múltiples modos
- Integrado en `HomeScreen.tsx`

**Store Methods:**
```typescript
updateScheduleTimes(scheduleId: string, newStartTime: string)
updateScheduleDuration(scheduleId: string, newDuration: number)
updateScheduleFrequency(scheduleId: string, newFrequency: number)
```

### Flujo de Usuario

#### Editar una Alarma:
1. Usuario toca el acordeón para expandir
2. Toca el botón ✏️ en la alarma específica
3. Elige "Cambiar Título" o "Cambiar Hora"
4. El modal se abre con el valor actual
5. Usuario edita y guarda
6. El store se actualiza y la UI se refresca

#### Editar un Schedule:
1. Usuario toca el acordeón para expandir
2. Toca el botón "Editar" en la parte superior
3. Elige entre 3 opciones: Horarios, Duración, o Avanzada
4. El modal se abre en el modo correspondiente
5. Usuario edita los valores
6. Al guardar, el store recalcula todas las alarmas
7. La UI muestra las alarmas actualizadas

### Algoritmos de Edición

#### 1. Cambiar Horarios (updateScheduleTimes)
```typescript
// Calcula el offset entre el primer alarm y el nuevo tiempo
const offset = newStartTime - oldStartTime;

// Aplica el mismo offset a todas las alarmas
alarms.forEach(alarm => {
  alarm.datetime = new Date(alarm.datetime.getTime() + offset);
});
```

#### 2. Modificar Duración (updateScheduleDuration)
```typescript
// Calcula la frecuencia actual entre alarmas
const frequency = alarm[1].time - alarm[0].time;

// Calcula cuántas alarmas necesita la nueva duración
const newCount = Math.ceil(newDuration * 24h / frequency);

// Genera nuevas alarmas con la misma frecuencia
const newAlarms = Array.from({ length: newCount }, (_, i) => ({
  ...firstAlarm,
  datetime: startTime + (i * frequency)
}));
```

#### 3. Modificar Frecuencia (updateScheduleFrequency)
```typescript
// Mantiene la duración total del tratamiento
const totalDuration = lastAlarm.time - firstAlarm.time;

// Calcula cuántas alarmas necesita la nueva frecuencia
const newCount = Math.ceil(totalDuration / newFrequency) + 1;

// Genera nuevas alarmas con la nueva frecuencia
const newAlarms = Array.from({ length: newCount }, (_, i) => ({
  ...firstAlarm,
  datetime: startTime + (i * newFrequency)
}));
```

### Componentes Modales

#### EditAlarmModal
**Props:**
- `visible: boolean` - Controla visibilidad
- `onClose: () => void` - Callback al cerrar
- `onSave: (updates) => void` - Callback al guardar
- `currentTitle: string` - Título actual
- `currentDatetime: string` - Fecha/hora actual
- `mode: 'title' | 'time'` - Modo de edición

**Características:**
- DateTimePicker nativo (iOS spinner, Android dialog)
- TextInput multiline para títulos largos
- Validación automática
- Diseño responsive

#### EditScheduleModal
**Props:**
- `visible: boolean` - Controla visibilidad
- `onClose: () => void` - Callback al cerrar
- `onSave: (updates) => void` - Callback al guardar
- `mode: 'times' | 'duration' | 'advanced'` - Modo de edición
- `currentStartTime: string` - Hora de inicio actual
- `currentDuration?: number` - Duración en días
- `currentFrequency?: number` - Frecuencia en horas

**Características:**
- Múltiples modos de edición
- ScrollView para el modo avanzado
- Inputs numéricos para duración/frecuencia
- Hints informativos para el usuario

### Persistencia

Todos los cambios se persisten automáticamente gracias a Zustand con AsyncStorage:

```typescript
persist(
  (set, get) => ({ ...state }),
  {
    name: 'photolarm-schedules',
    storage: createJSONStorage(() => AsyncStorage),
  }
)
```

### Casos de Uso Reales

#### Caso 1: Paciente necesita extender antibiótico de 7 a 10 días
1. Expandir el acordeón de "Amoxicilina"
2. Tocar "Editar" → "Modificar Duración"
3. Cambiar de 7 a 10
4. Guardar
5. El sistema genera 3 dosis adicionales automáticamente

#### Caso 2: Médico cambia frecuencia de cada 8h a cada 6h
1. Expandir el acordeón del medicamento
2. Tocar "Editar" → "Configuración Avanzada"
3. Cambiar frecuencia de 8 a 6 horas
4. Guardar
5. El sistema regenera todas las alarmas con la nueva frecuencia

#### Caso 3: Usuario necesita adelantar todo el tratamiento 2 horas
1. Expandir el acordeón
2. Tocar "Editar" → "Cambiar Horarios"
3. Seleccionar nueva hora de inicio (2 horas antes)
4. Guardar
5. Todas las alarmas se ajustan proporcionalmente

#### Caso 4: Usuario quiere cambiar el nombre de una dosis específica
1. Expandir el acordeón
2. Tocar ✏️ en la alarma específica
3. Seleccionar "Cambiar Título"
4. Editar el texto
5. Guardar
6. Solo esa alarma cambia su título

### Validaciones

- ✅ No permite schedules sin alarmas (auto-eliminación)
- ✅ Mantiene estados de completado al editar horarios
- ✅ Valida inputs numéricos (duración > 0, frecuencia > 0)
- ✅ Previene edición de schedules inexistentes
- ✅ Confirmación al eliminar con contador de alarmas

### Limitaciones Conocidas

1. **Cambiar duración resetea estados de completado:** Al regenerar alarmas, se pierden los estados de completado de alarmas futuras (por diseño).

2. **Cambiar frecuencia regenera todas las alarmas:** No es posible mantener las alarmas existentes cuando se cambia la frecuencia.

3. **No se puede editar una alarma ya completada:** Las alarmas completadas están "bloqueadas" (puede agregarse si se requiere).

### Testing Manual

Para probar las funcionalidades:

1. **Crear un schedule:**
   - Importar texto: "Paracetamol 500mg cada 8 horas por 3 días"
   
2. **Probar edición de alarma:**
   - Expandir acordeón
   - Tocar ✏️ en una alarma
   - Cambiar título o hora
   - Verificar que se guardó correctamente

3. **Probar edición de schedule:**
   - Tocar "Editar" en el schedule
   - Probar cada modo (Horarios, Duración, Avanzada)
   - Verificar que las alarmas se regeneran correctamente

4. **Probar validaciones:**
   - Intentar valores negativos
   - Intentar valores muy grandes
   - Cerrar modal sin guardar

### Próximos Pasos Potenciales

- [ ] Historial de ediciones (undo/redo)
- [ ] Edición batch de múltiples alarmas
- [ ] Previsualización antes de guardar cambios grandes
- [ ] Notificaciones sobre cambios realizados
- [ ] Exportar/importar configuraciones editadas

---

**Autor:** Photolarm Team  
**Fecha:** 9 de enero de 2026  
**Versión:** 1.0.0
