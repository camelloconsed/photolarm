/**
 * Notification Service - Sistema de notificaciones y alarmas
 * 
 * Maneja:
 * - Solicitud de permisos
 * - Programación de notificaciones locales
 * - Manejo de interacciones (completar, snooze)
 * - Cancelación de alarmas
 * 
 * Usa expo-notifications para soporte nativo
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Schedule, Alarm } from '@/types';
import type { ISchedulerService } from './interfaces';
import { usePreferencesStore } from '@/store';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

/**
 * Configuración global de cómo se manejan las notificaciones
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // iOS legacy
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // iOS 14+
    shouldShowList: true,   // iOS 14+
  }),
});

// ============================================================================
// SERVICIO
// ============================================================================

export class NotificationService implements ISchedulerService {
  private initialized = false;

  /**
   * Inicializa el servicio y solicita permisos si es necesario
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // En desarrollo, siempre intentar inicializar
    // En producción, Platform.OS nos dice si es real
    const hasPermissions = await this.hasPermissions();
    
    if (!hasPermissions) {
      console.log('🔔 Solicitando permisos de notificaciones...');
      const granted = await this.requestPermissions();
      
      if (!granted) {
        console.warn('⚠️ Permisos de notificaciones denegados');
        throw new Error('Notification permissions denied');
      }
    }

    // Configurar canal de notificaciones con sonido de ALARMA (Android)
    if (Platform.OS === 'android') {
      await this.setupAlarmChannel();
    }

    this.initialized = true;
    console.log('✅ NotificationService inicializado');
  }

  /**
   * Configura un canal de notificación con sonido de alarma (Android)
   */
  private async setupAlarmChannel(): Promise<void> {
    try {
      // Obtener el sonido seleccionado por el usuario
      const selectedSound = usePreferencesStore.getState().preferences.alarmSound;
      
      await Notifications.setNotificationChannelAsync('alarm', {
        name: 'Alarmas de Medicamentos',
        description: 'Notificaciones de alarma para recordatorios de medicamentos',
        importance: Notifications.AndroidImportance.MAX,
        sound: selectedSound, // Usar el sonido personalizado seleccionado
        enableVibrate: true,
        vibrationPattern: [0, 500, 500, 500], // Patrón más intenso
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.ALARM, // ¡CLAVE! Esto lo hace sonar como alarma
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
          flags: {
            enforceAudibility: true, // Fuerza que suene incluso en Do Not Disturb
            requestHardwareAudioVideoSynchronization: false,
          },
        },
        showBadge: true,
        enableLights: true,
        lightColor: '#FF0000',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true, // Ignora Do Not Disturb
      });
      
      console.log('📢 Canal de alarma configurado con sonido:', selectedSound);
    } catch (error) {
      console.error('Error configurando canal de alarma:', error);
    }
  }

  /**
   * Solicita permisos de notificaciones al usuario
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Si no están otorgados, solicitar
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: true, // Permite alarmas críticas (suena en DND)
          },
        });
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Verifica si los permisos están otorgados
   */
  async hasPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Programa todas las alarmas de un schedule
   * @returns Array de notification IDs del sistema
   */
  async createAlarms(schedule: Schedule): Promise<string[]> {
    await this.initialize();

    const notificationIds: string[] = [];
    
    console.log(`📅 Programando ${schedule.alarms.length} alarmas...`);

    for (const alarm of schedule.alarms) {
      // Solo programar alarmas habilitadas y no completadas
      if (!alarm.enabled || alarm.completed) {
        console.log(`  ⏭️ Saltando alarma ${alarm.id} (disabled o completed)`);
        continue;
      }

      const alarmTime = new Date(alarm.datetime);
      const now = new Date();

      // Verificar que la alarma sea futura
      if (alarmTime <= now) {
        console.log(`  ⏭️ Saltando alarma ${alarm.id} (tiempo pasado)`);
        continue;
      }

      try {
        const notificationId = await this.scheduleNotification(alarm, schedule.id);
        notificationIds.push(notificationId);
        
        console.log(`  ✅ Alarma programada: ${alarm.title} - ${alarmTime.toLocaleString()}`);
      } catch (error) {
        console.error(`  ❌ Error programando alarma ${alarm.id}:`, error);
      }
    }

    console.log(`✅ ${notificationIds.length} alarmas programadas exitosamente`);
    return notificationIds;
  }

  /**
   * Programa una notificación individual
   */
  private async scheduleNotification(alarm: Alarm, scheduleId: string): Promise<string> {
    const triggerDate = new Date(alarm.datetime);
    
    // Obtener el sonido seleccionado por el usuario
    const selectedSound = usePreferencesStore.getState().preferences.alarmSound;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.title,
        body: alarm.body || '¡Es hora de tu medicamento!',
        data: {
          alarmId: alarm.id,
          scheduleId: scheduleId,
          type: 'alarm',
        },
        sound: selectedSound, // Usar el sonido personalizado seleccionado
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 500, 500, 500],
        badge: 1,
        // iOS: Configurar como alerta crítica (suena incluso en silencio/Do Not Disturb)
        ...(Platform.OS === 'ios' && {
          interruptionLevel: 'critical', // Suena incluso en DND
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        // Android: Usar el canal de "alarm" que configuramos
        ...(Platform.OS === 'android' && {
          channelId: 'alarm',
        }),
      },
    });

    return notificationId;
  }

  /**
   * Cancela una alarma específica
   */
  async cancelAlarm(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`🗑️ Alarma ${notificationId} cancelada`);
    } catch (error) {
      console.error(`Error cancelando alarma ${notificationId}:`, error);
    }
  }

  /**
   * Cancela todas las alarmas de un schedule
   */
  async cancelScheduleAlarms(notificationIds: string[]): Promise<void> {
    console.log(`🗑️ Cancelando ${notificationIds.length} alarmas...`);
    
    for (const id of notificationIds) {
      await this.cancelAlarm(id);
    }
  }

  /**
   * Alias para cancelScheduleAlarms (requerido por interfaz)
   */
  async cancelAlarms(alarmIds: string[]): Promise<void> {
    await this.cancelScheduleAlarms(alarmIds);
  }

  /**
   * Cancela todas las alarmas de un plan
   * Nota: Expo no tiene forma nativa de filtrar por planId,
   * por lo que necesitamos pasar los IDs específicos
   */
  async cancelPlanAlarms(planId: string): Promise<void> {
    console.warn('⚠️ cancelPlanAlarms no implementado - usar cancelAlarms con IDs específicos');
    // En una implementación real, necesitarías mantener un mapeo
    // de planId -> notificationIds en el store
  }

  /**
   * Cancela TODAS las alarmas programadas
   */
  async cancelAllAlarms(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️ Todas las alarmas canceladas');
  }

  /**
   * Obtiene todas las alarmas programadas en el sistema
   */
  async getAllAlarms(): Promise<Alarm[]> {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    console.log(`📋 ${scheduledNotifications.length} notificaciones programadas en el sistema`);
    
    // Mapear notificaciones del sistema a nuestro formato Alarm
    // Nota: Esto devuelve información limitada, principalmente para debug
    return scheduledNotifications.map(notification => {
      // El trigger puede ser un objeto complejo, extraer la fecha correctamente
      let datetime: string;
      try {
        const trigger = notification.trigger as any;
        
        // Debug: ver estructura del trigger
        console.log('🔍 Trigger object:', JSON.stringify(trigger, null, 2));
        
        // Para DateTriggerInput, el trigger tiene una propiedad 'date'
        if (trigger && trigger.date) {
          datetime = new Date(trigger.date).toISOString();
        } else if (trigger && typeof trigger === 'number') {
          // Timestamp en segundos
          datetime = new Date(trigger * 1000).toISOString();
        } else {
          // Fallback: usar fecha actual + 1 minuto
          console.warn('⚠️ No se pudo parsear trigger, usando fallback');
          datetime = new Date(Date.now() + 60000).toISOString();
        }
      } catch (error) {
        console.warn('⚠️ Error parseando trigger date:', error);
        datetime = new Date(Date.now() + 60000).toISOString();
      }

      return {
        id: notification.identifier,
        plan_id: notification.content.data?.scheduleId as string || '',
        datetime,
        timezone: 'local',
        title: notification.content.title || '',
        body: notification.content.body || '',
        enabled: true,
        snoozeable: true,
        triggered: false,
        completed: false,
        metadata: {},
      };
    });
  }

  /**
   * Marca una alarma como completada
   * (En realidad, cancela la notificación programada)
   */
  async completeAlarm(notificationId: string): Promise<void> {
    await this.cancelAlarm(notificationId);
  }

  /**
   * Pospone una alarma X minutos
   */
  async snoozeAlarm(alarmId: string, minutes: number): Promise<void> {
    const newTrigger = new Date(Date.now() + minutes * 60 * 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio (Pospuesto)',
        body: `Tu alarma fue pospuesta ${minutes} minutos`,
        data: {
          alarmId,
          type: 'snooze',
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: newTrigger,
      },
    });

    console.log(`⏰ Alarma ${alarmId} pospuesta ${minutes} minutos`);
  }

  /**
   * Configura listeners para interacciones con notificaciones
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): void {
    // Listener para cuando se recibe una notificación (app en foreground)
    if (onNotificationReceived) {
      Notifications.addNotificationReceivedListener(onNotificationReceived);
    }

    // Listener para cuando el usuario toca la notificación
    if (onNotificationResponse) {
      Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
    }

    console.log('👂 Notification listeners configurados');
  }

  /**
   * Obtiene el token push (para notificaciones remotas en el futuro)
   */
  async getPushToken(): Promise<string | null> {
    // En desarrollo o simuladores, los push tokens pueden no funcionar
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      console.warn('⚠️ Push tokens solo funcionan en iOS/Android');
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '45cb1926-60e2-480c-9d15-1e75015b74ed', // Tu Expo project ID
      });
      
      console.log('🔑 Push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error obteniendo push token:', error);
      return null;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const notificationService = new NotificationService();
