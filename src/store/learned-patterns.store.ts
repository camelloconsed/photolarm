/**
 * Learned Patterns Store
 * 
 * Sistema de aprendizaje incremental para extracción de medicamentos.
 * Guarda patrones validados por el usuario para mejorar la precisión con el tiempo.
 * 
 * Persistido con AsyncStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  LearnedMedicationPattern,
  ExtractedMedicationValues,
  LearningStats,
  PatternMatch,
} from '@/types/learned-patterns';
import {
  normalizePhrase,
  tokenize,
  generatePatternSignature,
  calculateConfidence,
  calculateThreshold,
  findBestMatch,
  generatePatternId,
} from '@/lib/pattern-matcher';

interface LearnedPatternsState {
  patterns: LearnedMedicationPattern[];
  metadata: {
    total_validations: number;
    last_sync?: string;
  };
  
  // Core Actions
  saveValidation: (
    phrase: string,
    extracted: ExtractedMedicationValues,
    wasConfirmed: boolean
  ) => void;
  
  findMatch: (phrase: string) => PatternMatch | null;
  
  // Management
  getPatternById: (id: string) => LearnedMedicationPattern | undefined;
  deletePattern: (id: string) => void;
  clearAllPatterns: () => void;
  
  // Analytics
  getStats: () => LearningStats;
  getMostReliablePatterns: (limit?: number) => LearnedMedicationPattern[];
  getRecentValidations: (days?: number) => LearnedMedicationPattern[];
  
  // Import/Export (para sincronización futura)
  exportPatterns: () => string;
  importPatterns: (json: string) => void;
}

export const useLearnedPatternsStore = create<LearnedPatternsState>()(
  persist(
    (set, get) => ({
      patterns: [],
      metadata: {
        total_validations: 0,
      },

      /**
       * Guarda o actualiza un patrón basado en validación del usuario
       */
      saveValidation: (phrase, extracted, wasConfirmed) => {
        const normalized = normalizePhrase(phrase);
        const existing = get().patterns.find(
          p => p.normalized_phrase === normalized
        );

        if (existing) {
          // Actualizar patrón existente
          set(state => ({
            patterns: state.patterns.map(p => {
              if (p.id === existing.id) {
                const newConfirmations = wasConfirmed
                  ? p.learning.confirmations + 1
                  : p.learning.confirmations;
                const newCorrections = !wasConfirmed
                  ? p.learning.corrections + 1
                  : p.learning.corrections;
                const newConfidence = calculateConfidence(
                  newConfirmations,
                  newCorrections
                );

                return {
                  ...p,
                  extracted, // Actualizar con valores más recientes
                  learning: {
                    ...p.learning,
                    confirmations: newConfirmations,
                    corrections: newCorrections,
                    confidence: newConfidence,
                    last_validated: new Date().toISOString(),
                  },
                  similarity_threshold: calculateThreshold(newConfidence),
                };
              }
              return p;
            }),
            metadata: {
              ...state.metadata,
              total_validations: state.metadata.total_validations + 1,
            },
          }));

          console.log('📚 Pattern updated:', {
            medication: extracted.medication_name,
            confidence: existing.learning.confidence,
            validations: existing.learning.confirmations + existing.learning.corrections + 1,
          });
        } else {
          // Crear nuevo patrón
          const tokens = tokenize(normalized);
          const newPattern: LearnedMedicationPattern = {
            id: generatePatternId(),
            raw_phrase: phrase,
            normalized_phrase: normalized,
            tokens,
            extracted,
            learning: {
              confirmations: wasConfirmed ? 1 : 0,
              corrections: wasConfirmed ? 0 : 1,
              confidence: calculateConfidence(
                wasConfirmed ? 1 : 0,
                wasConfirmed ? 0 : 1
              ),
              first_seen: new Date().toISOString(),
              last_validated: new Date().toISOString(),
            },
            pattern_signature: generatePatternSignature(tokens),
            similarity_threshold: 0.75, // Threshold inicial
          };

          set(state => ({
            patterns: [...state.patterns, newPattern],
            metadata: {
              ...state.metadata,
              total_validations: state.metadata.total_validations + 1,
            },
          }));

          console.log('✨ New pattern learned:', {
            medication: extracted.medication_name,
            signature: newPattern.pattern_signature,
          });
        }
      },

      /**
       * Busca el mejor patrón que coincida con una frase
       */
      findMatch: (phrase) => {
        return findBestMatch(phrase, get().patterns);
      },

      /**
       * Obtiene un patrón por ID
       */
      getPatternById: (id) => {
        return get().patterns.find(p => p.id === id);
      },

      /**
       * Elimina un patrón específico
       */
      deletePattern: (id) => {
        set(state => ({
          patterns: state.patterns.filter(p => p.id !== id),
        }));
      },

      /**
       * Elimina todos los patrones (reset)
       */
      clearAllPatterns: () => {
        set({
          patterns: [],
          metadata: {
            total_validations: 0,
          },
        });
      },

      /**
       * Obtiene estadísticas del sistema de aprendizaje
       */
      getStats: () => {
        const { patterns, metadata } = get();
        
        if (patterns.length === 0) {
          return {
            total_patterns: 0,
            total_validations: 0,
            avg_confidence: 0,
            most_reliable_patterns: [],
            recent_validations: 0,
          };
        }

        const avgConfidence = patterns.reduce(
          (sum, p) => sum + p.learning.confidence,
          0
        ) / patterns.length;

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const recentValidations = patterns.filter(
          p => p.learning.last_validated >= sevenDaysAgo
        ).length;

        return {
          total_patterns: patterns.length,
          total_validations: metadata.total_validations,
          avg_confidence: avgConfidence,
          most_reliable_patterns: get().getMostReliablePatterns(5),
          recent_validations: recentValidations,
        };
      },

      /**
       * Obtiene los patrones más confiables
       */
      getMostReliablePatterns: (limit = 10) => {
        return get()
          .patterns
          .filter(p => p.learning.confidence > 0.7) // Solo patrones confiables
          .sort((a, b) => {
            // Ordenar por confidence primero, luego por número de validaciones
            if (b.learning.confidence !== a.learning.confidence) {
              return b.learning.confidence - a.learning.confidence;
            }
            const totalA = a.learning.confirmations + a.learning.corrections;
            const totalB = b.learning.confirmations + b.learning.corrections;
            return totalB - totalA;
          })
          .slice(0, limit);
      },

      /**
       * Obtiene patrones validados recientemente
       */
      getRecentValidations: (days = 7) => {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        return get()
          .patterns
          .filter(p => p.learning.last_validated >= cutoff)
          .sort((a, b) => b.learning.last_validated.localeCompare(a.learning.last_validated));
      },

      /**
       * Exporta patrones como JSON (para backup o sync)
       */
      exportPatterns: () => {
        const { patterns, metadata } = get();
        return JSON.stringify({
          patterns,
          metadata,
          exported_at: new Date().toISOString(),
          version: '1.0.0',
        }, null, 2);
      },

      /**
       * Importa patrones desde JSON
       */
      importPatterns: (json) => {
        try {
          const data = JSON.parse(json);
          if (data.patterns && Array.isArray(data.patterns)) {
            set({
              patterns: data.patterns,
              metadata: data.metadata || { total_validations: 0 },
            });
            console.log('✅ Patterns imported:', data.patterns.length);
          }
        } catch (error) {
          console.error('❌ Failed to import patterns:', error);
        }
      },
    }),
    {
      name: 'learned-patterns-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
