/**
 * Medication Vocabulary Service
 * 
 * Gestiona el vocabulario de medicamentos aprendidos por el usuario.
 * Los nuevos medicamentos validados se guardan para mejorar futuras extracciones.
 * 
 * ROADMAP:
 * - Fase 1 (Actual): Almacenamiento local con AsyncStorage
 * - Fase 2 (Futuro): Sincronización con base de datos en la nube
 * - Fase 3 (Futuro): Compartir vocabulario entre usuarios (con privacidad)
 */

import { StorageService } from './storage.service';
import medicalPatterns from '../data/medical-patterns.json';

const STORAGE_KEY = 'learned_medications';

export interface LearnedMedication {
  name: string;                    // Nombre normalizado del medicamento
  original_names: string[];        // Variaciones detectadas (OCR)
  times_confirmed: number;         // Veces que el usuario lo confirmó
  first_seen: string;              // ISO timestamp
  last_seen: string;               // ISO timestamp
}

class MedicationVocabularyService {
  private storage: StorageService;
  private cache: Map<string, LearnedMedication> | null = null;

  constructor() {
    this.storage = new StorageService('medication_vocab');
  }

  /**
   * Normaliza nombre de medicamento para comparación
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .trim();
  }

  /**
   * Carga el vocabulario aprendido desde storage
   */
  async loadVocabulary(): Promise<LearnedMedication[]> {
    try {
      const data = await this.storage.get<LearnedMedication[]>(STORAGE_KEY);
      
      if (data) {
        // Actualizar cache
        this.cache = new Map();
        data.forEach(med => {
          this.cache!.set(this.normalizeName(med.name), med);
        });
        
        console.log(`✅ Loaded ${data.length} learned medications`);
        return data;
      }
      
      this.cache = new Map();
      return [];
    } catch (error) {
      console.error('Error loading medication vocabulary:', error);
      this.cache = new Map();
      return [];
    }
  }

  /**
   * Guarda un nuevo medicamento o actualiza uno existente
   */
  async saveMedication(name: string, originalName?: string): Promise<void> {
    try {
      // Don't save if it's already in base medications (from JSON)
      const baseMedications = medicalPatterns.medications.common_names;
      const normalizedName = this.normalizeName(name);
      const isInBase = baseMedications.some(med => 
        this.normalizeName(med) === normalizedName
      );
      
      if (isInBase) {
        console.log(`⏭️ Skipping save: "${name}" already in base medications`);
        return;
      }
      
      // Cargar vocabulario si no está en cache
      if (!this.cache) {
        await this.loadVocabulary();
      }

      const normalized = this.normalizeName(name);
      const now = new Date().toISOString();
      
      let medication = this.cache!.get(normalized);
      
      if (medication) {
        // Actualizar existente
        medication.times_confirmed++;
        medication.last_seen = now;
        
        // Agregar variación si es nueva
        if (originalName && !medication.original_names.includes(originalName)) {
          medication.original_names.push(originalName);
        }
        
        console.log(`📝 Updated medication: ${name} (${medication.times_confirmed} times)`);
      } else {
        // Crear nuevo
        medication = {
          name,
          original_names: originalName ? [originalName] : [name],
          times_confirmed: 1,
          first_seen: now,
          last_seen: now,
        };
        
        this.cache!.set(normalized, medication);
        console.log(`✨ New medication learned: ${name}`);
      }

      // Guardar en storage
      const allMedications = Array.from(this.cache!.values());
      await this.storage.set(STORAGE_KEY, allMedications);
    } catch (error) {
      console.error('Error saving medication:', error);
    }
  }

  /**
   * Obtiene todos los medicamentos conocidos (base + aprendidos)
   */
  async getAllKnownMedications(): Promise<string[]> {
    // Medicamentos base del JSON
    const baseMedications = medicalPatterns.medications.common_names;
    
    // Medicamentos aprendidos
    const learned = await this.loadVocabulary();
    const learnedNames = learned.map(m => m.name);
    
    // Combinar y deduplicar
    const allMedications = [...new Set([...baseMedications, ...learnedNames])];
    
    console.log(`📚 Total known medications: ${allMedications.length} (${baseMedications.length} base + ${learnedNames.length} learned)`);
    
    return allMedications;
  }

  /**
   * Busca un medicamento en el vocabulario aprendido
   */
  async findLearnedMedication(name: string): Promise<LearnedMedication | null> {
    if (!this.cache) {
      await this.loadVocabulary();
    }
    
    const normalized = this.normalizeName(name);
    return this.cache!.get(normalized) || null;
  }

  /**
   * Obtiene estadísticas del vocabulario
   */
  async getStats(): Promise<{
    total_learned: number;
    most_common: LearnedMedication[];
    recently_added: LearnedMedication[];
  }> {
    const vocabulary = await this.loadVocabulary();
    
    // Ordenar por frecuencia
    const mostCommon = [...vocabulary]
      .sort((a, b) => b.times_confirmed - a.times_confirmed)
      .slice(0, 10);
    
    // Ordenar por fecha
    const recentlyAdded = [...vocabulary]
      .sort((a, b) => new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime())
      .slice(0, 10);
    
    return {
      total_learned: vocabulary.length,
      most_common: mostCommon,
      recently_added: recentlyAdded,
    };
  }

  /**
   * Limpia el cache (útil para testing)
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Elimina un medicamento del vocabulario
   */
  async removeMedication(name: string): Promise<void> {
    try {
      if (!this.cache) {
        await this.loadVocabulary();
      }

      const normalized = this.normalizeName(name);
      this.cache!.delete(normalized);

      const allMedications = Array.from(this.cache!.values());
      await this.storage.set(STORAGE_KEY, allMedications);
      
      console.log(`🗑️ Removed medication: ${name}`);
    } catch (error) {
      console.error('Error removing medication:', error);
    }
  }
}

// Singleton instance
let instance: MedicationVocabularyService | null = null;

export function getMedicationVocabularyService(): MedicationVocabularyService {
  if (!instance) {
    instance = new MedicationVocabularyService();
  }
  return instance;
}

export default MedicationVocabularyService;
