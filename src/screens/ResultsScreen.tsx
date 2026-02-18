/**
 * ResultsScreen - Mostrar planes extraídos
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { 
  PlanCard, 
  EmptyState, 
  ActionButtons, 
  AnchorSelectionCard,
  ReminderCheckbox,
  // DateTimePickerModal, // TODO: Needs native build
} from '@/components';
import { usePlansStore, useSchedulesStore, usePreferencesStore } from '@/store';
import { generateFlexibleSchedule, generateFixedSchedule } from '@/lib/schedule-generator';
import { shouldShowRecommendedAnchor, ANCHOR_LABELS } from '@/lib/category-utils';
import type { Anchor, AnchorType, ReminderTime } from '@/types';

type RootStackParamList = {
  Home: undefined;
  Results: { planIds: string[] };
  PreviewSchedule: { scheduleId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

// Reminder options configuration
const REMINDER_OPTIONS: Array<{
  value: ReminderTime;
  label: string;
  description: string;
}> = [
  { value: '1day', label: '1 día antes', description: 'Recibe un recordatorio el día anterior' },
  { value: '1hour', label: '1 hora antes', description: 'Recibe un recordatorio 1 hora antes' },
  { value: '30min', label: '30 minutos antes', description: 'Recibe un recordatorio 30 min antes' },
  { value: '15min', label: '15 minutos antes', description: 'Recibe un recordatorio 15 min antes' },
  { value: '5min', label: '5 minutos antes', description: 'Recibe un recordatorio 5 min antes' },
  { value: 'at_time', label: 'A la hora exacta', description: 'Solo en el momento del evento' },
];

export function ResultsScreen({ navigation, route }: Props) {
  const { planIds } = route.params;
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [selectedAnchorType, setSelectedAnchorType] = React.useState<AnchorType | null>(null);
  const [selectedReminders, setSelectedReminders] = React.useState<Set<ReminderTime>>(
    new Set(['1day', '1hour', '15min']) // Default reminders
  );
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [customDateTime, setCustomDateTime] = React.useState<Date>(new Date());
  
  const allPlans = usePlansStore((s) => s.plans);
  const plans = React.useMemo(
    () => allPlans.filter(p => planIds.includes(p.id)),
    [allPlans, planIds]
  );
  const { deletePlan } = usePlansStore();
  const { addSchedule } = useSchedulesStore();
  const preferences = usePreferencesStore((s) => s.preferences);

  const selectedPlan = selectedPlanId ? plans.find(p => p.id === selectedPlanId) : null;

  const handleGenerateSchedule = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    try {
      let schedule;
      
      // Create generation context
      const context = {
        preferences,
        currentTime: new Date(),
      };

      if (plan.mode === 'flexible') {
        // Create anchor based on selected type
        let anchor: Anchor;
        
        if (selectedAnchorType === 'now') {
          // Start immediately
          anchor = {
            type: 'now',
            datetime: new Date().toISOString(),
            timezone: 'local',
          };
        } else if (selectedAnchorType === 'user_selected') {
          // Use custom datetime selected by user
          anchor = {
            type: 'user_selected',
            datetime: customDateTime.toISOString(),
            timezone: 'local',
          };
        } else {
          // recommended
          // TODO: Call recommendAnchor() service for AI-optimized time
          anchor = {
            type: 'recommended',
            datetime: new Date().toISOString(),
            timezone: 'local',
            reason: 'Basado en tus hábitos y la categoría del plan',
          };
        }

        schedule = generateFlexibleSchedule(plan, anchor, context);
      } else {
        // Fixed plan - TODO: Apply selected reminders to each alarm
        schedule = generateFixedSchedule(plan, context);
        
        // Note: In the future, we'll modify generateFixedSchedule to accept
        // reminder preferences and create additional alarms for each reminder time
        console.log('Selected reminders:', Array.from(selectedReminders));
      }

      // Guardar schedule
      addSchedule(schedule);

      // Navegar a preview
      navigation.navigate('PreviewSchedule', {
        scheduleId: schedule.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al generar alarmas';
      Alert.alert('Error', message);
    }
  };

  const handleDelete = (planId: string) => {
    Alert.alert(
      'Eliminar plan',
      '¿Estás seguro de que quieres eliminar este plan?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deletePlan(planId);
            
            // Si era el único plan, volver a Home
            if (plans.length === 1) {
              navigation.navigate('Home');
            }
          },
        },
      ]
    );
  };

  const handleContinue = () => {
    if (!selectedPlanId) {
      Alert.alert('Selecciona un plan', 'Por favor selecciona un plan para continuar');
      return;
    }

    const plan = plans.find(p => p.id === selectedPlanId);
    if (!plan) return;

    // Si es flexible y no ha elegido ancla, mostrar error
    if (plan.mode === 'flexible' && !selectedAnchorType) {
      Alert.alert('Elige cuándo empezar', 'Por favor selecciona cuándo quieres comenzar');
      return;
    }

    // Si es fixed y no ha elegido ningún recordatorio, mostrar error
    if (plan.mode === 'fixed' && selectedReminders.size === 0) {
      Alert.alert(
        'Selecciona recordatorios', 
        'Por favor selecciona al menos un recordatorio o elige "A la hora exacta"'
      );
      return;
    }

    handleGenerateSchedule(selectedPlanId);
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setSelectedAnchorType(null); // Reset anchor when changing plan
    setSelectedReminders(new Set(['1day', '1hour', '15min'])); // Reset reminders
  };

  const handleSelectAnchor = (anchorType: AnchorType) => {
    setSelectedAnchorType(anchorType);
    
    // TODO: Uncomment when native build includes DateTimePicker
    // Si selecciona "ELEGIR HORA", abrir el DateTimePicker
    /*
    if (anchorType === 'user_selected') {
      setCustomDateTime(new Date()); // Reset al tiempo actual
      setShowDatePicker(true);
    }
    */
  };

  const handleToggleReminder = (reminder: ReminderTime) => {
    setSelectedReminders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reminder)) {
        newSet.delete(reminder);
      } else {
        newSet.add(reminder);
      }
      return newSet;
    });
  };

  if (plans.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="🔍"
          title="No hay planes"
          description="No se encontraron planes para mostrar"
          actionLabel="Volver"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {plans.length} {plans.length === 1 ? 'plan encontrado' : 'planes encontrados'}
          </Text>
          <Text style={styles.subtitle}>
            Selecciona el plan que quieres programar
          </Text>
        </View>

        <View style={styles.plansList}>
          {plans.map((plan) => (
            <View key={plan.id}>
              <PlanCard
                plan={plan}
                onPress={() => handleSelectPlan(plan.id)}
                onDelete={() => handleDelete(plan.id)}
                enableSwipeToDelete={true}
              />

              {/* Anchor selection for flexible plans */}
              {selectedPlanId === plan.id && plan.mode === 'flexible' && (
                <View style={styles.optionsContainer}>
                  <Text style={styles.optionsQuestion}>🎯 ¿Cuándo empiezas?</Text>
                  
                  <AnchorSelectionCard
                    icon={ANCHOR_LABELS.now.icon}
                    title={ANCHOR_LABELS.now.title}
                    description={ANCHOR_LABELS.now.description}
                    selected={selectedAnchorType === 'now'}
                    onPress={() => handleSelectAnchor('now')}
                  />

                  <AnchorSelectionCard
                    icon={ANCHOR_LABELS.user_selected.icon}
                    title={ANCHOR_LABELS.user_selected.title}
                    description={ANCHOR_LABELS.user_selected.description}
                    selected={selectedAnchorType === 'user_selected'}
                    onPress={() => handleSelectAnchor('user_selected')}
                  />

                  {shouldShowRecommendedAnchor(plan.category) && (
                    <AnchorSelectionCard
                      icon={ANCHOR_LABELS.recommended.icon}
                      title={ANCHOR_LABELS.recommended.title}
                      description={ANCHOR_LABELS.recommended.description}
                      selected={selectedAnchorType === 'recommended'}
                      recommended
                      onPress={() => handleSelectAnchor('recommended')}
                    />
                  )}
                </View>
              )}

              {/* Reminder selection for fixed plans */}
              {selectedPlanId === plan.id && plan.mode === 'fixed' && (
                <View style={styles.optionsContainer}>
                  <Text style={styles.optionsQuestion}>🔔 ¿Cuándo quieres recordatorios?</Text>
                  <Text style={styles.optionsSubtext}>
                    Selecciona cuándo deseas recibir notificaciones antes del evento
                  </Text>
                  
                  {REMINDER_OPTIONS.map((option) => (
                    <ReminderCheckbox
                      key={option.value}
                      label={option.label}
                      description={option.description}
                      checked={selectedReminders.has(option.value)}
                      onToggle={() => handleToggleReminder(option.value)}
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <ActionButtons
        confirmText="Continuar"
        cancelText="Cancelar"
        onConfirm={handleContinue}
        onCancel={() => navigation.goBack()}
        confirmDisabled={!selectedPlanId}
      />

      {/* TODO: Uncomment when native build includes DateTimePicker
      <DateTimePickerModal
        visible={showDatePicker}
        mode="datetime"
        value={customDateTime}
        minimumDate={new Date()}
        title="¿Cuándo empiezas?"
        onConfirm={(date) => {
          setCustomDateTime(date);
          setShowDatePicker(false);
        }}
        onCancel={() => {
          setShowDatePicker(false);
          // Si cancela, deseleccionar la opción
          setSelectedAnchorType(null);
        }}
      />
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  plansList: {
    gap: 16,
  },
  optionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  optionsQuestion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
    textAlign: 'center',
  },
  optionsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
