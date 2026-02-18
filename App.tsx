import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import {
  HomeScreen,
  TextImportScreen,
  CameraScreen,
  ConfirmMedicationsScreen,
  ResultsScreen,
  PreviewScheduleScreen,
  TestNotificationScreen,
  AlarmScreen,
  SoundSettingsScreen,
} from './src/screens';
import { notificationService } from './src/services/notification.service';

export type RootStackParamList = {
  Home: undefined;
  TextImport: undefined;
  Camera: undefined;
  ConfirmMedications: { ocrText: string };
  Results: { planIds: string[] };
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

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  console.log('🚀 App iniciando...');
  const navigationRef = useRef<any>(null);

  // Inicializar servicio de notificaciones
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await notificationService.initialize();
        console.log('✅ Notificaciones inicializadas');
      } catch (error) {
        console.warn('⚠️ Error inicializando notificaciones:', error);
        // No bloqueamos la app si fallan los permisos
      }
    };

    initNotifications();
  }, []);

  // Listener para cuando llega una notificación mientras la app está en primer plano
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notificación recibida en foreground:', notification);
      
      // Extraer datos de la alarma
      const { alarmId, scheduleId, type } = notification.request.content.data || {};
      
      if (type === 'alarm') {
        // Navegar a la pantalla de alarma
        navigationRef.current?.navigate('Alarm', {
          alarmId: alarmId as string,
          scheduleId: scheduleId as string,
          title: notification.request.content.title || 'Alarma',
          body: notification.request.content.body || undefined,
          notificationId: notification.request.identifier,
        });
      }
    });

    return () => subscription.remove();
  }, []);

  // Listener para cuando el usuario toca una notificación
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Usuario tocó notificación:', response);
      
      // Extraer datos de la alarma
      const { alarmId, scheduleId, type } = response.notification.request.content.data || {};
      
      if (type === 'alarm') {
        // Navegar a la pantalla de alarma
        navigationRef.current?.navigate('Alarm', {
          alarmId: alarmId as string,
          scheduleId: scheduleId as string,
          title: response.notification.request.content.title || 'Alarma',
          body: response.notification.request.content.body || undefined,
          notificationId: response.notification.request.identifier,
        });
      }
    });

    return () => subscription.remove();
  }, []);
  
  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F2F2F7' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="TextImport"
          component={TextImportScreen}
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="ConfirmMedications"
          component={ConfirmMedicationsScreen}
        />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
        />
        <Stack.Screen
          name="PreviewSchedule"
          component={PreviewScheduleScreen}
        />
        <Stack.Screen
          name="TestNotification"
          component={TestNotificationScreen}
        />
        <Stack.Screen
          name="SoundSettings"
          component={SoundSettingsScreen}
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Alarm"
          component={AlarmScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
            gestureEnabled: false, // No permitir cerrar con gesto
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
