/**
 * PlanCard Component - Tarjeta de plan médico
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { SwipeableCard } from './SwipeableCard';
import { PlanCategoryBadge } from './PlanCategoryBadge';
import type { Plan } from '@/types';

interface PlanCardProps {
  plan: Plan;
  onPress?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  enableSwipeToDelete?: boolean;
}

const DOMAIN_LABELS: Record<string, string> = {
  medication: '💊 Medicación',
  appointment: '📅 Cita',
  treatment: '🏥 Tratamiento',
  measurement: '📊 Medición',
  lifestyle: '🏃 Actividad',
  other: '📝 Otro',
};

const DOMAIN_COLORS: Record<string, string> = {
  medication: '#007AFF',
  appointment: '#5856D6',
  treatment: '#FF9500',
  measurement: '#34C759',
  lifestyle: '#FF2D55',
  other: '#8E8E93',
};

export function PlanCard({
  plan,
  onPress,
  onDelete,
  showActions = true,
  enableSwipeToDelete = false,
}: PlanCardProps) {
  const domainLabel = DOMAIN_LABELS[plan.domain] || DOMAIN_LABELS.other;
  const domainColor = DOMAIN_COLORS[plan.domain] || DOMAIN_COLORS.other;
  
  const isFixed = plan.mode === 'fixed';
  const itemCount = isFixed 
    ? plan.fixed_events?.length || 0
    : plan.flexible_pattern?.items.length || 0;

  const getMainTitle = () => {
    if (isFixed && plan.fixed_events && plan.fixed_events.length > 0) {
      return plan.fixed_events[0].title;
    }
    if (!isFixed && plan.flexible_pattern?.items && plan.flexible_pattern.items.length > 0) {
      return plan.flexible_pattern.items[0].title;
    }
    return 'Plan sin título';
  };

  const getDescription = () => {
    if (isFixed) {
      return `${itemCount} ${itemCount === 1 ? 'evento' : 'eventos'} programados`;
    }
    
    const item = plan.flexible_pattern?.items[0];
    if (!item) return 'Sin detalles';
    
    if (item.interval_hours) {
      return `Cada ${item.interval_hours}h por ${item.duration_days || 1} días`;
    }
    if (item.times_per_day) {
      return `${item.times_per_day}x al día por ${item.duration_days || 1} días`;
    }
    if (item.times_of_day) {
      return `${item.times_of_day.length} horarios por ${item.duration_days || 1} días`;
    }
    
    return 'Patrón flexible';
  };

  const cardContent = (
    <TouchableOpacity 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Card style={styles.card} padding={16}>
        {/* Category Badge */}
        <PlanCategoryBadge category={plan.category} mode={plan.mode} />

        {/* Content */}
        <Text style={styles.title} numberOfLines={2}>
          {getMainTitle()}
        </Text>
        
        <Text style={styles.description}>
          {getDescription()}
        </Text>

        {/* Confidence indicator */}
        {plan.confidence < 0.8 && (
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>
              ⚠️ Confianza: {Math.round(plan.confidence * 100)}%
            </Text>
          </View>
        )}

        {/* Evidence */}
        {plan.evidence && (
          <View style={styles.evidence}>
            <Text style={styles.evidenceLabel}>Fuente:</Text>
            <Text style={styles.evidenceText} numberOfLines={2}>
              "{plan.evidence}"
            </Text>
          </View>
        )}

        {/* Actions */}
        {showActions && (
          <View style={styles.actions}>
            {onPress && (
              <TouchableOpacity style={styles.actionButton} onPress={onPress}>
                <Text style={styles.actionText}>Ver detalles</Text>
              </TouchableOpacity>
            )}
            
            {onDelete && !enableSwipeToDelete && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]} 
                onPress={onDelete}
              >
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  domainBadge: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  domainText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  warningBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
  evidence: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  evidenceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  evidenceText: {
    fontSize: 13,
    color: '#1C1C1E',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteButton: {
    flex: 0,
    paddingHorizontal: 16,
    backgroundColor: '#FFE5E5',
  },
  deleteText: {
    fontSize: 18,
  },
});
