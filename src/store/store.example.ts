/**
 * Ejemplos de Uso de Stores
 * 
 * Demuestra cómo usar los 3 stores principales en componentes React Native
 */

import { usePreferencesStore, usePlansStore, useSchedulesStore } from '@/store';
import { generateFlexibleSchedule } from '@/lib/schedule-generator';
import type { Plan, Anchor } from '@/types';

// ============================================================================
// EJEMPLO 1: Configurar Preferencias del Usuario
// ============================================================================

export function exampleSetupPreferences() {
  const { updatePreferences, setSleepWindow, setMealTimes } = usePreferencesStore();

  // Configurar ventana de sueño
  setSleepWindow('23:00', '07:00');

  // Configurar horarios de comidas
  setMealTimes('08:00', '13:00', '20:00');

  // Actualizar timezone
  updatePreferences({ timezone: 'America/Argentina/Buenos_Aires' });

  console.log('✅ Preferencias configuradas');
}

// ============================================================================
// EJEMPLO 2: Agregar un Plan y Generar Schedule
// ============================================================================

export function exampleAddPlanAndGenerateSchedule() {
  const { addPlan } = usePlansStore();
  const { addSchedule } = useSchedulesStore();
  const { preferences } = usePreferencesStore();

  // Plan: Amoxicilina cada 8 horas por 7 días
  const plan: Plan = {
    id: `plan-${Date.now()}`,
    domain: 'medication',
    mode: 'flexible',
    confidence: 1.0,
    evidence: 'Amoxicilina 500mg cada 8 horas por 7 días con comida',
    flexible_pattern: {
      items: [
        {
          interval_hours: 8,
          duration_days: 7,
          title: 'Amoxicilina 500mg',
          description: 'Tomar con comida',
          constraints: [
            { type: 'with_meal', priority: 'preferred' },
          ],
        },
      ],
    },
  };

  // Guardar plan
  addPlan(plan);

  // Generar schedule con ancla en el desayuno
  const anchor: Anchor = {
    type: 'recommended',
    datetime: new Date().toISOString(),
    timezone: preferences.timezone,
    reason: 'Comienza con tu desayuno',
  };

  const schedule = generateFlexibleSchedule(plan, anchor, {
    preferences,
    currentTime: new Date(),
  });

  // Guardar schedule
  addSchedule(schedule);

  console.log('✅ Plan agregado y schedule generado');
  console.log(`📅 ${schedule.alarms.length} alarmas creadas`);
}

// ============================================================================
// EJEMPLO 3: Listar Próximas Alarmas
// ============================================================================

export function exampleListUpcomingAlarms() {
  const { getUpcomingAlarms } = useSchedulesStore();

  const upcoming = getUpcomingAlarms(5); // Próximas 5 alarmas

  upcoming.forEach((alarm) => {
    console.log(`🔔 ${alarm.title} - ${new Date(alarm.datetime).toLocaleString()}`);
  });

  return upcoming;
}

// ============================================================================
// EJEMPLO 4: Marcar Alarma como Completada
// ============================================================================

export function exampleCompleteAlarm(scheduleId: string, alarmId: string) {
  const { markAlarmCompleted } = useSchedulesStore();

  markAlarmCompleted(scheduleId, alarmId);

  console.log('✅ Alarma marcada como completada');
}

// ============================================================================
// EJEMPLO 5: Snooze de Alarma (Posponer 10 minutos)
// ============================================================================

export function exampleSnoozeAlarm(scheduleId: string, alarmId: string) {
  const { snoozeAlarm } = useSchedulesStore();

  snoozeAlarm(scheduleId, alarmId, 10); // 10 minutos

  console.log('⏰ Alarma pospuesta 10 minutos');
}

// ============================================================================
// EJEMPLO 6: Obtener Planes Activos
// ============================================================================

export function exampleGetActivePlans() {
  const { getActivePlans } = usePlansStore();

  const activePlans = getActivePlans();

  console.log(`📋 ${activePlans.length} planes activos`);

  activePlans.forEach((plan) => {
    if (plan.mode === 'flexible' && plan.flexible_pattern) {
      const items = plan.flexible_pattern.items;
      console.log(`  • ${items[0]?.title || 'Sin título'}`);
    }
  });

  return activePlans;
}

// ============================================================================
// EJEMPLO 7: Eliminar Plan y sus Schedules
// ============================================================================

export function exampleDeletePlanAndSchedules(planId: string) {
  const { deletePlan } = usePlansStore();
  const { getSchedulesByPlanId, deleteSchedule } = useSchedulesStore();

  // Eliminar todos los schedules asociados
  const schedules = getSchedulesByPlanId(planId);
  schedules.forEach((schedule) => deleteSchedule(schedule.id));

  // Eliminar el plan
  deletePlan(planId);

  console.log('🗑️ Plan y schedules eliminados');
}

// ============================================================================
// EJEMPLO 8: Reset Completo (Borrar Todo)
// ============================================================================

export function exampleResetAll() {
  const { resetToDefaults } = usePreferencesStore();
  const { clearAllPlans } = usePlansStore();
  const { clearAllSchedules } = useSchedulesStore();

  resetToDefaults();
  clearAllPlans();
  clearAllSchedules();

  console.log('🔄 Todo reseteado a valores por defecto');
}

// ============================================================================
// EJEMPLO 9: Componente React Native (Flujo Completo)
// ============================================================================

/**
 * Ejemplo de un componente React Native que usa los stores
 */
export function ExampleComponent() {
  const preferences = usePreferencesStore((state) => state.preferences);
  const plans = usePlansStore((state) => state.plans);
  const upcomingAlarms = useSchedulesStore((state) => state.getUpcomingAlarms(10));

  const handleAddPlan = () => {
    exampleAddPlanAndGenerateSchedule();
  };

  const handleCompleteAlarm = (scheduleId: string, alarmId: string) => {
    exampleCompleteAlarm(scheduleId, alarmId);
  };

  // En un componente real, usarías JSX/React Native components
  console.log('📱 Componente renderizado');
  console.log(`   Planes: ${plans.length}`);
  console.log(`   Próximas alarmas: ${upcomingAlarms.length}`);
  console.log(`   Timezone: ${preferences.timezone}`);

  return {
    preferences,
    plans,
    upcomingAlarms,
    handleAddPlan,
    handleCompleteAlarm,
  };
}
