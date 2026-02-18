import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ALARM_SOUNDS } from '@/constants';
import { usePreferencesStore } from '@/store';

export default function SoundSettingsScreen() {
  const navigation = useNavigation();
  const { preferences, updatePreferences } = usePreferencesStore();

  const selectSound = (filename: string) => {
    updatePreferences({ alarmSound: filename });
    Alert.alert(
      '✅ Sonido guardado',
      'El sonido se aplicará en las próximas alarmas.\n\n⚠️ Nota: El preview de audio no está disponible en Expo Go. Para probar los sonidos, usa una alarma real.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sonido de Alarma</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Selecciona el sonido que prefieres para tus alarmas.
        </Text>
        
        <View style={styles.warningBox}>
          <Ionicons name="information-circle" size={20} color="#FF9500" />
          <Text style={styles.warningText}>
            El preview de audio no está disponible en Expo Go. Para probar los sonidos, crea una alarma real.
          </Text>
        </View>

        {ALARM_SOUNDS.map((alarmSound) => {
          const isSelected = preferences.alarmSound === alarmSound.filename;

          return (
            <TouchableOpacity
              key={alarmSound.id}
              style={[styles.soundCard, isSelected && styles.soundCardSelected]}
              onPress={() => selectSound(alarmSound.filename)}
            >
              <View style={styles.soundInfo}>
                <View style={styles.soundHeader}>
                  <Text style={styles.soundName}>{alarmSound.name}</Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#4CAF50"
                    />
                  )}
                </View>
                <Text style={styles.soundDescription}>
                  {alarmSound.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  soundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  soundCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  soundInfo: {
    flex: 1,
  },
  soundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  soundName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  soundDescription: {
    fontSize: 14,
    color: '#666',
  },
});
