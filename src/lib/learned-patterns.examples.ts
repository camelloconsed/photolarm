/**
 * Testing Script - Learned Patterns System
 * 
 * Ejemplos de cómo usar el sistema de aprendizaje manualmente
 * para testing y debugging.
 */

import { useLearnedPatternsStore } from '../store/learned-patterns.store';
import type { ExtractedMedicationValues } from '../types/learned-patterns';

// ============================================================================
// EJEMPLO 1: Guardar primera validación
// ============================================================================

export function example1_firstValidation() {
  const store = useLearnedPatternsStore.getState();
  
  const phrase = "ibuprofeno x 6 dias cada 8 horas";
  const values: ExtractedMedicationValues = {
    medication_name: "Ibuprofeno",
    frequency_hours: 8,
    duration_days: 6,
    dosage: "500 mg",
    administration: "oral",
  };
  
  // Usuario confirmó sin cambios
  store.saveValidation(phrase, values, true);
  
  console.log('✅ Primera validación guardada');
  console.log('Patterns:', store.patterns.length);
  console.log('Confidence:', store.patterns[0]?.learning.confidence);
}

// ============================================================================
// EJEMPLO 2: Buscar match con frase similar
// ============================================================================

export function example2_findMatch() {
  const store = useLearnedPatternsStore.getState();
  
  // Frase similar pero con orden diferente
  const newPhrase = "ibuprofeno cada 8 horas x 6 dias";
  
  const match = store.findMatch(newPhrase);
  
  if (match) {
    console.log('🎯 Match encontrado!');
    console.log('Similarity:', match.similarity);
    console.log('Confidence:', match.pattern.learning.confidence);
    console.log('Valores sugeridos:', match.pattern.extracted);
  } else {
    console.log('❌ No se encontró match');
  }
}

// ============================================================================
// EJEMPLO 3: Corregir valores (usuario modificó algo)
// ============================================================================

export function example3_correction() {
  const store = useLearnedPatternsStore.getState();
  
  const phrase = "paracetamol cada 12 horas por 3 dias";
  const values: ExtractedMedicationValues = {
    medication_name: "Paracetamol",
    frequency_hours: 12,
    duration_days: 5, // Usuario corrigió: original decía 3, pero debería ser 5
    dosage: "1g",
  };
  
  // Usuario corrigió valores
  store.saveValidation(phrase, values, false);
  
  console.log('✏️ Corrección guardada');
}

// ============================================================================
// EJEMPLO 4: Ver estadísticas
// ============================================================================

export function example4_stats() {
  const store = useLearnedPatternsStore.getState();
  const stats = store.getStats();
  
  console.log('📊 Estadísticas del sistema:');
  console.log('Total patterns:', stats.total_patterns);
  console.log('Total validations:', stats.total_validations);
  console.log('Average confidence:', stats.avg_confidence.toFixed(2));
  console.log('Recent validations (7 days):', stats.recent_validations);
  
  console.log('\n🏆 Patrones más confiables:');
  stats.most_reliable_patterns.slice(0, 3).forEach((p, i) => {
    console.log(`${i + 1}. ${p.extracted.medication_name}`);
    console.log(`   Confidence: ${(p.learning.confidence * 100).toFixed(1)}%`);
    console.log(`   Validations: ${p.learning.confirmations + p.learning.corrections}`);
  });
}

// ============================================================================
// EJEMPLO 5: Exportar/Importar (backup)
// ============================================================================

export function example5_exportImport() {
  const store = useLearnedPatternsStore.getState();
  
  // Exportar
  const json = store.exportPatterns();
  console.log('📦 Patrones exportados:', json.length, 'characters');
  
  // Guardar en archivo (ejemplo)
  // await FileSystem.writeAsStringAsync('backup.json', json);
  
  // Importar
  // const importedJson = await FileSystem.readAsStringAsync('backup.json');
  // store.importPatterns(importedJson);
  
  console.log('✅ Export/Import completado');
}

// ============================================================================
// EJEMPLO 6: Simular flujo completo
// ============================================================================

export function example6_fullFlow() {
  const store = useLearnedPatternsStore.getState();
  
  console.log('🎬 Simulando flujo completo...\n');
  
  // 1. Primera vez - no hay match
  const phrase1 = "amoxicilina 500mg cada 8 horas por 7 dias";
  const match1 = store.findMatch(phrase1);
  console.log('Primera vez:', match1 ? '✅ Match' : '❌ No match');
  
  // Usuario confirma
  store.saveValidation(phrase1, {
    medication_name: "Amoxicilina",
    frequency_hours: 8,
    duration_days: 7,
    dosage: "500 mg",
  }, true);
  console.log('Patrón guardado\n');
  
  // 2. Segunda vez - frase similar
  const phrase2 = "amoxicilina cada 8h x 7 dias";
  const match2 = store.findMatch(phrase2);
  console.log('Segunda vez:', match2 ? '✅ Match encontrado!' : '❌ No match');
  if (match2) {
    console.log('Similarity:', (match2.similarity * 100).toFixed(1) + '%');
    console.log('Pre-llena:', match2.pattern.extracted);
  }
  
  // Usuario confirma sin cambios
  store.saveValidation(phrase2, match2!.pattern.extracted, true);
  console.log('Confirmado\n');
  
  // 3. Ver evolución
  const patterns = store.patterns;
  const amoxPattern = patterns.find(p => 
    p.extracted.medication_name === "Amoxicilina"
  );
  
  if (amoxPattern) {
    console.log('📈 Evolución del patrón:');
    console.log('Confirmations:', amoxPattern.learning.confirmations);
    console.log('Corrections:', amoxPattern.learning.corrections);
    console.log('Confidence:', (amoxPattern.learning.confidence * 100).toFixed(1) + '%');
    console.log('Threshold:', (amoxPattern.similarity_threshold * 100).toFixed(1) + '%');
  }
}

// ============================================================================
// EJEMPLO 7: Reset para testing
// ============================================================================

export function example7_reset() {
  const store = useLearnedPatternsStore.getState();
  
  console.log('⚠️ Eliminando todos los patrones...');
  store.clearAllPatterns();
  console.log('✅ Store reseteado');
  console.log('Patterns:', store.patterns.length);
}

// ============================================================================
// TESTS RÁPIDOS
// ============================================================================

export function runAllExamples() {
  console.log('🧪 Ejecutando todos los ejemplos...\n');
  
  example7_reset(); // Start fresh
  
  console.log('\n--- Ejemplo 1: Primera validación ---');
  example1_firstValidation();
  
  console.log('\n--- Ejemplo 2: Buscar match ---');
  example2_findMatch();
  
  console.log('\n--- Ejemplo 3: Corrección ---');
  example3_correction();
  
  console.log('\n--- Ejemplo 4: Estadísticas ---');
  example4_stats();
  
  console.log('\n--- Ejemplo 6: Flujo completo ---');
  example6_fullFlow();
  
  console.log('\n--- Ejemplo 4 (final): Estadísticas ---');
  example4_stats();
  
  console.log('\n✅ Todos los ejemplos ejecutados!');
}

// Para ejecutar en DevTools:
// import { runAllExamples } from './src/lib/learned-patterns.examples';
// runAllExamples();
