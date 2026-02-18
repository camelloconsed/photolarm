/**
 * ConfirmMedicationsScreen
 * 
 * Pantalla de validación de medicamentos extraídos.
 * Permite al usuario revisar y corregir los datos antes de generar alarmas.
 * Implementa el sistema de aprendizaje incremental.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { 
  MedicationConfirmCard,
  ActionButtons,
  EmptyState,
  LoadingSpinner,
} from '@/components';
import { useLearnedPatternsStore } from '@/store/learned-patterns.store';
import { usePlansStore } from '@/store';
import { PatternBasedExtractorService } from '@/services/extractor.service.patterns';
import { getMedicationVocabularyService } from '@/services/medication-vocabulary.service';
import { hasChanges } from '@/lib/pattern-matcher';
import type { 
  DetectedMedication,
  ValidatedMedication,
  ExtractedMedicationValues,
} from '@/types/learned-patterns';

type RootStackParamList = {
  Home: undefined;
  ConfirmMedications: { ocrText: string };
  Results: { planIds: string[] };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmMedications'>;

export function ConfirmMedicationsScreen({ navigation, route }: Props) {
  const { ocrText } = route.params;
  const [detectedMedications, setDetectedMedications] = useState<DetectedMedication[]>([]);
  const [validatedMedications, setValidatedMedications] = useState<ValidatedMedication[]>([]);
  const [rejectedIndices, setRejectedIndices] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  
  // Mantener la misma instancia del extractor durante toda la sesión
  const [extractor] = useState(() => new PatternBasedExtractorService({ useSymSpell: false }));

  const { findMatch, saveValidation } = useLearnedPatternsStore();
  const { addPlans } = usePlansStore();

  // Extraer medicamentos al montar
  useEffect(() => {
    extractMedications();
  }, [ocrText]);

  const extractMedications = async () => {
    try {
      setIsLoading(true);
      
      // Usar el servicio de patrones para extraer
      const result = await extractor.extractPlans(ocrText);

      if (!result.success || !result.plans || result.plans.length === 0) {
        Alert.alert(
          'No se encontraron medicamentos',
          'No se detectaron medicamentos en el texto. ¿Deseas volver a intentar?',
          [
            { text: 'Volver', onPress: () => navigation.goBack() },
            { text: 'Continuar', style: 'cancel' },
          ]
        );
        setIsLoading(false);
        return;
      }

      // Convertir planes a DetectedMedication
      const detected: DetectedMedication[] = result.plans
        .filter(plan => plan.domain === 'medication')
        .map((plan, index) => {
          const item = plan.flexible_pattern?.items[0];
          if (!item) return null;

          // Extraer valores del plan
          const extractedValues: ExtractedMedicationValues = {
            medication_name: item.title.split(' ')[0], // Primera palabra es el medicamento
            frequency_hours: item.interval_hours || 24,
            duration_days: item.duration_days || 7,
            dosage: item.title.includes(' ') ? item.title.split(' ').slice(1).join(' ') : undefined,
            administration: 'oral',
          };

          // Buscar match con patrones aprendidos
          const match = findMatch(plan.evidence || '');
          
          return {
            phrase: plan.evidence || '',
            startIndex: index,
            endIndex: index,
            extractedValues: match ? match.pattern.extracted : extractedValues,
            confidence: match ? match.pattern.learning.confidence : plan.confidence,
          };
        })
        .filter(Boolean) as DetectedMedication[];

      setDetectedMedications(detected);
      console.log('📋 Detected medications:', detected.length);
    } catch (error) {
      console.error('Error extracting medications:', error);
      Alert.alert('Error', 'Hubo un error al procesar el texto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (index: number, values: ExtractedMedicationValues) => {
    const detected = detectedMedications[index];
    const wasChanged = hasChanges(detected.extractedValues, values);

    const validated: ValidatedMedication = {
      id: `validated_${Date.now()}_${index}`,
      original_phrase: detected.phrase,
      validated_values: values,
      was_changed: wasChanged,
      validation_timestamp: new Date().toISOString(),
    };

    setValidatedMedications(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      const updated = [...filtered];
      updated.splice(index, 0, validated);
      return updated;
    });

    // Guardar medicamento en vocabulario si fue confirmado o corregido
    try {
      const vocabService = getMedicationVocabularyService();
      const originalName = detected.extractedValues.medication_name;
      const validatedName = values.medication_name;
      
      // Si el nombre cambió, guardar el corregido
      if (wasChanged && originalName !== validatedName) {
        await vocabService.saveMedication(validatedName, originalName);
        console.log(`📚 Saved corrected medication: ${validatedName} (was: ${originalName})`);
      } 
      // Si fue sugerido (baja confianza) y el usuario lo confirmó sin cambios
      else if (!wasChanged && detected.confidence < 0.7) {
        await vocabService.saveMedication(validatedName);
        console.log(`📚 Confirmed suggested medication: ${validatedName}`);
      }
      // Si el usuario editó algo (aunque no sea el nombre)
      else if (wasChanged) {
        await vocabService.saveMedication(validatedName);
        console.log(`📚 Saved validated medication: ${validatedName}`);
      }      
      // IMPORTANTE: Refrescar vocabulario en el extractor para la próxima extracción
      await extractor.refreshVocabulary();    } catch (error) {
      console.error('Error saving medication to vocabulary:', error);
      // No bloqueamos el flujo si falla el guardado
    }

    console.log('✅ Medication confirmed:', {
      medication: values.medication_name,
      was_changed: wasChanged,
      index,
    });
  };

  const handleReject = (index: number) => {
    setRejectedIndices(prev => new Set([...prev, index]));
    console.log('❌ Medication rejected:', index);
  };

  const handleContinue = () => {
    // Validar que al menos uno no fue rechazado
    const validCount = detectedMedications.length - rejectedIndices.size;
    if (validCount === 0) {
      Alert.alert(
        'Sin medicamentos',
        'No hay medicamentos confirmados. ¿Deseas volver a escanear?',
        [
          { text: 'Volver a escanear', onPress: () => navigation.goBack() },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return;
    }

    // Validar que todos los no-rechazados han sido validados
    const unvalidatedCount = detectedMedications.filter(
      (_, i) => !rejectedIndices.has(i) && !validatedMedications[i]
    ).length;

    if (unvalidatedCount > 0) {
      Alert.alert(
        'Validación pendiente',
        `Tienes ${unvalidatedCount} ${unvalidatedCount === 1 ? 'medicamento' : 'medicamentos'} sin confirmar`
      );
      return;
    }

    // Guardar validaciones en el sistema de aprendizaje
    detectedMedications.forEach((detected, index) => {
      if (rejectedIndices.has(index)) return;

      const validated = validatedMedications[index];
      if (validated) {
        saveValidation(
          detected.phrase,
          validated.validated_values,
          !validated.was_changed
        );
      }
    });

    // Generar planes desde medicamentos validados
    const planIds = validatedMedications
      .filter((_, i) => !rejectedIndices.has(i))
      .map(validated => {
        const plan = {
          id: validated.id,
          mode: 'flexible' as const,
          domain: 'medication' as const,
          category: 'health' as const,
          confidence: 0.95, // Alta confianza después de validación manual
          evidence: validated.original_phrase,
          flexible_pattern: {
            items: [{
              interval_hours: validated.validated_values.frequency_hours,
              duration_days: validated.validated_values.duration_days,
              title: `${validated.validated_values.medication_name} ${validated.validated_values.dosage || ''}`.trim(),
              description: `Tomar ${validated.validated_values.dosage || 'medicamento'} cada ${validated.validated_values.frequency_hours} horas durante ${validated.validated_values.duration_days} días`,
            }],
          },
        };

        addPlans([plan]);
        return plan.id;
      });

    // Navegar a Results
    navigation.navigate('Results', { planIds });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner message="Analizando medicamentos..." />
      </View>
    );
  }

  if (detectedMedications.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="💊"
          title="No se encontraron medicamentos"
          description="No se detectaron medicamentos en el texto escaneado"
          actionLabel="Volver"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const validatedCount = validatedMedications.filter((_, i) => !rejectedIndices.has(i)).length;
  const totalCount = detectedMedications.length - rejectedIndices.size;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Confirma los medicamentos
          </Text>
          <Text style={styles.subtitle}>
            Revisa y corrige la información extraída. Esto ayudará a mejorar la precisión.
          </Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>
              {validatedCount} de {totalCount} confirmados
            </Text>
          </View>
        </View>

        <View style={styles.medicationsList}>
          {detectedMedications.map((med, index) => {
            if (rejectedIndices.has(index)) return null;

            return (
              <MedicationConfirmCard
                key={index}
                rawPhrase={med.phrase}
                suggestedValues={med.extractedValues}
                confidence={med.confidence}
                onConfirm={(values) => handleConfirm(index, values)}
                onReject={() => handleReject(index)}
              />
            );
          })}
        </View>
      </ScrollView>

      <ActionButtons
        confirmText="Continuar"
        cancelText="Cancelar"
        onConfirm={handleContinue}
        onCancel={() => navigation.goBack()}
        confirmDisabled={validatedCount === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
    marginBottom: 12,
  },
  progressBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  medicationsList: {
    gap: 16,
  },
});
