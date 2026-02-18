/**
 * EditAlarmModal - Modal para editar título y hora de una alarma
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface EditAlarmModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updates: { title?: string; datetime?: string }) => void;
  currentTitle: string;
  currentDatetime: string;
  mode: 'title' | 'time';
}

export function EditAlarmModal({
  visible,
  onClose,
  onSave,
  currentTitle,
  currentDatetime,
  mode,
}: EditAlarmModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [date, setDate] = useState(new Date(currentDatetime));
  const [showPicker, setShowPicker] = useState(false);

  // Resetear estado cuando cambia la visibilidad
  useEffect(() => {
    if (visible) {
      setTitle(currentTitle);
      setDate(new Date(currentDatetime));
      setShowPicker(false);
    }
  }, [visible, currentTitle, currentDatetime]);

  const handleSave = () => {
    if (mode === 'title') {
      onSave({ title: title.trim() });
    } else {
      onSave({ datetime: date.toISOString() });
    }
    onClose();
  };

  const handleConfirm = (selectedDate: Date) => {
    setDate(selectedDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const handleShowPicker = () => {
    setShowPicker(true);
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
            <Text style={styles.title}>
              {mode === 'title' ? 'Editar Título' : 'Cambiar Hora'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {mode === 'title' ? (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nuevo título:</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ej: Tomar medicamento"
                  placeholderTextColor="#8E8E93"
                  autoFocus
                  multiline
                  numberOfLines={2}
                />
              </View>
            ) : (
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Selecciona la nueva hora:</Text>
                <TouchableOpacity
                  style={styles.androidDateButton}
                  onPress={handleShowPicker}
                >
                  <Text style={styles.androidDateButtonText}>
                    📅 {date.toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.androidDateButtonText}>
                    🕐 {date.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>
                
                <DateTimePickerModal
                  isVisible={showPicker}
                  mode="datetime"
                  date={date}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  locale="es_ES"
                  confirmTextIOS="Confirmar"
                  cancelTextIOS="Cancelar"
                />
              </View>
            )}
          </View>

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
    padding: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    gap: 12,
  },
  iosDatePicker: {
    width: '100%',
    height: 200,
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
