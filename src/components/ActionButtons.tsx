/**
 * ActionButtons Component - Botones de acción (Cancelar/Confirmar)
 * Maneja el layout correcto para evitar que se salgan de los márgenes
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from './Button';

interface ActionButtonsProps {
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
}

export function ActionButtons({
  onCancel,
  onConfirm,
  cancelText = 'Cancelar',
  confirmText = 'Continuar',
  confirmDisabled = false,
  confirmLoading = false,
}: ActionButtonsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.buttonWrapper}>
        <Button
          title={cancelText}
          onPress={onCancel}
          variant="outline"
          size="large"
          fullWidth
        />
      </View>
      <View style={styles.buttonWrapper}>
        <Button
          title={confirmLoading ? 'Procesando...' : confirmText}
          onPress={onConfirm}
          variant="primary"
          size="large"
          disabled={confirmDisabled}
          loading={confirmLoading}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
    minHeight: 56,
  },
});
