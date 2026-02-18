/**
 * OCR Service - Extract text from images
 * 
 * Uses Google ML Kit Text Recognition for React Native
 * - Free and offline
 * - Works on device without API calls
 * - High accuracy for printed text
 */

import TextRecognition from '@react-native-ml-kit/text-recognition';

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface IOCRService {
  extractText(imageUri: string): Promise<OCRResult>;
}

/**
 * ML Kit Text Recognition Service
 * Uses Google's ML Kit for on-device OCR
 */
export class MLKitOCRService implements IOCRService {
  async extractText(imageUri: string): Promise<OCRResult> {
    try {
      const result = await TextRecognition.recognize(imageUri);
      
      // Extract all text blocks
      const text = result.blocks.map(block => block.text).join('\n');
      
      // ML Kit doesn't provide confidence per block, estimate based on result quality
      const confidence = text.length > 10 ? 0.85 : 0.5;

      return {
        text: text.trim(),
        confidence,
      };
    } catch (error) {
      console.error('ML Kit OCR extraction failed:', error);
      throw new Error('No se pudo extraer texto de la imagen');
    }
  }
}

/**
 * Mock OCR Service - For testing without real OCR
 */
export class MockOCRService implements IOCRService {
  async extractText(_imageUri: string): Promise<OCRResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Return different mock texts randomly
    const mockTexts = [
      `Paracetamol 500 mg
Tomar 1 comprimido cada 8 horas por 5 días
Administrar después de las comidas
No exceder 3 gramos diarios`,

      `Amoxicilina 500mg cada 8 horas por 7 días
Ibuprofeno 400mg cada 12 horas si hay dolor
Omeprazol 20mg en ayunas por 14 días`,

      `Paracetamol 500mg cada 8 horas por 5 días

Cita de control: 15 de enero 2026 a las 10:00am
Dr. García - Medicina General`,

      `Losartán 50mg - 1 comprimido cada 24 horas
Tomar en ayunas por tiempo prolongado

Metformina 850mg - 1 comprimido cada 12 horas
Tomar con alimentos

Control mensual de presión y glucosa`,
    ];

    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    
    return {
      text: randomText,
      confidence: 0.80 + Math.random() * 0.15,
    };
  }
}

// Export MLKitOCRService as default OCR service
export const TesseractOCRService = MLKitOCRService;
