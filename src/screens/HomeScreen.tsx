/**
 * HomeScreen - Pantalla principal con próximas alarmas
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState, Card, ScheduleAccordion, EditScheduleModal } from '@/components';
import { useSchedulesStore, usePreferencesStore } from '@/store';

type RootStackParamList = {
  Home: undefined;
  TextImport: undefined;
  Camera: undefined;
  PreviewSchedule: { scheduleId: string };
  TestNotification: undefined;
  SoundSettings: undefined;
  Alarm: {
    alarmId: string;
    scheduleId: string;
    title: string;
    body?: string;
    notificationId: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  console.log('🏠 HomeScreen renderizando...');
  const [refreshing, setRefreshing] = React.useState(false);
  const [editScheduleModalVisible, setEditScheduleModalVisible] = React.useState(false);
  const [editScheduleMode, setEditScheduleMode] = React.useState<'times' | 'duration' | 'advanced'>('times');
  const [editingScheduleId, setEditingScheduleId] = React.useState<string | null>(null);
  
  const schedules = useSchedulesStore((s) => s.schedules);
  const { 
    markAlarmCompleted, 
    snoozeAlarm, 
    toggleAlarmEnabled, 
    getUpcomingAlarms, 
    getPendingAlarms,
    deleteSchedule,
    deleteAlarm,
    updateScheduleTimes,
    updateScheduleDuration,
    updateScheduleFrequency,
  } = useSchedulesStore();
  const preferences = usePreferencesStore((s) => s.preferences);

  // Calcular alarmas totales
  const allUpcomingAlarms = React.useMemo(() => getUpcomingAlarms(100), [schedules, getUpcomingAlarms]);
  const pendingAlarms = React.useMemo(() => getPendingAlarms(), [schedules, getPendingAlarms]);
  
  // Filtrar schedules que tienen alarmas próximas (no todas completadas)
  const activeSchedules = React.useMemo(() => {
    return schedules
      .filter(schedule => {
        const hasActiveAlarms = schedule.alarms.some(alarm => !alarm.completed);
        return hasActiveAlarms;
      })
      .sort((a, b) => {
        // Ordenar por la próxima alarma no completada
        const nextAlarmA = a.alarms
          .filter(alarm => !alarm.completed && alarm.enabled)
          .sort((x, y) => new Date(x.datetime).getTime() - new Date(y.datetime).getTime())[0];
        const nextAlarmB = b.alarms
          .filter(alarm => !alarm.completed && alarm.enabled)
          .sort((x, y) => new Date(x.datetime).getTime() - new Date(y.datetime).getTime())[0];
        
        if (!nextAlarmA) return 1;
        if (!nextAlarmB) return -1;
        
        return new Date(nextAlarmA.datetime).getTime() - new Date(nextAlarmB.datetime).getTime();
      });
  }, [schedules]);
  
  console.log('📱 Schedules activos:', activeSchedules.length);
  console.log('📱 Alarmas próximas:', allUpcomingAlarms.length);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simular refresh
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleEditSchedule = (scheduleId: string) => {
    Alert.alert(
      'Editar Set de Alarmas',
      'Selecciona qué deseas hacer:',
      [
        {
          text: 'Cambiar Horarios',
          onPress: () => {
            setEditingScheduleId(scheduleId);
            setEditScheduleMode('times');
            setEditScheduleModalVisible(true);
          },
        },
        {
          text: 'Modificar Duración',
          onPress: () => {
            setEditingScheduleId(scheduleId);
            setEditScheduleMode('duration');
            setEditScheduleModalVisible(true);
          },
        },
        {
          text: 'Configuración Avanzada',
          onPress: () => {
            setEditingScheduleId(scheduleId);
            setEditScheduleMode('advanced');
            setEditScheduleModalVisible(true);
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSaveScheduleEdit = (updates: {
    startTime?: string;
    duration?: number;
    frequency?: number;
  }) => {
    if (!editingScheduleId) return;

    if (updates.startTime && editScheduleMode === 'times') {
      updateScheduleTimes(editingScheduleId, updates.startTime);
    } else if (updates.duration && editScheduleMode === 'duration') {
      updateScheduleDuration(editingScheduleId, updates.duration);
    } else if (editScheduleMode === 'advanced') {
      if (updates.startTime) {
        updateScheduleTimes(editingScheduleId, updates.startTime);
      }
      if (updates.duration) {
        updateScheduleDuration(editingScheduleId, updates.duration);
      }
      if (updates.frequency) {
        updateScheduleFrequency(editingScheduleId, updates.frequency);
      }
    }

    setEditScheduleModalVisible(false);
    setEditingScheduleId(null);
  };

  const editingSchedule = editingScheduleId 
    ? schedules.find(s => s.id === editingScheduleId) 
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Photolarm 👋</Text>
          <Text style={styles.subtitle}>
            {allUpcomingAlarms.length} alarmas próximas
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('SoundSettings')}
          >
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('TestNotification')}
          >
            <Text style={styles.headerButtonText}>🧪</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <Text style={styles.headerButtonText}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('TextImport')}
          >
            <Text style={styles.headerButtonText}>📝</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pending Alarms Alert */}
      {pendingAlarms.length > 0 && (
        <Card style={styles.alertCard} padding={16}>
          <View style={styles.alert}>
            <Text style={styles.alertIcon}>⏰</Text>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {pendingAlarms.length} {pendingAlarms.length === 1 ? 'alarma pendiente' : 'alarmas pendientes'}
              </Text>
              <Text style={styles.alertText}>
                No olvides marcarlas como completadas
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Alarms List - Grouped by Schedule */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeSchedules.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No tienes alarmas programadas"
            description="Importa un documento médico para crear tus primeras alarmas automáticas"
            actionLabel="Importar documento"
            onAction={() => navigation.navigate('TextImport')}
          />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Mis Alarmas</Text>
            {activeSchedules.map((schedule) => (
              <ScheduleAccordion
                key={schedule.id}
                schedule={schedule}
                alarms={schedule.alarms}
                onComplete={(alarmId) => markAlarmCompleted(schedule.id, alarmId)}
                onSnooze={(alarmId) => snoozeAlarm(schedule.id, alarmId, 10)}
                onToggle={(alarmId) => toggleAlarmEnabled(schedule.id, alarmId)}
                onDeleteAlarm={(alarmId) => deleteAlarm(schedule.id, alarmId)}
                onEditAlarm={(alarmId) => {
                  // La edición se maneja dentro del componente ScheduleAccordion
                }}
                onDeleteSchedule={() => deleteSchedule(schedule.id)}
                onEditSchedule={() => handleEditSchedule(schedule.id)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Quick Stats */}
      {activeSchedules.length > 0 && (
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{allUpcomingAlarms.length}</Text>
            <Text style={styles.statLabel}>Próximas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {preferences.sleepWindow?.end || '07:00'}
            </Text>
            <Text style={styles.statLabel}>Despertar</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {preferences.mealTimes?.breakfast || '08:00'}
            </Text>
            <Text style={styles.statLabel}>Desayuno</Text>
          </View>
        </View>
      )}

      {/* Edit Schedule Modal */}
      {editingSchedule && (
        <EditScheduleModal
          visible={editScheduleModalVisible}
          onClose={() => {
            setEditScheduleModalVisible(false);
            setEditingScheduleId(null);
          }}
          onSave={handleSaveScheduleEdit}
          mode={editScheduleMode}
          currentStartTime={editingSchedule.alarms[0]?.datetime || new Date().toISOString()}
          currentDuration={
            editingSchedule.alarms.length > 1
              ? Math.ceil(
                  (new Date(editingSchedule.alarms[editingSchedule.alarms.length - 1].datetime).getTime() -
                    new Date(editingSchedule.alarms[0].datetime).getTime()) /
                    (24 * 60 * 60 * 1000)
                )
              : 1
          }
          currentFrequency={
            editingSchedule.alarms.length > 1
              ? Math.ceil(
                  (new Date(editingSchedule.alarms[1].datetime).getTime() -
                    new Date(editingSchedule.alarms[0].datetime).getTime()) /
                    (60 * 60 * 1000)
                )
              : 8
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 20,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  alertCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFF3E0',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  alertText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 12,
  },
});
