/**
 * Learned Patterns Types
 * 
 * Sistema de aprendizaje incremental para extracción de medicamentos.
 * Los patrones se aprenden y mejoran con cada validación del usuario.
 */

/**
 * Valores extraídos de una frase de medicamento
 */
export interface ExtractedMedicationValues {
  medication_name: string;    // "Ibuprofeno"
  frequency_hours: number;    // 8
  duration_days: number;      // 6
  dosage?: string;            // "500 mg" (opcional)
  administration?: string;    // "oral" (opcional)
}

/**
 * Metadata de aprendizaje del patrón
 */
export interface LearningMetadata {
  confirmations: number;      // Veces que usuario confirmó sin cambios
  corrections: number;        // Veces que usuario corrigió valores
  confidence: number;         // 0-1, calculado como confirmations/(confirmations+corrections)
  first_seen: string;         // ISO timestamp
  last_validated: string;     // ISO timestamp
  user_id?: string;           // Para sincronizar entre dispositivos (futuro)
}

/**
 * Patrón de medicamento aprendido
 */
export interface LearnedMedicationPattern {
  id: string;
  
  // Frase original capturada
  raw_phrase: string;           // "ibuprofeno x 6 dias cada 8 horas"
  normalized_phrase: string;    // "ibuprofeno x 6 dias cada 8 horas" (sin acentos, lowercase)
  
  // Tokens clave identificados
  tokens: string[];             // ["ibuprofeno", "x", "6", "dias", "cada", "8", "horas"]
  
  // Valores extraídos y validados por el usuario
  extracted: ExtractedMedicationValues;
  
  // Metadata de aprendizaje
  learning: LearningMetadata;
  
  // Para matching de similitud
  pattern_signature: string;    // Hash de la estructura del patrón
  similarity_threshold: number; // 0.7-0.95, ajustable según confianza
}

/**
 * Resultado de matching de patrón
 */
export interface PatternMatch {
  pattern: LearnedMedicationPattern;
  similarity: number;           // 0-1
  isReliable: boolean;          // true si supera threshold
}

/**
 * Medicamento detectado en raw (antes de validar)
 */
export interface DetectedMedication {
  phrase: string;               // Frase completa detectada
  startIndex: number;           // Posición en texto original
  endIndex: number;
  extractedValues: ExtractedMedicationValues; // Valores iniciales del extractor
  confidence: number;           // Confianza inicial (dictionaries)
}

/**
 * Medicamento validado por usuario
 */
export interface ValidatedMedication {
  id: string;
  original_phrase: string;
  validated_values: ExtractedMedicationValues;
  was_changed: boolean;         // true si usuario corrigió algo
  validation_timestamp: string;
}

/**
 * Estadísticas del sistema de aprendizaje
 */
export interface LearningStats {
  total_patterns: number;
  total_validations: number;
  avg_confidence: number;
  most_reliable_patterns: LearnedMedicationPattern[];
  recent_validations: number;  // Últimos 7 días
}
