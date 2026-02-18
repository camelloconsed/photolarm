/**
 * Schedule Generator - Motor de Generación de Alarmas
 * 
 * Convierte planes (fixed/flexible) en schedules (listas de alarmas concretas).
 * Todo el código son pure functions - sin side effects.
 * 
 * FUNCIONES PRINCIPALES:
 * 1. generateFixedSchedule() - Convierte eventos fijos en alarmas
 * 2. generateFlexibleSchedule() - Genera alarmas desde patrones + ancla
 * 3. recommendAnchor() - Optimiza el ancla para minimizar interrupciones
 */

import { 
  addHours, 
  addDays, 
  parseISO, 
  setHours,
  setMinutes,
  startOfDay,
  isBefore,
} from 'date-fns';
import type {
  Plan,
  Schedule,
  Alarm,
  FixedEvent,
  FlexiblePatternItem,
  Constraint,
  Anchor,
  UserPreferences,
} from '@/types';

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

interface GenerationContext {
  preferences: UserPreferences;
  currentTime: Date;
}

// ============================================================================
// GENERACIÓN DE SCHEDULES FIJOS
// ============================================================================

/**
 * Genera un schedule desde eventos fijos (fechas/horas exactas)
 * 
 * @example
 * ```typescript
 * const plan: Plan = {
 *   mode: 'fixed',
 *   fixed_events: [
 *     { start_datetime_iso: '2025-12-20T10:00:00Z', title: 'Consulta' }
 *   ]
 * };
 * 
 * const schedule = generateFixedSchedule(plan, context);
 * ```
 */
export function generateFixedSchedule(
  plan: Plan,
  context: GenerationContext
): Schedule {
  if (plan.mode !== 'fixed' || !plan.fixed_events) {
    throw new Error('Plan must be in fixed mode with fixed_events');
  }

  const alarms: Alarm[] = plan.fixed_events.map((event, index) => 
    fixedEventToAlarm(event, plan, index)
  );

  return {
    id: `schedule-${plan.id}-${Date.now()}`,
    plan_id: plan.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    anchor: undefined,
    alarms,
  };
}

/**
 * Convierte un FixedEvent en una Alarm programable
 */
function fixedEventToAlarm(
  event: FixedEvent,
  plan: Plan,
  index: number
): Alarm {
  return {
    id: `alarm-${plan.id}-${index}`,
    plan_id: plan.id,
    datetime: event.start_datetime_iso,
    timezone: event.timezone || 'local',
    title: event.title,
    body: event.description || '',
    enabled: true,
    snoozeable: true,
    triggered: false,
    completed: false,
    alert_before_minutes: event.alert_before_minutes,
    metadata: {
      domain: plan.domain,
      event_index: index,
      is_fixed: true,
    },
  };
}

// ============================================================================
// GENERACIÓN DE SCHEDULES FLEXIBLES
// ============================================================================

/**
 * Genera un schedule desde un patrón flexible + ancla
 * 
 * Algoritmo:
 * 1. Para cada item del patrón (medicamento, actividad, etc.)
 * 2. Calcula cuántas alarmas necesita (times_per_day o interval_hours)
 * 3. Genera los timestamps desde el ancla
 * 4. Aplica constraints (comidas, sueño, etc.)
 * 
 * @example
 * ```typescript
 * const plan: Plan = {
 *   mode: 'flexible',
 *   flexible_pattern: {
 *     items: [{
 *       interval_hours: 8,
 *       duration_days: 7,
 *       title: 'Amoxicilina 500mg',
 *       constraints: [{ type: 'with_meal', priority: 'required' }]
 *     }]
 *   }
 * };
 * 
 * const anchor: Anchor = { 
 *   type: 'now', 
 *   datetime: new Date().toISOString(), 
 *   timezone: 'local' 
 * };
 * 
 * const schedule = generateFlexibleSchedule(plan, anchor, context);
 * ```
 */
export function generateFlexibleSchedule(
  plan: Plan,
  anchor: Anchor,
  context: GenerationContext
): Schedule {
  if (plan.mode !== 'flexible' || !plan.flexible_pattern) {
    throw new Error('Plan must be in flexible mode with flexible_pattern');
  }

  const anchorTime = parseISO(anchor.datetime);
  const alarms: Alarm[] = [];

  // Generar alarmas para cada item del patrón
  plan.flexible_pattern.items.forEach((item, itemIndex) => {
    const itemAlarms = generateAlarmsForFlexibleItem(
      item,
      anchorTime,
      plan,
      itemIndex,
      context
    );
    alarms.push(...itemAlarms);
  });

  // Ordenar por datetime
  alarms.sort((a, b) => 
    new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  return {
    id: `schedule-${plan.id}-${Date.now()}`,
    plan_id: plan.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    anchor,
    alarms,
  };
}

/**
 * Genera todas las alarmas para un item flexible
 */
function generateAlarmsForFlexibleItem(
  item: FlexiblePatternItem,
  anchorTime: Date,
  plan: Plan,
  itemIndex: number,
  context: GenerationContext
): Alarm[] {
  const alarms: Alarm[] = [];
  let currentTime = anchorTime;

  // Calcular cuántas alarmas totales necesitamos
  const totalAlarms = calculateTotalAlarms(item);

  for (let alarmIndex = 0; alarmIndex < totalAlarms; alarmIndex++) {
    // Generar la próxima alarma
    const triggerTime = calculateNextTrigger(
      currentTime,
      item,
      alarmIndex
    );

    // Aplicar constraints (comidas, sueño, etc.)
    const adjustedTime = applyConstraints(
      triggerTime,
      item.constraints || [],
      context
    );

    alarms.push({
      id: `alarm-${plan.id}-${itemIndex}-${alarmIndex}`,
      plan_id: plan.id,
      datetime: adjustedTime.toISOString(),
      timezone: context.preferences.timezone,
      title: item.title,
      body: item.description || '',
      enabled: true,
      snoozeable: true,
      triggered: false,
      completed: false,
      metadata: {
        domain: plan.domain,
        item_index: itemIndex,
        alarm_index: alarmIndex,
        is_flexible: true,
        original_datetime: triggerTime.toISOString(),
        adjusted: adjustedTime.getTime() !== triggerTime.getTime(),
      },
    });

    // Avanzar el currentTime para la próxima iteración
    currentTime = triggerTime;
  }

  return alarms;
}

/**
 * Calcula cuántas alarmas totales se necesitan
 */
function calculateTotalAlarms(item: FlexiblePatternItem): number {
  const durationDays = item.duration_days || 1;

  // Opción 1: interval_hours (ej: "cada 8 horas por 7 días")
  if (item.interval_hours) {
    const alarmsPerDay = 24 / item.interval_hours;
    return Math.ceil(alarmsPerDay * durationDays);
  }

  // Opción 2: times_per_day (ej: "3 veces al día por 7 días")
  if (item.times_per_day) {
    return item.times_per_day * durationDays;
  }

  // Opción 3: times_of_day (ej: ["08:00", "13:00", "20:00"] por 7 días)
  if (item.times_of_day && item.times_of_day.length > 0) {
    return item.times_of_day.length * durationDays;
  }

  // Fallback: una vez al día
  return durationDays;
}

/**
 * Calcula el próximo trigger basado en el patrón
 */
function calculateNextTrigger(
  fromTime: Date,
  item: FlexiblePatternItem,
  alarmIndex: number
): Date {
  // Opción 1: interval_hours
  if (item.interval_hours) {
    return addHours(fromTime, item.interval_hours);
  }

  // Opción 2: times_per_day (distribuir equitativamente en el día)
  if (item.times_per_day) {
    const dayNumber = Math.floor(alarmIndex / item.times_per_day);
    const indexInDay = alarmIndex % item.times_per_day;
    const hoursPerAlarm = 24 / item.times_per_day;
    
    return addHours(
      addDays(startOfDay(fromTime), dayNumber),
      hoursPerAlarm * indexInDay
    );
  }

  // Opción 3: times_of_day específicos
  if (item.times_of_day && item.times_of_day.length > 0) {
    const dayNumber = Math.floor(alarmIndex / item.times_of_day.length);
    const indexInDay = alarmIndex % item.times_of_day.length;
    const [hours, minutes] = item.times_of_day[indexInDay].split(':').map(Number);
    
    return setMinutes(
      setHours(addDays(startOfDay(fromTime), dayNumber), hours),
      minutes
    );
  }

  // Fallback: un día después
  return addDays(fromTime, 1);
}

// ============================================================================
// APLICACIÓN DE CONSTRAINTS
// ============================================================================

/**
 * Aplica constraints (comidas, sueño, etc.) a un timestamp
 * 
 * Prioridades:
 * - 'required': DEBE cumplirse, ajustar el tiempo
 * - 'preferred': INTENTAR cumplir
 * - 'optional': Sugerencia, no modificar
 */
function applyConstraints(
  originalTime: Date,
  constraints: Constraint[],
  context: GenerationContext
): Date {
  let adjustedTime = originalTime;

  // Aplicar solo constraints 'required' y 'preferred'
  const sorted = [...constraints].sort((a, b) => {
    const priority = { required: 3, preferred: 2, optional: 1 };
    return priority[b.priority] - priority[a.priority];
  });

  for (const constraint of sorted) {
    if (constraint.priority === 'optional') continue;
    adjustedTime = applyConstraint(adjustedTime, constraint, context);
  }

  return adjustedTime;
}

/**
 * Aplica un constraint individual
 */
function applyConstraint(
  time: Date,
  constraint: Constraint,
  context: GenerationContext
): Date {
  const { preferences } = context;

  switch (constraint.type) {
    case 'with_meal': {
      // Mover a la hora de comida más cercana
      const mealTimes = getMealTimes(preferences);
      return moveToClosestTime(time, mealTimes, constraint.priority);
    }

    case 'before_meal': {
      // 30 minutos antes de la comida
      const mealTimes = getMealTimes(preferences);
      const beforeMealTimes = mealTimes.map(t => addHours(t, -0.5));
      return moveToClosestTime(time, beforeMealTimes, constraint.priority);
    }

    case 'after_meal': {
      // 30 minutos después de la comida
      const mealTimes = getMealTimes(preferences);
      const afterMealTimes = mealTimes.map(t => addHours(t, 0.5));
      return moveToClosestTime(time, afterMealTimes, constraint.priority);
    }

    case 'empty_stomach': {
      // 2 horas después de comida
      const mealTimes = getMealTimes(preferences);
      const emptyStomachTimes = mealTimes.map(t => addHours(t, 2));
      return moveToClosestTime(time, emptyStomachTimes, constraint.priority);
    }

    case 'avoid_sleep': {
      // Si cae en ventana de sueño, mover al final
      if (isInSleepWindow(time, preferences)) {
        const sleepEnd = getSleepWindowEnd(time, preferences);
        return constraint.priority === 'required' ? sleepEnd : time;
      }
      return time;
    }

    case 'upon_waking': {
      // Usar el fin de la ventana de sueño
      return getSleepWindowEnd(time, preferences);
    }

    case 'before_sleep': {
      // Usar el inicio de la ventana de sueño
      return getSleepWindowStart(time, preferences);
    }

    case 'specific_time': {
      // Ya viene con horario específico (times_of_day)
      return time;
    }

    default:
      return time;
  }
}

// ============================================================================
// FUNCIONES AUXILIARES - CONSTRAINTS
// ============================================================================

/**
 * Obtiene las horas de comida del día como Date objects
 */
function getMealTimes(preferences: UserPreferences): Date[] {
  const today = startOfDay(new Date());
  const times: Date[] = [];

  if (preferences.mealTimes?.breakfast) {
    times.push(parseTimeString(today, preferences.mealTimes.breakfast));
  }
  if (preferences.mealTimes?.lunch) {
    times.push(parseTimeString(today, preferences.mealTimes.lunch));
  }
  if (preferences.mealTimes?.dinner) {
    times.push(parseTimeString(today, preferences.mealTimes.dinner));
  }

  return times;
}

/**
 * Parsea "HH:MM" a Date de hoy
 */
function parseTimeString(baseDate: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return setMinutes(setHours(baseDate, hours), minutes);
}

/**
 * Mueve un timestamp a la hora más cercana de una lista
 */
function moveToClosestTime(
  time: Date,
  targetTimes: Date[],
  priority: 'required' | 'preferred' | 'optional'
): Date {
  if (priority === 'optional' || targetTimes.length === 0) {
    return time;
  }

  // Ajustar targetTimes al mismo día que time
  const day = startOfDay(time);
  const adjustedTargets = targetTimes.map(t => {
    const hours = t.getHours();
    const minutes = t.getMinutes();
    return setMinutes(setHours(day, hours), minutes);
  });

  // Encontrar la más cercana
  let closest = adjustedTargets[0];
  let minDiff = Math.abs(time.getTime() - closest.getTime());

  for (const target of adjustedTargets) {
    const diff = Math.abs(time.getTime() - target.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = target;
    }
  }

  return priority === 'required' ? closest : time;
}

/**
 * Verifica si un tiempo está en la ventana de sueño
 */
function isInSleepWindow(time: Date, preferences: UserPreferences): boolean {
  if (!preferences.sleepWindow) return false;

  const { start, end } = preferences.sleepWindow;
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  const timeHour = time.getHours();
  const timeMin = time.getMinutes();
  const timeMinutes = timeHour * 60 + timeMin;

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Caso: ventana de sueño cruza medianoche (ej: 23:00 - 07:00)
  if (startMinutes > endMinutes) {
    return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
  }

  // Caso normal
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

/**
 * Obtiene el final de la ventana de sueño
 */
function getSleepWindowEnd(time: Date, preferences: UserPreferences): Date {
  if (!preferences.sleepWindow) return time;

  const [hours, minutes] = preferences.sleepWindow.end.split(':').map(Number);
  let result = setMinutes(setHours(startOfDay(time), hours), minutes);

  // Si el fin es antes de la hora actual, debe ser el día siguiente
  if (isBefore(result, time)) {
    result = addDays(result, 1);
  }

  return result;
}

/**
 * Obtiene el inicio de la ventana de sueño
 */
function getSleepWindowStart(time: Date, preferences: UserPreferences): Date {
  if (!preferences.sleepWindow) return time;

  const [hours, minutes] = preferences.sleepWindow.start.split(':').map(Number);
  return setMinutes(setHours(startOfDay(time), hours), minutes);
}

// ============================================================================
// RECOMENDACIÓN DE ANCLA
// ============================================================================

/**
 * Recomienda el mejor ancla para un plan flexible
 * 
 * Objetivo: Minimizar interrupciones de sueño y maximizar adherencia
 * 
 * @example
 * ```typescript
 * const recommended = recommendAnchor(plan, context);
 * // recommended = {
 * //   type: 'recommended',
 * //   datetime: '2025-12-17T08:00:00Z',
 * //   timezone: 'local',
 * //   reason: 'Evita interrupciones de sueño'
 * // }
 * ```
 */
export function recommendAnchor(
  plan: Plan,
  context: GenerationContext
): Anchor {
  if (plan.mode !== 'flexible' || !plan.flexible_pattern) {
    throw new Error('Can only recommend anchor for flexible plans');
  }

  const { preferences, currentTime } = context;
  const candidates: Anchor[] = [];

  // Candidata 1: Ahora mismo
  candidates.push({ 
    type: 'now', 
    datetime: currentTime.toISOString(),
    timezone: preferences.timezone,
  });

  // Candidata 2: Después del sueño (mañana)
  if (preferences.sleepWindow) {
    const [hours, minutes] = preferences.sleepWindow.end.split(':').map(Number);
    const afterSleep = setMinutes(setHours(startOfDay(currentTime), hours), minutes);
    
    const adjusted = isBefore(afterSleep, currentTime) 
      ? addDays(afterSleep, 1) 
      : afterSleep;
    
    candidates.push({
      type: 'recommended',
      datetime: adjusted.toISOString(),
      timezone: preferences.timezone,
      reason: 'Comienza después de tu hora de despertar',
    });
  }

  // Candidata 3: Con el desayuno
  if (preferences.mealTimes?.breakfast) {
    const breakfast = parseTimeString(startOfDay(currentTime), preferences.mealTimes.breakfast);
    const adjusted = isBefore(breakfast, currentTime) 
      ? addDays(breakfast, 1) 
      : breakfast;
    
    candidates.push({
      type: 'recommended',
      datetime: adjusted.toISOString(),
      timezone: preferences.timezone,
      reason: 'Comienza con tu desayuno',
    });
  }

  // Evaluar cada candidata
  const scored = candidates.map(anchor => {
    const schedule = generateFlexibleSchedule(plan, anchor, context);
    const score = scoreSchedule(schedule, context);
    return { anchor, score };
  });

  // Ordenar por score (mayor es mejor)
  scored.sort((a, b) => b.score - a.score);

  return scored[0].anchor;
}

/**
 * Evalúa un schedule y asigna un score (0-100)
 */
function scoreSchedule(schedule: Schedule, context: GenerationContext): number {
  let score = 50; // Base score

  for (const alarm of schedule.alarms) {
    const time = parseISO(alarm.datetime);

    // Penalizar alarmas durante sueño
    if (isInSleepWindow(time, context.preferences)) {
      score -= 20;
    }

    // Bonus por alarmas cerca de comidas
    const nearMeal = isNearMealTime(time, context.preferences);
    if (nearMeal) score += 5;
  }

  // Bonus por distribución uniforme
  const isUniform = checkUniformDistribution(schedule.alarms);
  if (isUniform) score += 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Verifica si un tiempo está cerca de una hora de comida
 */
function isNearMealTime(time: Date, preferences: UserPreferences): boolean {
  const mealTimes = getMealTimes(preferences);
  const threshold = 30 * 60 * 1000; // 30 minutos en ms

  return mealTimes.some(meal => 
    Math.abs(time.getTime() - meal.getTime()) <= threshold
  );
}

/**
 * Verifica si las alarmas están uniformemente distribuidas
 */
function checkUniformDistribution(alarms: Alarm[]): boolean {
  if (alarms.length < 2) return true;

  const times = alarms.map(a => parseISO(a.datetime).getTime());
  times.sort((a, b) => a - b);

  // Calcular diferencias entre alarmas consecutivas
  const diffs = [];
  for (let i = 1; i < times.length; i++) {
    diffs.push(times[i] - times[i - 1]);
  }

  // Verificar que no haya dos alarmas muy juntas (< 2 horas)
  const twoHoursMs = 2 * 60 * 60 * 1000;
  return diffs.every(diff => diff >= twoHoursMs);
}
