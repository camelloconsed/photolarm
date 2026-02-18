/**
 * ScheduleAccordion - Componente de acordeón para agrupar alarmas por schedule
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import type { Schedule, Alarm } from '@/types';
import { AlarmCard } from './AlarmCard';
import { EditAlarmModal } from './EditAlarmModal';
import { usePlansStore, useSchedulesStore } from '@/store';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ScheduleAccordionProps {
  schedule: Schedule;
  alarms: Alarm[];
  onComplete: (alarmId: string) => void;
  onSnooze: (alarmId: string) => void;
  onToggle: (alarmId: string) => void;
  onDeleteAlarm?: (alarmId: string) => void;
  onEditAlarm?: (alarmId: string) => void;
  onDeleteSchedule?: () => void;
  onEditSchedule?: () => void;
}

export function ScheduleAccordion({
  schedule,
  alarms,
  onComplete,
  onSnooze,
  onToggle,
  onDeleteAlarm,
  onEditAlarm,
  onDeleteSchedule,
  onEditSchedule,
}: ScheduleAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editModalMode, setEditModalMode] = useState<'title' | 'time'>('title');
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  
  // Obtener el plan real desde el store
  const getPlanById = usePlansStore((s) => s.getPlanById);
  const plan = getPlanById(schedule.plan_id);

  // Obtener métodos del store
  const updateAlarm = useSchedulesStore((s) => s.updateAlarm);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
    
    Animated.timing(animation, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const rotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Calcular stats del schedule
  const completedCount = alarms.filter(a => a.completed).length;
  const pendingCount = alarms.filter(a => !a.completed && !a.triggered).length;
  const nextAlarm = alarms
    .filter(a => !a.completed && a.enabled)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())[0];

  // Obtener categoría del plan
  const planCategory = plan?.category || 'health';
  
  // Generar nombre del plan basado en el evidence o domain
  const getPlanName = () => {
    if (plan?.evidence) {
      // Extraer el nombre del medicamento o actividad del evidence
      const evidenceLower = plan.evidence.toLowerCase();
      if (evidenceLower.includes('paracetamol')) return 'Paracetamol';
      if (evidenceLower.includes('ibuprofeno')) return 'Ibuprofeno';
      if (evidenceLower.includes('amoxicilina')) return 'Amoxicilina';
      // Usar las primeras 30 caracteres del evidence
      return plan.evidence.substring(0, 30) + (plan.evidence.length > 30 ? '...' : '');
    }
    if (alarms[0]?.title) {
      return alarms[0].title.split(' - ')[0];
    }
    return 'Mis Alarmas';
  };
  
  const planName = getPlanName();
  
  // Icon según categoría
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health':
        return '💊';
      case 'cooking':
        return '🍳';
      case 'fitness':
        return '💪';
      case 'habit':
        return '🌱';
      case 'appointment':
        return '🏥';
      case 'class':
        return '📚';
      case 'work':
        return '💼';
      case 'event':
        return '🎉';
      default:
        return '📋';
    }
  };

  // Color según categoría
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'health':
        return '#FF3B30';
      case 'cooking':
        return '#FF9500';
      case 'fitness':
        return '#34C759';
      case 'habit':
        return '#007AFF';
      case 'appointment':
        return '#FF2D55';
      case 'class':
        return '#5856D6';
      case 'work':
        return '#8E8E93';
      case 'event':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const categoryColor = getCategoryColor(planCategory);
  const categoryIcon = getCategoryIcon(planCategory);

  const handleDeleteSchedule = () => {
    Alert.alert(
      'Eliminar Set de Alarmas',
      `¿Estás seguro de eliminar "${planName}" y todas sus ${alarms.length} alarmas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDeleteSchedule && onDeleteSchedule(),
        },
      ]
    );
  };

  const handleDeleteAlarm = (alarmId: string, alarmTitle: string) => {
    Alert.alert(
      'Eliminar Alarma',
      `¿Estás seguro de eliminar esta alarma?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDeleteAlarm && onDeleteAlarm(alarmId),
        },
      ]
    );
  };

  const handleEditAlarm = (alarmId: string) => {
    const alarm = alarms.find(a => a.id === alarmId);
    if (!alarm) return;

    // Mostrar opciones de edición
    Alert.alert(
      'Editar Alarma',
      'Selecciona qué deseas editar:',
      [
        {
          text: 'Cambiar Título',
          onPress: () => {
            setEditingAlarmId(alarmId);
            setEditModalMode('title');
            setEditModalVisible(true);
          },
        },
        {
          text: 'Cambiar Hora',
          onPress: () => {
            setEditingAlarmId(alarmId);
            setEditModalMode('time');
            setEditModalVisible(true);
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSaveAlarmEdit = (updates: { title?: string; datetime?: string }) => {
    if (!editingAlarmId) return;
    
    updateAlarm(schedule.id, editingAlarmId, updates);
    setEditModalVisible(false);
    setEditingAlarmId(null);
    
    // Notificar al parent si existe callback
    if (onEditAlarm) {
      onEditAlarm(editingAlarmId);
    }
  };

  const editingAlarm = editingAlarmId ? alarms.find(a => a.id === editingAlarmId) : null;

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <TouchableOpacity
        style={[styles.header, isExpanded && styles.headerExpanded]}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
            <Text style={styles.icon}>{categoryIcon}</Text>
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {planName}
            </Text>
            <Text style={styles.subtitle}>
              {alarms.length} {alarms.length === 1 ? 'alarma' : 'alarmas'}
              {pendingCount > 0 && ` • ${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {nextAlarm && !isExpanded && (
            <View style={styles.nextAlarmBadge}>
              <Text style={styles.nextAlarmText}>
                {new Date(nextAlarm.datetime).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
          
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Text style={styles.chevron}>›</Text>
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Action Buttons (when expanded) */}
      {isExpanded && (onDeleteSchedule || onEditSchedule) && (
        <View style={styles.actionButtons}>
          {onEditSchedule && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={onEditSchedule}
            >
              <Text style={styles.actionButtonIcon}>✏️</Text>
              <Text style={styles.actionButtonText}>Editar</Text>
            </TouchableOpacity>
          )}
          {onDeleteSchedule && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteSchedule}
            >
              <Text style={styles.actionButtonIcon}>🗑️</Text>
              <Text style={styles.actionButtonText}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Progress Bar */}
      {alarms.length > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(completedCount / alarms.length) * 100}%`,
                  backgroundColor: categoryColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completedCount}/{alarms.length}
          </Text>
        </View>
      )}

      {/* Expanded Alarms */}
      {isExpanded && (
        <View style={styles.alarmsContainer}>
          {alarms.map((alarm) => (
            <View key={alarm.id} style={styles.alarmWrapper}>
              <AlarmCard
                alarm={alarm}
                onComplete={() => onComplete(alarm.id)}
                onSnooze={() => onSnooze(alarm.id)}
                onToggle={undefined}
                onDelete={onDeleteAlarm ? () => onDeleteAlarm(alarm.id) : undefined}
                enableSwipeToDelete={!!onDeleteAlarm}
              />
              {/* Alarm Actions */}
              <View style={styles.alarmActions}>
                {/* Toggle Switch */}
                <TouchableOpacity
                  style={[
                    styles.alarmActionButton,
                    styles.toggleButton,
                    alarm.enabled && styles.toggleButtonActive,
                  ]}
                  onPress={() => onToggle(alarm.id)}
                >
                  <View style={styles.iconWrapper}>
                    <Text style={styles.alarmActionIcon}>
                      {alarm.enabled ? '✓' : '○'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Edit Button */}
                {onEditAlarm && (
                  <TouchableOpacity
                    style={[styles.alarmActionButton, styles.editAlarmButton]}
                    onPress={() => handleEditAlarm(alarm.id)}
                  >
                    <View style={styles.iconWrapper}>
                      <Text style={styles.alarmActionIcon}>✏️</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Delete Button */}
                {onDeleteAlarm && (
                  <TouchableOpacity
                    style={[styles.alarmActionButton, styles.deleteAlarmButton]}
                    onPress={() => handleDeleteAlarm(alarm.id, alarm.title)}
                  >
                    <View style={styles.iconWrapper}>
                      <Text style={styles.alarmActionIcon}>🗑️</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Edit Alarm Modal */}
      {editingAlarm && (
        <EditAlarmModal
          visible={editModalVisible}
          onClose={() => {
            setEditModalVisible(false);
            setEditingAlarmId(null);
          }}
          onSave={handleSaveAlarmEdit}
          currentTitle={editingAlarm.title}
          currentDatetime={editingAlarm.datetime}
          mode={editModalMode}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextAlarmBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nextAlarmText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  chevron: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8E8E93',
    transform: [{ rotate: '90deg' }],
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#007AFF15',
  },
  deleteButton: {
    backgroundColor: '#FF3B3015',
  },
  actionButtonIcon: {
    fontSize: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    minWidth: 40,
    textAlign: 'right',
  },
  alarmsContainer: {
    padding: 12,
    gap: 12,
  },
  alarmWrapper: {
    position: 'relative',
  },
  alarmActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  alarmActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 0,
        borderWidth: 1,
        borderColor: '#E5E5EA',
      },
    }),
  },
  toggleButton: {
    borderWidth: 2,
    borderColor: '#8E8E93',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  editAlarmButton: {
    backgroundColor: '#007AFF15',
  },
  deleteAlarmButton: {
    backgroundColor: '#FF3B3015',
  },
  iconWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmActionIcon: {
    fontSize: 18,
    lineHeight: 18,
    textAlign: 'center',
  },
});
