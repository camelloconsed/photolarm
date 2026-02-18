/**
 * TestNotificationScreen - Screen para probar notificaciones
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { notificationService } from '@/services/notification.service';
import type { Schedule } from '@/types';

export function TestNotificationScreen() {
  const [testing, setTesting] = useState(false);

  const scheduleTestNotification = async (seconds: number) => {
    setTesting(true);
    
    try {
      // 1. Verificar permisos
      const hasPerms = await notificationService.hasPermissions();
      console.log('🔐 Tiene permisos:', hasPerms);
      
      if (!hasPerms) {
        const granted = await notificationService.requestPermissions();
        if (!granted) {
          Alert.alert('Error', 'Se necesitan permisos de notificaciones');
          setTesting(false);
          return;
        }
      }

      // 2. Crear alarma de prueba
      const testTime = new Date(Date.now() + seconds * 1000);
      console.log(`🧪 Programando alarma para: ${testTime.toLocaleTimeString()}`);
      
      const testSchedule: Schedule = {
        id: `test-${Date.now()}`,
        plan_id: 'test-plan',
        alarms: [{
          id: `alarm-${Date.now()}`,
          plan_id: 'test-plan',
          datetime: testTime.toISOString(),
          timezone: 'local',
          title: '🧪 ALARMA DE PRUEBA',
          body: `¡Las notificaciones funcionan! (${seconds}s)`,
          enabled: true,
          snoozeable: true,
          triggered: false,
          completed: false,
          metadata: {},
        }],
        anchor: {
          type: 'now',
          datetime: new Date().toISOString(),
          timezone: 'local',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 3. Programar
      const ids = await notificationService.createAlarms(testSchedule);
      console.log('✅ IDs de notificaciones:', ids);

      // 4. Verificar alarmas programadas
      const allAlarms = await notificationService.getAllAlarms();
      console.log(`📋 Total alarmas en sistema: ${allAlarms.length}`);

      Alert.alert(
        '✅ Alarma Programada',
        `La alarma sonará en ${seconds} segundos.\n\nID: ${ids[0]}\n\nRevisa que:\n- El volumen esté alto\n- No estés en modo silencio\n- La app tenga permisos`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Error', String(error));
    } finally {
      setTesting(false);
    }
  };

  const checkScheduledNotifications = async () => {
    try {
      const alarms = await notificationService.getAllAlarms();
      
      if (alarms.length === 0) {
        Alert.alert(
          'Sin Alarmas',
          'No hay alarmas programadas en el sistema'
        );
      } else {
        const list = alarms.map((a, i) => 
          `${i + 1}. ${a.title}\n   ${new Date(a.datetime).toLocaleString()}`
        ).join('\n\n');
        
        Alert.alert(
          `📋 ${alarms.length} Alarmas Programadas`,
          list,
          [
            { text: 'Cancelar Todas', style: 'destructive', onPress: cancelAll },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  const cancelAll = async () => {
    try {
      await notificationService.cancelAllAlarms();
      Alert.alert('✅', 'Todas las alarmas canceladas');
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  const testImmediateNotification = async () => {
    try {
      const hasPerms = await notificationService.hasPermissions();
      if (!hasPerms) {
        await notificationService.requestPermissions();
      }

      // Notificación inmediata (sin schedule)
      const id = await notificationService.createAlarms({
        id: 'immediate-test',
        plan_id: 'test',
        alarms: [{
          id: 'alarm-immediate',
          plan_id: 'test',
          datetime: new Date(Date.now() + 1000).toISOString(), // +1 segundo
          timezone: 'local',
          title: '🔥 NOTIFICACIÓN INMEDIATA',
          body: '¡Deberías ver esto AHORA!',
          enabled: true,
          snoozeable: true,
          triggered: false,
          completed: false,
          metadata: {},
        }],
        anchor: { type: 'now', datetime: new Date().toISOString(), timezone: 'local' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      Alert.alert('✅', 'Notificación programada para dentro de 1 segundo');
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Test de Notificaciones</Text>
        <Text style={styles.subtitle}>Prueba que las alarmas funcionen</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pruebas Rápidas</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={testImmediateNotification}
            disabled={testing}
          >
            <Text style={styles.buttonText}>⚡ Notificación Inmediata (1s)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => scheduleTestNotification(5)}
            disabled={testing}
          >
            <Text style={styles.buttonText}>🔔 Alarma en 5 segundos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => scheduleTestNotification(10)}
            disabled={testing}
          >
            <Text style={styles.buttonText}>🔔 Alarma en 10 segundos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => scheduleTestNotification(30)}
            disabled={testing}
          >
            <Text style={styles.buttonText}>🔔 Alarma en 30 segundos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => scheduleTestNotification(60)}
            disabled={testing}
          >
            <Text style={styles.buttonText}>🔔 Alarma en 1 minuto</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestión</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={checkScheduledNotifications}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              📋 Ver Alarmas Programadas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={cancelAll}
          >
            <Text style={styles.buttonText}>🗑️ Cancelar Todas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Tips:</Text>
          <Text style={styles.infoText}>
            • Asegúrate de que el volumen esté alto{'\n'}
            • No estés en modo silencio/No molestar{'\n'}
            • La app debe tener permisos de notificaciones{'\n'}
            • En Android, verifica las notificaciones en la barra superior{'\n'}
            • Los logs aparecerán en la consola de Expo
          </Text>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD60A',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
});
