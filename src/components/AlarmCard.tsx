/**
 * AlarmCard Component - Tarjeta de alarma individual
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { SwipeableCard } from './SwipeableCard';
import type { Alarm } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface AlarmCardProps {
  alarm: Alarm;
  onComplete?: () => void;
  onSnooze?: () => void;
  onToggle?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  enableSwipeToDelete?: boolean;
}

export function AlarmCard({
  alarm,
  onComplete,
  onSnooze,
  onToggle,
  onDelete,
  showActions = true,
  enableSwipeToDelete = false,
}: AlarmCardProps) {
  const alarmDate = parseISO(alarm.datetime);
  const timeStr = format(alarmDate, 'HH:mm');
  const dateStr = format(alarmDate, "EEE d 'de' MMM", { locale: es });
  console.log('Alarm datetime:', alarm.datetime, 'Parsed date:', alarmDate);
  
  const isCompleted = alarm.completed;
  const isPending = alarm.triggered && !alarm.completed;
  const isDisabled = !alarm.enabled;

  const cardStyles = [
    styles.card,
    ...(isCompleted ? [styles.completedCard] : []),
    ...(isDisabled ? [styles.disabledCard] : []),
  ];

  const cardContent = (
    <Card style={cardStyles} padding={16}>
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Text style={[
            styles.time,
            isCompleted && styles.completedText,
            isDisabled && styles.disabledText,
          ]}>
            {timeStr}
          </Text>
          <Text style={[
            styles.date,
            isCompleted && styles.completedText,
            isDisabled && styles.disabledText,
          ]}>
            {dateStr}
          </Text>
        </View>

        {onToggle && (
          <TouchableOpacity onPress={onToggle} style={styles.toggleButton}>
            <View style={[
              styles.toggle,
              alarm.enabled && styles.toggleActive,
            ]} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[
        styles.title,
        isCompleted && styles.completedText,
        isDisabled && styles.disabledText,
      ]}>
        {alarm.title}
      </Text>
      
      {alarm.body && (
        <Text style={[
          styles.body,
          isCompleted && styles.completedText,
          isDisabled && styles.disabledText,
        ]}>
          {alarm.body}
        </Text>
      )}

      {/* Status badge */}
      {isCompleted && (
        <View style={[styles.badge, styles.completedBadge]}>
          <Text style={styles.badgeText}>✓ Completada</Text>
        </View>
      )}
      {isPending && (
        <View style={[styles.badge, styles.pendingBadge]}>
          <Text style={styles.badgeText}>⏰ Pendiente</Text>
        </View>
      )}

      {/* Actions */}
      {showActions && !isCompleted && alarm.enabled && (
        <View style={styles.actions}>
          {onSnooze && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.snoozeButton]}
              onPress={onSnooze}
            >
              <Text style={styles.snoozeText}>⏰ +10 min</Text>
            </TouchableOpacity>
          )}
          
          {onComplete && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.completeButton]}
              onPress={onComplete}
            >
              <Text style={styles.completeText}>✓ Completar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );

  // Si swipe-to-delete está habilitado y hay función onDelete, envolver en SwipeableCard
  if (enableSwipeToDelete && onDelete) {
    return (
      <SwipeableCard onDelete={onDelete} deleteText="Eliminar">
        {cardContent}
      </SwipeableCard>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  completedCard: {
    opacity: 0.6,
  },
  disabledCard: {
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timeContainer: {
    flex: 1,
  },
  time: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -1,
  },
  date: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  toggleButton: {
    padding: 4,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#34C759',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  disabledText: {
    color: '#C7C7CC',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  snoozeButton: {
    backgroundColor: '#F2F2F7',
  },
  completeButton: {
    backgroundColor: '#007AFF',
  },
  snoozeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  completeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
