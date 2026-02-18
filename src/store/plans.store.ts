/**
 * Plans Store - Estado de Planes Extraídos
 * 
 * Maneja:
 * - Lista de planes (medicamentos, tratamientos, etc.)
 * - CRUD operations
 * - Estado de extracción (loading, error)
 * 
 * Persistido con AsyncStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Plan } from '@/types';

interface PlansState {
  plans: Plan[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addPlan: (plan: Plan) => void;
  addPlans: (plans: Plan[]) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
  getPlanById: (id: string) => Plan | undefined;
  clearAllPlans: () => void;
  
  // Filtering
  getPlansByDomain: (domain: string) => Plan[];
  getActivePlans: () => Plan[];
  
  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePlansStore = create<PlansState>()(
  persist(
    (set, get) => ({
      plans: [],
      isLoading: false,
      error: null,

      addPlan: (plan) =>
        set((state) => ({
          plans: [...state.plans, plan],
          error: null,
        })),

      addPlans: (newPlans) =>
        set((state) => ({
          plans: [...state.plans, ...newPlans],
          error: null,
        })),

      updatePlan: (id, updates) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.id === id ? { ...plan, ...updates } : plan
          ),
          error: null,
        })),

      deletePlan: (id) =>
        set((state) => ({
          plans: state.plans.filter((plan) => plan.id !== id),
          error: null,
        })),

      getPlanById: (id) => {
        return get().plans.find((plan) => plan.id === id);
      },

      clearAllPlans: () =>
        set({
          plans: [],
          error: null,
        }),

      // Filtering helpers
      getPlansByDomain: (domain) => {
        return get().plans.filter((plan) => plan.domain === domain);
      },

      getActivePlans: () => {
        // Planes que tienen eventos futuros o están activos
        const now = new Date();
        return get().plans.filter((plan) => {
          if (plan.mode === 'fixed' && plan.fixed_events) {
            return plan.fixed_events.some(
              (event) => new Date(event.start_datetime_iso) > now
            );
          }
          if (plan.mode === 'flexible' && plan.flexible_pattern) {
            // Los planes flexibles están "activos" hasta que se completen manualmente
            return true;
          }
          return false;
        });
      },

      // UI state management
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
    }),
    {
      name: 'photolarm-plans',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
