/**
 * Schedules Store - Estado de Schedules y Alarmas
 * 
 * Maneja:
 * - Schedules generados (colecciones de alarmas)
 * - Estado de alarmas (triggered, completed, snoozed)
 * - Generación y actualización de schedules
 * 
 * Persistido con AsyncStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Schedule, Alarm } from '@/types';

interface SchedulesState {
  schedules: Schedule[];
  isLoading: boolean;
  error: string | null;
  
  // Schedule CRUD
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: string, updates: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  getScheduleById: (id: string) => Schedule | undefined;
  getSchedulesByPlanId: (planId: string) => Schedule[];
  clearAllSchedules: () => void;
  
  // Alarm management
  updateAlarm: (scheduleId: string, alarmId: string, updates: Partial<Alarm>) => void;
  deleteAlarm: (scheduleId: string, alarmId: string) => void;
  markAlarmTriggered: (scheduleId: string, alarmId: string) => void;
  markAlarmCompleted: (scheduleId: string, alarmId: string) => void;
  snoozeAlarm: (scheduleId: string, alarmId: string, minutes: number) => void;
  toggleAlarmEnabled: (scheduleId: string, alarmId: string) => void;
  
  // Schedule editing
  updateScheduleTimes: (scheduleId: string, newStartTime: string) => void;
  updateScheduleDuration: (scheduleId: string, newDuration: number) => void;
  updateScheduleFrequency: (scheduleId: string, newFrequency: number) => void;
  
  // Queries
  getUpcomingAlarms: (limit?: number) => Alarm[];
  getActiveAlarms: () => Alarm[];
  getPendingAlarms: () => Alarm[];
  getCompletedAlarms: () => Alarm[];
  
  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSchedulesStore = create<SchedulesState>()(
  persist(
    (set, get) => ({
      schedules: [],
      isLoading: false,
      error: null,

      // Schedule CRUD
      addSchedule: (schedule) =>
        set((state) => ({
          schedules: [...state.schedules, schedule],
          error: null,
        })),

      updateSchedule: (id, updates) =>
        set((state) => ({
          schedules: state.schedules.map((schedule) =>
            schedule.id === id 
              ? { ...schedule, ...updates, updated_at: new Date().toISOString() }
              : schedule
          ),
          error: null,
        })),

      deleteSchedule: (id) =>
        set((state) => ({
          schedules: state.schedules.filter((schedule) => schedule.id !== id),
          error: null,
        })),

      getScheduleById: (id) => {
        return get().schedules.find((schedule) => schedule.id === id);
      },

      getSchedulesByPlanId: (planId) => {
        return get().schedules.filter((schedule) => schedule.plan_id === planId);
      },

      clearAllSchedules: () =>
        set({
          schedules: [],
          error: null,
        }),

      // Alarm management
      updateAlarm: (scheduleId, alarmId, updates) =>
        set((state) => ({
          schedules: state.schedules.map((schedule) =>
            schedule.id === scheduleId
              ? {
                  ...schedule,
                  alarms: schedule.alarms.map((alarm) =>
                    alarm.id === alarmId ? { ...alarm, ...updates } : alarm
                  ),
                  updated_at: new Date().toISOString(),
                }
              : schedule
          ),
          error: null,
        })),

      deleteAlarm: (scheduleId, alarmId) =>
        set((state) => ({
          schedules: state.schedules.map((schedule) =>
            schedule.id === scheduleId
              ? {
                  ...schedule,
                  alarms: schedule.alarms.filter((alarm) => alarm.id !== alarmId),
                  updated_at: new Date().toISOString(),
                }
              : schedule
          ).filter((schedule) => schedule.alarms.length > 0), // Remove schedule if no alarms left
          error: null,
        })),

      markAlarmTriggered: (scheduleId, alarmId) =>
        get().updateAlarm(scheduleId, alarmId, { 
          triggered: true,
        }),

      markAlarmCompleted: (scheduleId, alarmId) =>
        get().updateAlarm(scheduleId, alarmId, { 
          completed: true,
          completed_at: new Date().toISOString(),
        }),

      snoozeAlarm: (scheduleId, alarmId, minutes) => {
        const schedule = get().getScheduleById(scheduleId);
        if (!schedule) return;

        const alarm = schedule.alarms.find((a) => a.id === alarmId);
        if (!alarm) return;

        const newDatetime = new Date(
          new Date(alarm.datetime).getTime() + minutes * 60 * 1000
        ).toISOString();

        get().updateAlarm(scheduleId, alarmId, {
          datetime: newDatetime,
          metadata: {
            ...alarm.metadata,
            snoozed_count: ((alarm.metadata?.snoozed_count as number) || 0) + 1,
          },
        });
      },

      toggleAlarmEnabled: (scheduleId, alarmId) => {
        const schedule = get().getScheduleById(scheduleId);
        if (!schedule) return;

        const alarm = schedule.alarms.find((a) => a.id === alarmId);
        if (!alarm) return;

        get().updateAlarm(scheduleId, alarmId, {
          enabled: !alarm.enabled,
        });
      },

      // Schedule editing
      updateScheduleTimes: (scheduleId, newStartTime) => {
        const schedule = get().getScheduleById(scheduleId);
        if (!schedule || schedule.alarms.length === 0) return;

        // Calcular el offset entre el primer alarm y el nuevo tiempo de inicio
        const firstAlarm = schedule.alarms.sort((a, b) => 
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        )[0];
        
        const oldStart = new Date(firstAlarm.datetime).getTime();
        const newStart = new Date(newStartTime).getTime();
        const offset = newStart - oldStart;

        // Ajustar todas las alarmas con el mismo offset
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === scheduleId
              ? {
                  ...s,
                  alarms: s.alarms.map((alarm) => ({
                    ...alarm,
                    datetime: new Date(
                      new Date(alarm.datetime).getTime() + offset
                    ).toISOString(),
                  })),
                  updated_at: new Date().toISOString(),
                }
              : s
          ),
        }));
      },

      updateScheduleDuration: (scheduleId, newDuration) => {
        const schedule = get().getScheduleById(scheduleId);
        if (!schedule || schedule.alarms.length === 0) return;

        // Obtener la frecuencia actual entre alarmas (en ms)
        const sortedAlarms = schedule.alarms.sort((a, b) => 
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        );
        
        if (sortedAlarms.length < 2) {
          // Si solo hay una alarma, no se puede calcular frecuencia
          return;
        }

        const firstTime = new Date(sortedAlarms[0].datetime).getTime();
        const secondTime = new Date(sortedAlarms[1].datetime).getTime();
        const frequencyMs = secondTime - firstTime;

        // Calcular cuántas alarmas necesitamos para la nueva duración
        const newAlarmsCount = Math.ceil((newDuration * 24 * 60 * 60 * 1000) / frequencyMs);

        // Generar nuevas alarmas
        const newAlarms = Array.from({ length: newAlarmsCount }, (_, i) => ({
          ...sortedAlarms[0],
          id: i === 0 ? sortedAlarms[0].id : `${scheduleId}-alarm-${i}`,
          datetime: new Date(firstTime + i * frequencyMs).toISOString(),
          completed: false,
          completed_at: undefined,
          triggered: false,
        }));

        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === scheduleId
              ? {
                  ...s,
                  alarms: newAlarms,
                  updated_at: new Date().toISOString(),
                }
              : s
          ),
        }));
      },

      updateScheduleFrequency: (scheduleId, newFrequency) => {
        const schedule = get().getScheduleById(scheduleId);
        if (!schedule || schedule.alarms.length === 0) return;

        const sortedAlarms = schedule.alarms.sort((a, b) => 
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        );

        const firstTime = new Date(sortedAlarms[0].datetime).getTime();
        const lastTime = new Date(sortedAlarms[sortedAlarms.length - 1].datetime).getTime();
        const totalDuration = lastTime - firstTime;

        // Nueva frecuencia en ms
        const newFrequencyMs = newFrequency * 60 * 60 * 1000;

        // Calcular cuántas alarmas necesitamos
        const newAlarmsCount = Math.ceil(totalDuration / newFrequencyMs) + 1;

        // Generar nuevas alarmas
        const newAlarms = Array.from({ length: newAlarmsCount }, (_, i) => ({
          ...sortedAlarms[0],
          id: i === 0 ? sortedAlarms[0].id : `${scheduleId}-alarm-${i}`,
          datetime: new Date(firstTime + i * newFrequencyMs).toISOString(),
          completed: false,
          completed_at: undefined,
          triggered: false,
        }));

        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === scheduleId
              ? {
                  ...s,
                  alarms: newAlarms,
                  updated_at: new Date().toISOString(),
                }
              : s
          ),
        }));
      },

      // Queries
      getUpcomingAlarms: (limit = 10) => {
        const now = new Date();
        const allAlarms = get().schedules.flatMap((schedule) => schedule.alarms);

        return allAlarms
          .filter((alarm) => 
            alarm.enabled && 
            !alarm.completed && 
            new Date(alarm.datetime) > now
          )
          .sort((a, b) => 
            new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
          )
          .slice(0, limit);
      },

      getActiveAlarms: () => {
        const allAlarms = get().schedules.flatMap((schedule) => schedule.alarms);
        return allAlarms.filter((alarm) => 
          alarm.enabled && !alarm.completed && !alarm.triggered
        );
      },

      getPendingAlarms: () => {
        const now = new Date();
        const allAlarms = get().schedules.flatMap((schedule) => schedule.alarms);
        
        return allAlarms.filter((alarm) => 
          alarm.enabled && 
          alarm.triggered && 
          !alarm.completed &&
          new Date(alarm.datetime) <= now
        );
      },

      getCompletedAlarms: () => {
        const allAlarms = get().schedules.flatMap((schedule) => schedule.alarms);
        return allAlarms.filter((alarm) => alarm.completed);
      },

      // UI state
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
    }),
    {
      name: 'photolarm-schedules',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
