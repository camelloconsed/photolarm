/**
 * MedicationConfirmCard Component
 * 
 * Tarjeta interactiva para validar y corregir datos de medicamentos extraídos.
 * Permite al usuario confirmar o modificar: nombre, frecuencia, duración y dosis.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Card } from './Card';
import type { ExtractedMedicationValues } from '@/types/learned-patterns';

interface MedicationConfirmCardProps {
  rawPhrase: string;
  suggestedValues: ExtractedMedicationValues;
  confidence: number; // 0-1
  onConfirm: (values: ExtractedMedicationValues) => void;
  onReject: () => void;
}

export function MedicationConfirmCard({
  rawPhrase,
  suggestedValues,
  confidence,
  onConfirm,
  onReject,
}: MedicationConfirmCardProps) {
  const [medication, setMedication] = useState(suggestedValues.medication_name);
  const [frequencyHours, setFrequencyHours] = useState(suggestedValues.frequency_hours.toString());
  const [durationDays, setDurationDays] = useState(suggestedValues.duration_days.toString());
  const [dosage, setDosage] = useState(suggestedValues.dosage || '');

  const handleConfirm = () => {
    onConfirm({
      medication_name: medication,
      frequency_hours: parseInt(frequencyHours) || 24,
      duration_days: parseInt(durationDays) || 7,
      dosage: dosage || undefined,
      administration: suggestedValues.administration,
    });
  };

  // Determinar color de confianza
  const getConfidenceColor = () => {
    if (confidence >= 0.8) return '#34C759'; // Verde
    if (confidence >= 0.6) return '#FF9500'; // Naranja
    return '#FF3B30'; // Rojo
  };

  // Determinar texto de confianza
  const getConfidenceText = () => {
    if (confidence >= 0.8) return 'Alta confianza';
    if (confidence >= 0.6) return 'Confianza media';
    return 'Baja confianza';
  };

  return (
    <Card style={styles.card} padding={0}>
      {/* Header con frase original */}
      <View style={styles.header}>
        <Text style={styles.phraseLabel}>📝 Texto detectado:</Text>
        <Text style={styles.phraseText}>{rawPhrase}</Text>
      </View>

      {/* Confidence bar */}
      <View style={styles.confidenceContainer}>
        <View style={styles.confidenceBar}>
          <View 
            style={[
              styles.confidenceFill, 
              { 
                width: `${confidence * 100}%`,
                backgroundColor: getConfidenceColor(),
              }
            ]} 
          />
        </View>
        <Text style={[styles.confidenceText, { color: getConfidenceColor() }]}>
          {getConfidenceText()} ({Math.round(confidence * 100)}%)
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        {/* Medicamento */}
        <View style={styles.field}>
          <Text style={styles.label}>💊 Medicamento</Text>
          <TextInput
            style={styles.input}
            value={medication}
            onChangeText={setMedication}
            placeholder="Nombre del medicamento"
            autoCapitalize="words"
          />
        </View>

        {/* Dosis */}
        <View style={styles.field}>
          <Text style={styles.label}>💉 Dosis</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder="Ej: 500 mg"
          />
        </View>

        {/* Frecuencia */}
        <View style={styles.field}>
          <Text style={styles.label}>⏰ Frecuencia (horas)</Text>
          <View style={styles.numberInputContainer}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => {
                const current = parseInt(frequencyHours) || 0;
                if (current > 1) setFrequencyHours((current - 1).toString());
              }}
            >
              <Text style={styles.numberButtonText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.numberInput}
              value={frequencyHours}
              onChangeText={setFrequencyHours}
              keyboardType="number-pad"
              placeholder="8"
            />
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => {
                const current = parseInt(frequencyHours) || 0;
                setFrequencyHours((current + 1).toString());
              }}
            >
              <Text style={styles.numberButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Cada cuántas horas tomar</Text>
        </View>

        {/* Duración */}
        <View style={styles.field}>
          <Text style={styles.label}>📅 Duración (días)</Text>
          <View style={styles.numberInputContainer}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => {
                const current = parseInt(durationDays) || 0;
                if (current > 1) setDurationDays((current - 1).toString());
              }}
            >
              <Text style={styles.numberButtonText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.numberInput}
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="number-pad"
              placeholder="7"
            />
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => {
                const current = parseInt(durationDays) || 0;
                setDurationDays((current + 1).toString());
              }}
            >
              <Text style={styles.numberButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Por cuántos días</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.rejectButton]}
          onPress={onReject}
        >
          <Text style={styles.rejectButtonText}>❌ Rechazar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.confirmButton]}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>✅ Confirmar</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  phraseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  phraseText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  confidenceContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    padding: 16,
    paddingTop: 8,
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numberButton: {
    width: 44,
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  numberInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#F2F2F7',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
