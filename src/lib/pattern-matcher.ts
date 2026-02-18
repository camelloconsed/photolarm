/**
 * Pattern Matcher
 * 
 * Utilidades para matching y similitud de patrones de medicamentos.
 * Permite encontrar patrones aprendidos que coincidan con frases nuevas.
 */

import type { LearnedMedicationPattern, PatternMatch } from '@/types/learned-patterns';

/**
 * Normaliza texto removiendo acentos y convirtiendo a lowercase
 */
export function normalizePhrase(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .trim();
}

/**
 * Tokeniza texto en palabras
 */
export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/**
 * Calcula la distancia de Levenshtein entre dos strings
 * Retorna el número de ediciones necesarias para transformar s1 en s2
 */
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  
  // Crear matriz de distancias
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));
  
  // Inicializar primera fila y columna
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  // Llenar matriz
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Eliminación
        matrix[i][j - 1] + 1,      // Inserción
        matrix[i - 1][j - 1] + cost // Sustitución
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calcula similitud entre dos frases (0-1)
 * 1 = idénticas, 0 = completamente diferentes
 */
export function calculateSimilarity(phrase1: string, phrase2: string): number {
  const normalized1 = normalizePhrase(phrase1);
  const normalized2 = normalizePhrase(phrase2);
  
  if (normalized1 === normalized2) return 1.0;
  if (!normalized1 || !normalized2) return 0.0;
  
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  // Convertir distancia a similitud
  return 1 - (distance / maxLength);
}

/**
 * Genera una "signature" del patrón basada en su estructura
 * Ejemplo: "ibuprofeno x 6 dias cada 8 horas" → "MED_X_NUM_TIME_FREQ_NUM_TIME"
 * 
 * Esto permite matchear frases con la misma estructura pero diferentes valores
 */
export function generatePatternSignature(tokens: string[]): string {
  return tokens
    .map(token => {
      // Números
      if (/^\d+$/.test(token)) return 'NUM';
      
      // Unidades de tiempo
      if (/^(hora|horas|dia|dias|semana|semanas|mes|meses)$/i.test(token)) return 'TIME';
      
      // Frecuencia
      if (/^(cada|por|durante|vez|veces|al)$/i.test(token)) return 'FREQ';
      
      // Conectores
      if (/^(x|de|en|con|sin|y|o)$/i.test(token)) return 'CONN';
      
      // Unidades de dosis
      if (/^(mg|ml|g|gramo|tableta|capsula|comprimido|gota)$/i.test(token)) return 'DOSE';
      
      // Posiblemente un medicamento (palabra larga no clasificada)
      if (token.length > 4) return 'MED';
      
      // Otros
      return 'WORD';
    })
    .join('_');
}

/**
 * Calcula confidence score basado en confirmaciones y correcciones
 */
export function calculateConfidence(confirmations: number, corrections: number): number {
  const total = confirmations + corrections;
  
  // Sin datos, confianza media
  if (total === 0) return 0.5;
  
  const ratio = confirmations / total;
  
  // Bonus por volumen (más validaciones = más confiable)
  // Máximo 20% bonus alcanzado con 20 validaciones
  const volumeBonus = Math.min(total / 100, 0.2);
  
  return Math.min(ratio + volumeBonus, 1.0);
}

/**
 * Calcula threshold de similitud adaptativo basado en confianza
 * Mayor confianza = matching más estricto
 */
export function calculateThreshold(confidence: number): number {
  // Confianza baja (0.5): threshold 0.70 (acepta más variaciones)
  // Confianza alta (0.95): threshold 0.90 (muy estricto)
  return 0.70 + (confidence * 0.20);
}

/**
 * Encuentra el mejor patrón aprendido que coincida con una frase
 */
export function findBestMatch(
  phrase: string,
  learnedPatterns: LearnedMedicationPattern[]
): PatternMatch | null {
  if (!phrase || learnedPatterns.length === 0) return null;
  
  const normalized = normalizePhrase(phrase);
  const tokens = tokenize(normalized);
  const signature = generatePatternSignature(tokens);
  
  let bestMatch: PatternMatch | null = null;
  let bestSimilarity = 0;
  
  for (const pattern of learnedPatterns) {
    // Primero verificar si las signatures coinciden (estructura similar)
    const signatureMatch = pattern.pattern_signature === signature;
    
    // Calcular similitud de la frase completa
    const similarity = calculateSimilarity(normalized, pattern.normalized_phrase);
    
    // Bonus si la estructura coincide
    const finalSimilarity = signatureMatch ? similarity * 1.1 : similarity;
    
    // Verificar si supera el threshold del patrón
    const isReliable = finalSimilarity >= pattern.similarity_threshold;
    
    if (isReliable && finalSimilarity > bestSimilarity) {
      bestMatch = {
        pattern,
        similarity: Math.min(finalSimilarity, 1.0),
        isReliable: true,
      };
      bestSimilarity = finalSimilarity;
    }
  }
  
  return bestMatch;
}

/**
 * Genera un ID único para un patrón
 */
export function generatePatternId(): string {
  return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Compara dos valores extraídos para detectar cambios
 */
export function hasChanges(
  original: {
    medication_name: string;
    frequency_hours: number;
    duration_days: number;
    dosage?: string;
  },
  validated: {
    medication_name: string;
    frequency_hours: number;
    duration_days: number;
    dosage?: string;
  }
): boolean {
  return (
    original.medication_name !== validated.medication_name ||
    original.frequency_hours !== validated.frequency_hours ||
    original.duration_days !== validated.duration_days ||
    original.dosage !== validated.dosage
  );
}
