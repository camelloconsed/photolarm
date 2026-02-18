/**
 * AlarmScreen - Pantalla de alarma de pantalla completa
 * 
 * Se muestra cuando una alarma suena, similar a la app de Reloj nativa.
 * Permite apagar o posponer la alarma.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Vibration,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { notificationService } from '@/services/notification.service';

type AlarmScreenParams = {
  alarmId: string;
  scheduleId: string;
  title: string;
  body?: string;
  notificationId: string;
};

export default function AlarmScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: AlarmScreenParams }, 'params'>>();
  
  const { alarmId, scheduleId, title, body, notificationId } = route.params || {};
  
  const [currentTime, setCurrentTime] = useState(new Date());

  // Detener TODOS los sonidos al montar - replicar acción de "descartar"
  useEffect(() => {
    const stopAllSounds = async () => {
      try {
        await Notifications.dismissAllNotificationsAsync();
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('🔇 Notificaciones canceladas al abrir AlarmScreen');
      } catch (error) {
        console.error('Error deteniendo sonidos:', error);
      }
    };
    
    stopAllSounds();
  }, []);

  // Actualizar el reloj cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Vibración continua mientras la alarma está activa
  useEffect(() => {
    // Patrón: vibrar 1s, pausa 1s, repetir
    const vibrationPattern = [0, 1000, 1000];
    
    if (Platform.OS === 'android') {
      Vibration.vibrate(vibrationPattern, true); // true = repetir
    } else {
      // iOS no soporta patrones personalizados, solo vibración simple
      const interval = setInterval(() => {
        Vibration.vibrate(1000);
      }, 2000);
      
      return () => {
        clearInterval(interval);
        Vibration.cancel();
      };
    }

    return () => Vibration.cancel();
  }, []);

  const handleDismiss = async () => {
    console.log('🔕 Alarma apagada');
    
    try {
      // 1. Cancelar vibración
      Vibration.cancel();
      
      // 2. CLAVE: Cancelar todas las notificaciones (programadas y mostradas)
      // Esto replica la acción de "descartar" la notificación
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // 3. Marcar como completada
      if (notificationId) {
        await notificationService.completeAlarm(notificationId);
      }
      
      console.log('✅ Alarma completamente apagada');
    } catch (error) {
      console.error('Error apagando alarma:', error);
    }
    
    navigation.goBack();
  };

  const handleSnooze = async (minutes: number) => {
    console.log(`⏰ Posponer ${minutes} minutos`);
    
    try {
      // 1. Cancelar vibración
      Vibration.cancel();
      
      // 2. CLAVE: Cancelar todas las notificaciones (replicar acción de descartar)
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // 3. Posponer la alarma
      if (alarmId) {
        await notificationService.snoozeAlarm(alarmId, minutes);
      }
      
      console.log('✅ Alarma pospuesta y sonido detenido');
    } catch (error) {
      console.error('Error posponiendo alarma:', error);
    }
    
    navigation.goBack();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <View style={styles.container}>
      {/* Hora grande */}
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{formatTime(currentTime)}</Text>
        <Text style={styles.date}>{formatDate(currentTime)}</Text>
      </View>

      {/* Información de la alarma */}
      <View style={styles.alarmInfo}>
        <Text style={styles.alarmIcon}>⏰</Text>
        <Text style={styles.alarmTitle}>{title || 'Alarma'}</Text>
        {body && <Text style={styles.alarmBody}>{body}</Text>}
      </View>

      {/* Botones de acción */}
      <View style={styles.actionsContainer}>
        {/* Botones de posponer */}
        <View style={styles.snoozeButtons}>
          <TouchableOpacity
            style={styles.snoozeButton}
            onPress={() => handleSnooze(5)}
          >
            <Text style={styles.snoozeButtonText}>+5 min</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.snoozeButton}
            onPress={() => handleSnooze(10)}
          >
            <Text style={styles.snoozeButtonText}>+10 min</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.snoozeButton}
            onPress={() => handleSnooze(15)}
          >
            <Text style={styles.snoozeButtonText}>+15 min</Text>
          </TouchableOpacity>
        </View>

        {/* Botón de apagar (grande) */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
        >
          <Text style={styles.dismissButtonText}>Apagar Alarma</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  timeContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  time: {
    fontSize: 72,
    fontWeight: '200',
    color: '#FFF',
    letterSpacing: 2,
  },
  date: {
    fontSize: 18,
    color: '#888',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  alarmInfo: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  alarmIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  alarmTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  alarmBody: {
    fontSize: 16,
    color: '#AAA',
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 20,
  },
  snoozeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  snoozeButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  snoozeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  dismissButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
  },
});
