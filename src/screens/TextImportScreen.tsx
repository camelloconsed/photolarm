/**
 * TextImportScreen - Importar texto médico
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input, Button, Card, ActionButtons } from '@/components';
import { OpenAIExtractorService, MockExtractorService } from '@/services/extractor.service';
import { usePlansStore, usePreferencesStore } from '@/store';

type RootStackParamList = {
  Home: undefined;
  TextImport: undefined;
  Results: { planIds: string[] };
};

type Props = NativeStackScreenProps<RootStackParamList, 'TextImport'>;

// TODO: Move to secure storage or environment variable
// For now, configure your API key here or leave empty to use Mock
// NOTE: OpenAI requires payment method - add card at platform.openai.com/settings/organization/billing
const OPENAI_API_KEY = ''; // Your key (needs billing): 'sk-proj-...'

export function TextImportScreen({ navigation }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addPlans } = usePlansStore();
  const preferences = usePreferencesStore((s) => s.preferences);

  // Use OpenAI if API key is configured, otherwise fallback to Mock
  const extractorService = OPENAI_API_KEY.length > 0
    ? new OpenAIExtractorService({ apiKey: OPENAI_API_KEY })
    : new MockExtractorService();

  const handleExtract = async () => {
    if (!text.trim()) {
      setError('Por favor ingresa un texto');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await extractorService.extractPlans(
        text.trim(),
        {
          currentDatetime: new Date().toISOString(),
          preferences: preferences,
        }
      );

      if (!result.success || result.plans.length === 0) {
        throw new Error('No se pudieron extraer planes del texto');
      }

      // Guardar planes en el store
      addPlans(result.plans);

      // Navegar a resultados
      navigation.navigate('Results', {
        planIds: result.plans.map(p => p.id),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar el texto';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleExample = () => {
    setText('Amoxicilina 500mg cada 8 horas por 7 días con comida\nIbuprofeno 400mg cada 6 horas si hay dolor\nCita médica 25/12/2025 10:00am');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Importar Texto</Text>
            <Text style={styles.subtitle}>
              Pega el texto de tu receta, indicaciones médicas o documento
            </Text>
          </View>

          {/* Example Card */}
          <Card style={styles.exampleCard} padding={16}>
            <View style={styles.exampleHeader}>
              <Text style={styles.exampleIcon}>💡</Text>
              <View style={styles.exampleContent}>
                <Text style={styles.exampleTitle}>Ejemplo</Text>
                <Text style={styles.exampleText}>
                  "Amoxicilina 500mg cada 8 horas por 7 días"
                </Text>
              </View>
              <Button
                title="Usar"
                onPress={handleExample}
                variant="outline"
                size="small"
              />
            </View>
          </Card>

          {/* Text Input */}
          <Input
            label="Texto médico"
            placeholder="Pega aquí tu receta o indicaciones..."
            value={text}
            onChangeText={(value) => {
              setText(value);
              setError(null);
            }}
            error={error || undefined}
            multiline
            numberOfLines={12}
            style={styles.textInput}
            textAlignVertical="top"
          />

          {/* Info */}
          <Card style={styles.infoCard} padding={16}>
            <Text style={styles.infoTitle}>📝 Qué puedo importar:</Text>
            <Text style={styles.infoItem}>• Medicamentos con dosis y frecuencia</Text>
            <Text style={styles.infoItem}>• Citas médicas con fecha y hora</Text>
            <Text style={styles.infoItem}>• Indicaciones de tratamiento</Text>
            <Text style={styles.infoItem}>• Mediciones periódicas (glucosa, presión, etc.)</Text>
          </Card>
        </ScrollView>

        {/* Bottom Actions */}
        <ActionButtons
          onCancel={() => navigation.goBack()}
          onConfirm={handleExtract}
          cancelText="Cancelar"
          confirmText="Extraer"
          confirmDisabled={!text.trim() || loading}
          confirmLoading={loading}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  exampleCard: {
    marginBottom: 24,
    backgroundColor: '#E8F5E9',
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exampleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  exampleContent: {
    flex: 1,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  textInput: {
    minHeight: 200,
    paddingTop: 12,
  },
  infoCard: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 6,
  },
});
