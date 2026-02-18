/**
 * EditScheduleModal - Modal para editar configuración de un schedule completo
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface EditScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updates: {
    startTime?: string;
    duration?: number;
    frequency?: number;
  }) => void;
  mode: 'times' | 'duration' | 'advanced';
  currentStartTime: string;
  currentDuration?: number;
  currentFrequency?: number;
}

export function EditScheduleModal({
  visible,
  onClose,
  onSave,
  mode,
  currentStartTime,
  currentDuration,
  currentFrequency,
}: EditScheduleModalProps) {
  const [startDate, setStartDate] = useState(new Date(currentStartTime));
  const [duration, setDuration] = useState(currentDuration?.toString() || '7');
  const [frequency, setFrequency] = useState(currentFrequency?.toString() || '8');
  const [showPicker, setShowPicker] = useState(false);

  // Resetear estado cuando cambia la visibilidad
  useEffect(() => {
    if (visible) {
      setStartDate(new Date(currentStartTime));
      setDuration(currentDuration?.toString() || '7');
      setFrequency(currentFrequency?.toString() || '8');
      setShowPicker(false);
    }
  }, [visible, currentStartTime, currentDuration, currentFrequency]);

  const handleSave = () => {
    if (mode === 'times') {
      onSave({ startTime: startDate.toISOString() });
    } else if (mode === 'duration') {
      onSave({ duration: parseInt(duration, 10) });
    } else if (mode === 'advanced') {
      onSave({
        startTime: startDate.toISOString(),
        duration: parseInt(duration, 10),
        frequency: parseInt(frequency, 10),
      });
    }
    onClose();
  };

  const handleConfirm = (selectedDate: Date) => {
    setStartDate(selectedDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const handleShowPicker = () => {
    setShowPicker(true);
  };

  const renderContent = () => {
    switch (mode) {
      case 'times':
        return (
          <View style={styles.section}>
            <Text style={styles.label}>Nueva hora de inicio:</Text>
            <Text style={styles.description}>
              Todas las alarmas se ajustarán proporcionalmente
            </Text>
            <TouchableOpacity
              style={styles.androidDateButton}
              onPress={handleShowPicker}
            >
              <Text style={styles.androidDateButtonText}>
                📅 {startDate.toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
              <Text style={styles.androidDateButtonText}>
                🕐 {startDate.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
            
            <DateTimePickerModal
              isVisible={showPicker}
              mode="datetime"
              date={startDate}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              locale="es_ES"
              confirmTextIOS="Confirmar"
              cancelTextIOS="Cancelar"
            />
          </View>
        );

      case 'duration':
        return (
          <View style={styles.section}>
            <Text style={styles.label}>Nueva duración (días):</Text>
            <Text style={styles.description}>
              El schedule se extenderá o acortará según los días indicados
            </Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="Ej: 7"
              placeholderTextColor="#8E8E93"
            />
            <Text style={styles.hint}>
              Duración actual: {currentDuration} días
            </Text>
          </View>
        );

      case 'advanced':
        return (
          <ScrollView style={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={styles.label}>Hora de inicio:</Text>
              <TouchableOpacity
                style={styles.androidDateButton}
                onPress={handleShowPicker}
              >
                <Text style={styles.androidDateButtonText}>
                  {startDate.toLocaleString('es-ES', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </Text>
              </TouchableOpacity>
              
              <DateTimePickerModal
                isVisible={showPicker}
                mode="datetime"
                date={startDate}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                locale="es_ES"
                confirmTextIOS="Confirmar"
                cancelTextIOS="Cancelar"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Duración (días):</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                placeholder="Ej: 7"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Frecuencia (horas):</Text>
              <TextInput
                style={styles.input}
                value={frequency}
                onChangeText={setFrequency}
                keyboardType="number-pad"
                placeholder="Ej: 8"
                placeholderTextColor="#8E8E93"
              />
              <Text style={styles.hint}>
                Cada cuántas horas se repite la alarma
              </Text>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'times':
        return 'Cambiar Horarios';
      case 'duration':
        return 'Modificar Duración';
      case 'advanced':
        return 'Configuración Avanzada';
      default:
        return 'Editar Schedule';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{getTitle()}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>{renderContent()}</View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '600',
  },
  content: {
    maxHeight: 400,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    padding: 20,
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  description: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
  },
  iosDatePicker: {
    width: '100%',
    height: 200,
  },
  iosDatePickerCompact: {
    width: '100%',
    height: 120,
  },
  androidDateButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  androidDateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
