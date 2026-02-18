/**
 * AnchorSelectionCard Component
 * 
 * Large, tappable card for selecting anchor type (Now/Custom/Recommended)
 * Used in flexible plans to determine when to start the schedule
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

interface AnchorSelectionCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  selected?: boolean;
  recommended?: boolean;
  disabled?: boolean;
}

export function AnchorSelectionCard({
  icon,
  title,
  description,
  onPress,
  selected = false,
  recommended = false,
  disabled = false,
}: AnchorSelectionCardProps) {
  const containerStyle = [
    styles.container,
    selected && styles.selected,
    recommended && styles.recommended,
    disabled && styles.disabled,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Recomendado</Text>
              </View>
            )}
          </View>
          <Text style={styles.description}>{description}</Text>
        </View>

        {/* Checkmark if selected */}
        {selected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkIcon}>✓</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    marginBottom: 12,
    overflow: 'hidden',
  },
  selected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF', // Light blue tint
  },
  recommended: {
    borderColor: '#FFD700',
    backgroundColor: '#FFFEF0', // Light gold tint
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  recommendedBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1C1C1E',
    textTransform: 'uppercase',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
