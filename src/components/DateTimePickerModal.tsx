import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Button } from './Button';

interface DateTimePickerModalProps {
  visible: boolean;
  mode: 'date' | 'time' | 'datetime';
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  minimumDate?: Date;
  title?: string;
}

export function DateTimePickerModal({
  visible,
  mode,
  value,
  onConfirm,
  onCancel,
  minimumDate,
  title = 'Seleccionar fecha y hora',
}: DateTimePickerModalProps) {
  const [tempDate, setTempDate] = useState(value);
  const [currentStep, setCurrentStep] = useState<'date' | 'time'>('date');

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      // Android: usuario canceló el picker nativo
      if (Platform.OS === 'android') {
        onCancel();
      }
      return;
    }

    if (selectedDate) {
      if (Platform.OS === 'android') {
        // Android: confirmar automáticamente cuando selecciona
        if (mode === 'datetime') {
          // En modo datetime, primero fecha, luego hora
          if (currentStep === 'date') {
            setTempDate(selectedDate);
            setCurrentStep('time');
          } else {
            // Ya seleccionó la hora, confirmar
            onConfirm(selectedDate);
            setCurrentStep('date'); // Reset para próxima vez
          }
        } else {
          // Modo simple (solo date o solo time)
          onConfirm(selectedDate);
        }
      } else {
        // iOS: actualizar valor temporal (confirmar con botón)
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onConfirm(tempDate);
    setCurrentStep('date'); // Reset para próxima vez
  };

  const handleCancel = () => {
    setTempDate(value); // Restaurar valor original
    setCurrentStep('date'); // Reset para próxima vez
    onCancel();
  };

  // Android: renderizar picker nativo directamente
  if (Platform.OS === 'android' && visible) {
    const pickerMode = mode === 'datetime' ? currentStep : mode;
    
    return (
      <DateTimePicker
        value={tempDate}
        mode={pickerMode}
        is24Hour={true}
        display="default"
        onChange={handleChange}
        minimumDate={minimumDate}
      />
    );
  }

  // iOS: renderizar modal con picker
  if (Platform.OS === 'ios') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
            </View>

            <View style={styles.pickerContainer}>
              {(mode === 'date' || mode === 'datetime') && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleChange}
                  minimumDate={minimumDate}
                  textColor="#000"
                  style={styles.picker}
                />
              )}

              {(mode === 'time' || mode === 'datetime') && (
                <DateTimePicker
                  value={tempDate}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onChange={handleChange}
                  textColor="#000"
                  style={styles.picker}
                />
              )}
            </View>

            <View style={styles.actions}>
              <View style={styles.button}>
                <Button
                  title="Cancelar"
                  onPress={handleCancel}
                  variant="secondary"
                  fullWidth
                />
              </View>
              <View style={styles.button}>
                <Button
                  title="Confirmar"
                  onPress={handleConfirm}
                  variant="primary"
                  fullWidth
                />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // Android no usa estos estilos (picker nativo)
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  pickerContainer: {
    paddingVertical: 20,
  },
  picker: {
    height: 120,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
