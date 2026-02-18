/**
 * SwipeableCard - Componente que permite deslizar hacia la izquierda para eliminar
 * Implementación con PanResponder (solo JavaScript, no requiere librerías nativas)
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteText?: string;
}

export function SwipeableCard({ 
  children, 
  onDelete,
  deleteText = 'Eliminar'
}: SwipeableCardProps) {
  const pan = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Solo activar si desliza horizontalmente (más de 10px)
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Solo permitir deslizar hacia la izquierda (valores negativos)
        if (gestureState.dx < 0) {
          pan.setValue(gestureState.dx);
          // Mostrar botón de eliminar gradualmente
          const opacity = Math.min(Math.abs(gestureState.dx) / 100, 1);
          deleteOpacity.setValue(opacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -100) {
          // Si deslizó más de 100px, eliminar
          Animated.timing(pan, {
            toValue: -300,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete();
          });
        } else {
          // Regresar a posición original
          Animated.parallel([
            Animated.spring(pan, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
            }),
            Animated.timing(deleteOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* Delete button (behind) */}
      <Animated.View style={[styles.deleteAction, { opacity: deleteOpacity }]}>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Text style={styles.deleteIcon}>🗑️</Text>
          <Text style={styles.deleteText}>{deleteText}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Swipeable card (front) */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ translateX: pan }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 12,
  },
  cardContainer: {
    backgroundColor: 'transparent',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 12,
    width: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
