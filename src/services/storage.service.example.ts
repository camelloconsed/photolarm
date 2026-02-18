/**
 * Ejemplo de uso del Storage Service
 * 
 * Este archivo muestra cómo usar el StorageService en tu aplicación
 */

import { storageService } from './storage.service';
import type { Plan, UserPreferences, Schedule } from '@/types';

/**
 * EJEMPLO 1: Guardar y leer preferencias del usuario
 */
export async function exampleUserPreferences() {
  // Guardar preferencias
  const preferences: UserPreferences = {
    sleepWindow: {
      start: '23:00',
      end: '07:00',
    },
    mealTimes: {
      breakfast: '08:00',
      lunch: '13:00',
      dinner: '20:00',
    },
    nightShiftMode: false,
    doNotDisturb: false,
    allowSleepInterruptions: false,
    timezone: 'America/Argentina/Buenos_Aires',
  };

  await storageService.set('user-preferences', preferences);
  console.log('✅ Preferencias guardadas');

  // Leer preferencias
  const saved = await storageService.get<UserPreferences>('user-preferences');
  console.log('📖 Preferencias leídas:', saved);
}

/**
 * EJEMPLO 2: Guardar y leer planes
 */
export async function examplePlans() {
  const plans: Plan[] = [
    {
      id: 'plan-1',
      mode: 'flexible',
      domain: 'medication',
      confidence: 0.95,
      evidence: 'Amoxicilina 500mg cada 8 horas por 7 días con comida',
      flexible_pattern: {
        items: [
          {
            interval_hours: 8,
            duration_days: 7,
            title: 'Amoxicilina 500mg',
            description: 'Tomar con comida',
            constraints: [
              {
                type: 'with_meal',
                priority: 'required',
              },
            ],
          },
        ],
      },
    },
  ];

  await storageService.set('plans', plans);
  console.log('✅ Planes guardados');

  // Leer planes
  const savedPlans = await storageService.get<Plan[]>('plans');
  console.log('📖 Planes leídos:', savedPlans);
}

/**
 * EJEMPLO 3: Verificar si existe un dato
 */
export async function exampleCheckExists() {
  const exists = await storageService.has('user-preferences');
  console.log('¿Existen preferencias?', exists);
}

/**
 * EJEMPLO 4: Obtener todas las claves
 */
export async function exampleGetAllKeys() {
  const keys = await storageService.getAllKeys();
  console.log('🔑 Todas las claves:', keys);
}

/**
 * EJEMPLO 5: Guardar múltiples valores a la vez
 */
export async function exampleBatchSave() {
  await storageService.setMultiple({
    'onboarding-completed': true,
    'last-sync': new Date().toISOString(),
    'notification-count': 5,
  });

  console.log('✅ Múltiples valores guardados');
}

/**
 * EJEMPLO 6: Leer múltiples valores a la vez
 */
export async function exampleBatchRead() {
  const values = await storageService.getMultiple<any>([
    'onboarding-completed',
    'last-sync',
    'notification-count',
  ]);

  console.log('📖 Valores leídos:', values);
}

/**
 * EJEMPLO 7: Eliminar un dato
 */
export async function exampleDelete() {
  await storageService.delete('notification-count');
  console.log('🗑️ Dato eliminado');
}

/**
 * EJEMPLO 8: Limpiar todo (usar con cuidado!)
 */
export async function exampleClearAll() {
  // ⚠️ Esto elimina TODOS los datos
  // Solo usar en casos específicos como logout
  await storageService.clear();
  console.log('🧹 Todo limpiado');
}

/**
 * EJEMPLO COMPLETO: Flujo de la app
 */
export async function exampleCompleteFlow() {
  console.log('🚀 Iniciando flujo completo...\n');

  // 1. Verificar si es primera vez
  const isFirstTime = !(await storageService.has('onboarding-completed'));

  if (isFirstTime) {
    console.log('👋 Primera vez - Guardando preferencias por defecto');
    await storageService.set('user-preferences', {
      sleepWindow: { start: '23:00', end: '07:00' },
      mealTimes: {
        breakfast: '08:00',
        lunch: '13:00',
        dinner: '20:00',
      },
      nightShiftMode: false,
      doNotDisturb: false,
      allowSleepInterruptions: false,
      timezone: 'America/Argentina/Buenos_Aires',
    });
    await storageService.set('onboarding-completed', true);
  }

  // 2. Cargar preferencias
  const preferences = await storageService.get<UserPreferences>('user-preferences');
  console.log('⚙️ Preferencias cargadas:', preferences);

  // 3. Guardar un nuevo plan
  const newPlan: Plan = {
    id: 'plan-2',
    mode: 'fixed',
    domain: 'appointment',
    confidence: 1.0,
    evidence: 'Consulta médica el 20/12 a las 10:00',
    fixed_events: [
      {
        start_datetime_iso: '2025-12-20T10:00:00-03:00',
        timezone: 'America/Argentina/Buenos_Aires',
        title: 'Consulta médica',
        description: 'Control mensual',
      },
    ],
  };

  // Obtener planes existentes
  const existingPlans = (await storageService.get<Plan[]>('plans')) || [];
  const updatedPlans = [...existingPlans, newPlan];
  await storageService.set('plans', updatedPlans);
  console.log('📝 Plan agregado. Total:', updatedPlans.length);

  // 4. Ver todas las claves guardadas
  const allKeys = await storageService.getAllKeys();
  console.log('\n🔑 Todas las claves guardadas:', allKeys);

  console.log('\n✅ Flujo completo terminado!');
}
