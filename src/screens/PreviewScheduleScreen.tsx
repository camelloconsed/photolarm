/**
 * PreviewScheduleScreen - Vista previa de alarmas generadas
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AlarmCard, EmptyState, Card, ActionButtons } from '@/components';
import { useSchedulesStore } from '@/store';
import { notificationService } from '@/services/notification.service';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type RootStackParamList = {
  Home: undefined;
  PreviewSchedule: { scheduleId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'PreviewSchedule'>;

export function PreviewScheduleScreen({ navigation, route }: Props) {
  const { scheduleId } = route.params;
  const [isScheduling, setIsScheduling] = useState(false);
  
  const schedule = useSchedulesStore((s) => s.getScheduleById(scheduleId));
  const deleteSchedule = useSchedulesStore((s) => s.deleteSchedule);

  if (!schedule) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="❌"
          title="Schedule no encontrado"
          description="El schedule que buscas no existe"
          actionLabel="Volver al inicio"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  const handleConfirm = async () => {
    setIsScheduling(true);
    
    try {
      // 1. Solicitar permisos si es necesario
      const hasPermissions = await notificationService.hasPermissions();
      
      if (!hasPermissions) {
        const granted = await notificationService.requestPermissions();
        
        if (!granted) {
          Alert.alert(
            'Permisos necesarios',
            'Photolarm necesita permisos de notificaciones para programar tus alarmas. Por favor actívalos en Configuración.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Ir a Configuración', onPress: () => {
                // TODO: Abrir configuración del sistema
                console.log('Abrir configuración');
              }},
            ]
          );
          setIsScheduling(false);
          return;
        }
      }

      // 2. Programar las alarmas en el sistema
      console.log('📅 Programando alarmas...');
      const notificationIds = await notificationService.createAlarms(schedule);
      
      // 3. Guardar los notification IDs en el schedule (para poder cancelarlas después)
      // TODO: Agregar campo notificationIds al Schedule type y al store
      console.log(`✅ ${notificationIds.length} alarmas programadas`);

      // 4. Mostrar confirmación
      Alert.alert(
        '¡Alarmas programadas!',
        `Se han creado ${notificationIds.length} alarmas. Recibirás notificaciones en los horarios indicados.`,
        [
          {
            text: 'Ver en inicio',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      console.error('Error programando alarmas:', error);
      Alert.alert(
        'Error',
        'Hubo un problema al programar las alarmas. Por favor intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar schedule',
      '¿Estás seguro? Se perderán todas las alarmas generadas.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => {
            deleteSchedule(scheduleId);
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  const firstAlarm = schedule.alarms[0];
  const lastAlarm = schedule.alarms[schedule.alarms.length - 1];
  
  const startDate = firstAlarm ? format(parseISO(firstAlarm.datetime), "d 'de' MMM", { locale: es }) : '';
  const endDate = lastAlarm ? format(parseISO(lastAlarm.datetime), "d 'de' MMM", { locale: es }) : '';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vista Previa</Text>
        <Text style={styles.subtitle}>
          {schedule.alarms.length} alarmas generadas
        </Text>
      </View>

      {/* Summary Card */}
      <Card style={styles.summaryCard} padding={20}>
        <Text style={styles.summaryTitle}>📅 Resumen del Schedule</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total de alarmas:</Text>
          <Text style={styles.summaryValue}>{schedule.alarms.length}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Desde:</Text>
          <Text style={styles.summaryValue}>{startDate}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Hasta:</Text>
          <Text style={styles.summaryValue}>{endDate}</Text>
        </View>

        {schedule.anchor && (
          <View style={styles.anchorInfo}>
            <Text style={styles.anchorLabel}>🎯 Ancla:</Text>
            <Text style={styles.anchorValue}>
              {schedule.anchor.type === 'now' ? 'Comenzar ahora' : 'Recomendado por IA'}
            </Text>
            {schedule.anchor.reason && (
              <Text style={styles.anchorReason}>{schedule.anchor.reason}</Text>
            )}
          </View>
        )}
      </Card>

      {/* Alarms List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.sectionTitle}>Todas las alarmas</Text>
        {schedule.alarms.map((alarm) => (
          <AlarmCard
            key={alarm.id}
            alarm={alarm}
            showActions={false}
          />
        ))}
      </ScrollView>

      {/* Bottom Actions */}
      {!isScheduling && (
        <ActionButtons
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          cancelText="Cancelar"
          confirmText="Confirmar alarmas"
        />
      )}

      {/* Loading Overlay */}
      {isScheduling && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Programando alarmas...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  anchorInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  anchorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  anchorValue: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  anchorReason: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
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
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});
