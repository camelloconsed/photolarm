/**
 * CameraScreen - Capturar o seleccionar foto para OCR
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, LoadingSpinner } from '@/components';
import { TesseractOCRService } from '@/services/ocr.service';
import { PatternBasedExtractorService } from '@/services/extractor.service';
import { usePlansStore, usePreferencesStore } from '@/store';

type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  ConfirmMedications: { ocrText: string };
  Results: { planIds: string[] };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

export function CameraScreen({ navigation }: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);
  
  const { addPlans } = usePlansStore();
  const preferences = usePreferencesStore((s) => s.preferences);

  const ocrService = new TesseractOCRService();
  const extractorService = new PatternBasedExtractorService(); // Pattern-based (lightweight, works offline)

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleTakePhoto = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso necesario',
          'Necesitamos acceso a la cámara para capturar fotos de recetas'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], // Updated from deprecated MediaTypeOptions.Images
        quality: 1,
        allowsEditing: false, // Disable editing to avoid UI issues
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setExtractedText(null);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara');
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Updated from deprecated MediaTypeOptions.Images
        quality: 1,
        allowsEditing: false, // Disable editing to avoid UI issues
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setExtractedText(null);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'No se pudo acceder a la galería');
    }
  };

  const handleExtractText = async () => {
    if (!imageUri) return;

    setLoading(true);
    setProcessingStep('Extrayendo texto de la imagen...');

    try {
      // Step 1: OCR - Extract text from image
      const ocrResult = await ocrService.extractText(imageUri);
      setExtractedText(ocrResult.text);
      setOcrConfidence(ocrResult.confidence);

      if (!ocrResult.text.trim()) {
        setProcessingStep('');
        setLoading(false);
        Alert.alert(
          'No se detectó texto',
          'No pudimos extraer texto de la imagen. Intenta con una foto más clara.'
        );
        return;
      }

      // Step 2: Navigate to confirmation screen for user validation
      setProcessingStep('');
      setLoading(false);

      navigation.navigate('ConfirmMedications', {
        ocrText: ocrResult.text,
      });
    } catch (error) {
      console.error('Extraction error:', error);
      setProcessingStep('');
      setLoading(false);
      
      const message = error instanceof Error ? error.message : 'Error al procesar la imagen';
      Alert.alert('Error', message);
    }
  };

  const handleRetake = () => {
    setImageUri(null);
    setExtractedText(null);
    setOcrConfidence(0);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Solicitando permisos...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>📷 Permiso de Cámara</Text>
          <Text style={styles.subtitle}>
            Necesitamos acceso a tu cámara para escanear recetas médicas
          </Text>
          <Button
            title="Configurar permisos"
            onPress={() => Camera.requestCameraPermissionsAsync()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📸 Escanear Receta</Text>
          <Text style={styles.subtitle}>
            Captura una foto de tu receta o documento médico
          </Text>
        </View>

        {/* Instructions */}
        {!imageUri && (
          <Card style={styles.instructionsCard} padding={16}>
            <Text style={styles.instructionsTitle}>💡 Consejos para mejor resultado:</Text>
            <Text style={styles.instructionItem}>• Asegúrate de buena iluminación</Text>
            <Text style={styles.instructionItem}>• El texto debe estar legible</Text>
            <Text style={styles.instructionItem}>• Evita sombras sobre el documento</Text>
            <Text style={styles.instructionItem}>• Mantén el documento plano</Text>
          </Card>
        )}

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            {extractedText && (
              <Card style={styles.textPreviewCard} padding={16}>
                <View style={styles.textPreviewHeader}>
                  <Text style={styles.textPreviewTitle}>Texto extraído:</Text>
                  <Text style={styles.confidenceText}>
                    Confianza: {Math.round(ocrConfidence * 100)}%
                  </Text>
                </View>
                <Text style={styles.extractedText}>{extractedText}</Text>
              </Card>
            )}
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <Card style={styles.loadingCard} padding={24}>
            <LoadingSpinner />
            <Text style={styles.loadingText}>{processingStep}</Text>
            <Text style={styles.loadingSubtext}>
              {processingStep.includes('Extrayendo') 
                ? 'Esto puede tomar unos segundos...'
                : 'Casi listo...'}
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        {!imageUri ? (
          <>
            <View style={styles.actionButton}>
              <Button
                title="📷 Tomar Foto"
                onPress={handleTakePhoto}
                fullWidth
              />
            </View>
            <View style={styles.actionButton}>
              <Button
                title="🖼️ Elegir de Galería"
                onPress={handleSelectFromGallery}
                variant="outline"
                fullWidth
              />
            </View>
            <Button
              title="Cancelar"
              onPress={() => navigation.goBack()}
              variant="outline"
              fullWidth
            />
          </>
        ) : (
          <>
            <View style={styles.actionButton}>
              <Button
                title="✨ Extraer y Analizar"
                onPress={handleExtractText}
                disabled={loading}
                loading={loading}
                fullWidth
              />
            </View>
            <View style={styles.actionButton}>
              <Button
                title="🔄 Tomar Otra Foto"
                onPress={handleRetake}
                variant="outline"
                disabled={loading}
                fullWidth
              />
            </View>
            <Button
              title="Cancelar"
              onPress={() => navigation.goBack()}
              variant="outline"
              disabled={loading}
              fullWidth
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  instructionsCard: {
    marginBottom: 24,
    backgroundColor: '#E8F5E9',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 6,
  },
  imageContainer: {
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  textPreviewCard: {
    backgroundColor: '#FFFFFF',
  },
  textPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  textPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  extractedText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButton: {
    marginBottom: 12,
  },
});
