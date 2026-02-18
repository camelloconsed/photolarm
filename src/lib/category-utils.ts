/**
 * Category Utilities
 * 
 * Helper functions for mapping categories to UI elements (icons, colors, labels)
 */

import type { Category } from '@/types';

export interface CategoryInfo {
  icon: string;
  label: string;
  color: string;
  description: string;
}

/**
 * Map category to UI information
 */
export function getCategoryInfo(category: Category): CategoryInfo {
  const categoryMap: Record<Category, CategoryInfo> = {
    health: {
      icon: '💊',
      label: 'Salud',
      color: '#FF3B30',
      description: 'Medicamentos y tratamientos',
    },
    cooking: {
      icon: '🍳',
      label: 'Cocina',
      color: '#FF9500',
      description: 'Recetas y tiempos de cocción',
    },
    fitness: {
      icon: '🏋️',
      label: 'Fitness',
      color: '#FF2D55',
      description: 'Ejercicios y rutinas',
    },
    habit: {
      icon: '🌱',
      label: 'Hábitos',
      color: '#34C759',
      description: 'Hábitos diarios',
    },
    appointment: {
      icon: '🏥',
      label: 'Citas',
      color: '#007AFF',
      description: 'Citas médicas y consultas',
    },
    class: {
      icon: '📚',
      label: 'Clases',
      color: '#5856D6',
      description: 'Clases y cursos',
    },
    work: {
      icon: '💼',
      label: 'Trabajo',
      color: '#8E8E93',
      description: 'Tareas laborales',
    },
    event: {
      icon: '🎉',
      label: 'Eventos',
      color: '#AF52DE',
      description: 'Eventos especiales',
    },
    other: {
      icon: '📌',
      label: 'Otros',
      color: '#8E8E93',
      description: 'Otros recordatorios',
    },
  };

  return categoryMap[category] ?? categoryMap.other;
}

export function getModeLabel(mode: 'fixed' | 'flexible'): string {
  return mode === 'fixed' 
    ? 'Fecha y hora exacta' 
    : 'Empieza cuando quieras';
}

export function getModeIcon(mode: 'fixed' | 'flexible'): string {
  return mode === 'fixed' ? '📅' : '🔄';
}

export function shouldShowRecommendedAnchor(category: Category): boolean {
  return category === 'health' || category === 'habit';
}

export const ANCHOR_LABELS = {
  now: {
    icon: '⚡',
    title: 'AHORA MISMO',
    description: 'Comenzar inmediatamente',
  },
  user_selected: {
    icon: '🕐',
    title: 'ELEGIR HORA',
    description: 'Tú decides cuándo',
  },
  recommended: {
    icon: '⭐',
    title: 'HORA RECOMENDADA',
    description: 'Optimizado para tu rutina',
  },
} as const;
