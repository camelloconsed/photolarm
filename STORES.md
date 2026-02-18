# Stores - Estado Global con Zustand

## 📋 Overview

Photolarm usa **Zustand** para gestión de estado con persistencia en AsyncStorage. 

3 stores principales:
1. **PreferencesStore** - Configuración del usuario
2. **PlansStore** - Planes extraídos (medicamentos, citas, etc.)
3. **SchedulesStore** - Schedules generados (alarmas)

---

## 🎯 Características

✅ **Type-Safe** - 100% TypeScript con tipos del core  
✅ **Persistencia** - AsyncStorage automática  
✅ **Reactivo** - Re-render automático en cambios  
✅ **Selectores** - Optimización de re-renders  
✅ **DevTools** - Compatible con Flipper/React DevTools  

---

## 📦 usePreferencesStore

### Estado
```typescript
interface PreferencesState {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
}
```

### Actions
```typescript
// Actualizar preferencias completas
updatePreferences(partial: Partial<UserPreferences>)

// Configurar ventana de sueño
setSleepWindow(start: string, end: string)

// Configurar horarios de comidas
setMealTimes(breakfast?: string, lunch?: string, dinner?: string)

// Cambiar timezone
setTimezone(timezone: string)

// Resetear a valores por defecto
resetToDefaults()
```

### Uso
```typescript
import { usePreferencesStore } from '@/store';

function SettingsScreen() {
  const preferences = usePreferencesStore((state) => state.preferences);
  const setSleepWindow = usePreferencesStore((state) => state.setSleepWindow);
  
  const handleSave = () => {
    setSleepWindow('23:00', '07:00');
  };
  
  return (
    <View>
      <Text>Sleep: {preferences.sleepWindow?.start}</Text>
    </View>
  );
}
```

---

## 📦 usePlansStore

### Estado
```typescript
interface PlansState {
  plans: Plan[];
  isLoading: boolean;
  error: string | null;
}
```

### Actions
```typescript
// CRUD
addPlan(plan: Plan)
addPlans(plans: Plan[])
updatePlan(id: string, updates: Partial<Plan>)
deletePlan(id: string)
getPlanById(id: string): Plan | undefined
clearAllPlans()

// Filtering
getPlansByDomain(domain: string): Plan[]
getActivePlans(): Plan[]

// UI state
setLoading(loading: boolean)
setError(error: string | null)
```

### Uso
```typescript
import { usePlansStore } from '@/store';

function PlansListScreen() {
  const plans = usePlansStore((state) => state.plans);
  const addPlan = usePlansStore((state) => state.addPlan);
  
  const handleAddPlan = (newPlan: Plan) => {
    addPlan(newPlan);
  };
  
  return (
    <FlatList
      data={plans}
      renderItem={({ item }) => <PlanCard plan={item} />}
    />
  );
}
```

---

## 📦 useSchedulesStore

### Estado
```typescript
interface SchedulesState {
  schedules: Schedule[];
  isLoading: boolean;
  error: string | null;
}
```

### Actions
```typescript
// Schedule CRUD
addSchedule(schedule: Schedule)
updateSchedule(id: string, updates: Partial<Schedule>)
deleteSchedule(id: string)
getScheduleById(id: string): Schedule | undefined
getSchedulesByPlanId(planId: string): Schedule[]
clearAllSchedules()

// Alarm management
updateAlarm(scheduleId: string, alarmId: string, updates: Partial<Alarm>)
markAlarmTriggered(scheduleId: string, alarmId: string)
markAlarmCompleted(scheduleId: string, alarmId: string)
snoozeAlarm(scheduleId: string, alarmId: string, minutes: number)
toggleAlarmEnabled(scheduleId: string, alarmId: string)

// Queries
getUpcomingAlarms(limit?: number): Alarm[]
getActiveAlarms(): Alarm[]
getPendingAlarms(): Alarm[]
getCompletedAlarms(): Alarm[]

// UI state
setLoading(loading: boolean)
setError(error: string | null)
```

### Uso
```typescript
import { useSchedulesStore } from '@/store';

function HomeScreen() {
  const upcomingAlarms = useSchedulesStore((state) => state.getUpcomingAlarms(5));
  const markCompleted = useSchedulesStore((state) => state.markAlarmCompleted);
  
  const handleComplete = (scheduleId: string, alarmId: string) => {
    markCompleted(scheduleId, alarmId);
  };
  
  return (
    <FlatList
      data={upcomingAlarms}
      renderItem={({ item }) => (
        <AlarmCard 
          alarm={item} 
          onComplete={() => handleComplete(item.plan_id, item.id)}
        />
      )}
    />
  );
}
```

---

## 🔥 Flujo Completo de Uso

### 1. Configurar Preferencias
```typescript
const { setSleepWindow, setMealTimes } = usePreferencesStore();

setSleepWindow('23:00', '07:00');
setMealTimes('08:00', '13:00', '20:00');
```

### 2. Extraer y Guardar Plan
```typescript
const { addPlan } = usePlansStore();
const extractorService = new OpenAIExtractorService();

const result = await extractorService.extractPlans({
  type: 'text',
  text: 'Amoxicilina 500mg cada 8 horas por 7 días con comida',
  // ... otros campos
});

result.plans.forEach(plan => addPlan(plan));
```

### 3. Generar Schedule
```typescript
const { addSchedule } = useSchedulesStore();
const { preferences } = usePreferencesStore();
const plan = usePlansStore.getState().plans[0];

const anchor: Anchor = {
  type: 'now',
  datetime: new Date().toISOString(),
  timezone: preferences.timezone,
};

const schedule = generateFlexibleSchedule(plan, anchor, {
  preferences,
  currentTime: new Date(),
});

addSchedule(schedule);
```

### 4. Mostrar Alarmas Próximas
```typescript
const upcomingAlarms = useSchedulesStore((state) => state.getUpcomingAlarms(10));

upcomingAlarms.forEach(alarm => {
  console.log(`🔔 ${alarm.title} - ${new Date(alarm.datetime).toLocaleString()}`);
});
```

### 5. Marcar Alarma como Completada
```typescript
const { markAlarmCompleted } = useSchedulesStore();

markAlarmCompleted('schedule-123', 'alarm-456');
```

---

## 🚀 Performance

### Selectores Optimizados
```typescript
// ❌ Mal - Re-render en CUALQUIER cambio del store
const store = usePreferencesStore();

// ✅ Bien - Re-render solo si preferences cambia
const preferences = usePreferencesStore((state) => state.preferences);

// ✅ Mejor - Re-render solo si sleepWindow cambia
const sleepWindow = usePreferencesStore((state) => state.preferences.sleepWindow);
```

### Shallow Comparison
```typescript
import { shallow } from 'zustand/shallow';

const { plans, addPlan } = usePlansStore(
  (state) => ({ plans: state.plans, addPlan: state.addPlan }),
  shallow
);
```

---

## 🧪 Testing

### Mock Store para Tests
```typescript
import { usePlansStore } from '@/store';

// Reset store antes de cada test
beforeEach(() => {
  usePlansStore.getState().clearAllPlans();
});

test('should add plan', () => {
  const { addPlan, plans } = usePlansStore.getState();
  
  addPlan(mockPlan);
  
  expect(plans).toHaveLength(1);
  expect(plans[0].id).toBe(mockPlan.id);
});
```

---

## 📝 Archivos

- `src/store/preferences.store.ts` - Store de preferencias
- `src/store/plans.store.ts` - Store de planes
- `src/store/schedules.store.ts` - Store de schedules
- `src/store/index.ts` - Exports centralizados
- `src/store/store.example.ts` - 9 ejemplos de uso

---

## ✅ Status

**COMPLETADO** ✅

- ✅ 3 stores principales implementados
- ✅ Persistencia con AsyncStorage
- ✅ Type-safe 100%
- ✅ Selectores optimizados
- ✅ 9 ejemplos de uso completos
- ✅ Sin errores de TypeScript

**Próximo paso:** UI Components (Step 6)
