/**
 * PlanCategoryBadge Component
 * 
 * Visual badge showing category and mode of a plan
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Category, PlanMode } from '@/types';
import { getCategoryInfo, getModeLabel, getModeIcon } from '@/lib/category-utils';

interface PlanCategoryBadgeProps {
  category: Category;
  mode: PlanMode;
  size?: 'small' | 'medium' | 'large';
}

export function PlanCategoryBadge({ 
  category, 
  mode,
  size = 'medium',
}: PlanCategoryBadgeProps) {
  const categoryInfo = getCategoryInfo(category);
  const modeLabel = getModeLabel(mode);
  const modeIcon = getModeIcon(mode);
  console.log('Category Info:', categoryInfo);

  const containerStyle = [
    styles.container,
    styles[`${size}Container`],
    { backgroundColor: categoryInfo.color + '15' }, // 15 = ~8% opacity
    { borderColor: categoryInfo.color },
  ];

  const textStyle = [
    styles.text,
    styles[`${size}Text`],
    { color: categoryInfo.color },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={containerStyle}>
        <Text style={styles.icon}>{categoryInfo.icon}</Text>
        <Text style={textStyle}>{categoryInfo.label}</Text>
      </View>
      <View style={[containerStyle, styles.modeContainer]}>
        <Text style={styles.modeIcon}>{modeIcon}</Text>
        <Text style={[textStyle, styles.modeText]}>{modeLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  modeContainer: {
    flex: 1,
  },
  
  // Size variants
  smallContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mediumContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  largeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  icon: {
    fontSize: 16,
  },
  text: {
    fontWeight: '600',
  },
  modeIcon: {
    fontSize: 14,
  },
  modeText: {
    fontSize: 11,
  },
  
  // Text sizes
  smallText: {
    fontSize: 11,
  },
  mediumText: {
    fontSize: 13,
  },
  largeText: {
    fontSize: 15,
  },
});
