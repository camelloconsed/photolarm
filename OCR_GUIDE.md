# 📸 Guía de OCR - Google ML Kit (GRATIS)

## ✅ Implementación con ML Kit Text Recognition

Photolarm usa **@react-native-ml-kit/text-recognition** - OCR de Google **100% GRATUITO** on-device.

### 🎯 Características

- ✅ **100% GRATIS PARA SIEMPRE** - No requiere API key ni tarjeta de crédito
- ✅ **Offline** - Procesa en el dispositivo, no envía datos a internet
- ✅ **Sin límites de uso** - Ilimitado porque todo es local
- ✅ **Alta precisión** - Misma tecnología que usa Google Lens
- ✅ **Rápido** - ML Kit optimizado para móviles
- ✅ **Compatible con Expo** - Via development build

### ⚠️ NO confundir con Google Cloud Vision

- **Google ML Kit** = GRATIS, on-device, sin internet ✅ (esto es lo que usamos)
- **Google Cloud Vision API** = PAGO, cloud, $1.50/1000 imágenes ❌ (NO lo usamos)

---

## 🚀 Ventajas de ML Kit sobre Tesseract

**Por qué ML Kit es mejor que Tesseract para React Native:**

1. **Funciona en React Native** - Tesseract.js requiere Web Workers (no disponible en RN)
2. **Más rápido** - Optimizado por Google para dispositivos móviles
3. **Mejor precisión** - Tecnología de última generación
4. **Mantenido activamente** - Google actualiza regularmente
5. **Sin descargas adicionales** - Tesseract requiere descargar archivos de idioma
6. **Compatible con Expo** - A través de development builds

---

## ⚠️ Importante: Requiere Rebuild Nativo

ML Kit usa módulos nativos, necesitas **development build**:

```bash
eas build --profile development --platform android
```

**Tiempo:** 10-15 minutos (tier gratuito: 2+ horas en cola)

---

## 📱 Cómo Funciona

### Flujo del Usuario

1. **Abrir HomeScreen** → Ver botones: 📷 (Cámara) y 📝 (Texto)
2. **Presionar 📷** → Abre CameraScreen
3. **Opciones:**
   - **📷 Tomar Foto** - Capturar con cámara
   - **🖼️ Elegir de Galería** - Seleccionar foto existente
4. **Presionar "✨ Extraer y Analizar"**
   - ML Kit extrae texto de la imagen (1-3 seg)
   - OpenAI/Mock analiza el texto
   - Navega a ResultsScreen con planes extraídos

---

## 🛠️ Arquitectura Técnica

### Componentes Creados

#### 1. **MLKitOCRService** (`src/services/ocr.service.ts`)

```typescript
import TextRecognition from '@react-native-ml-kit/text-recognition';

export class MLKitOCRService implements IOCRService {
  async extractText(imageUri: string): Promise<OCRResult> {
    const result = await TextRecognition.recognize(imageUri);
    const text = result.blocks.map(block => block.text).join('\n');
    const confidence = text.length > 10 ? 0.85 : 0.5;
    return { text: text.trim(), confidence };
  }
}

// Alias para compatibilidad con CameraScreen
export const TesseractOCRService = MLKitOCRService;
```

**Características:**
- Procesamiento on-device (sin internet)
- Soporta múltiples idiomas automáticamente (incluyendo español)
- Retorna confianza estimada basada en longitud del texto
- Extrae texto por bloques (preserva formato)

#### 2. **CameraScreen** (`src/screens/CameraScreen.tsx`)

**Estados:**
- `hasPermission` - Permisos de cámara
- `imageUri` - Foto capturada
- `extractedText` - Texto del OCR
- `loading` - Estado de procesamiento
- `processingStep` - Mensaje al usuario
- `ocrConfidence` - Confianza del OCR

**Flujo:**
```
Capturar/Seleccionar → Preview → Extraer → Analizar → Results
```

**Permisos:**
- Solicita permisos de cámara al montar
- Muestra pantalla de error si se deniegan
- Permite configurar permisos desde la app

#### 3. **Navegación Actualizada** (`App.tsx`)

```typescript
<Stack.Screen
  name="Camera"
  component={CameraScreen}
  options={{ presentation: 'modal' }}
/>
```

**HomeScreen actualizado:**
- Dos botones en header: 📷 (Cámara) y 📝 (Texto manual)
- Diseño consistente con el resto de la app

---

## 📦 Dependencias Instaladas

```json
{
  "@react-native-ml-kit/text-recognition": "latest", // Google ML Kit OCR (GRATIS)
  "expo-camera": "^16.x",                            // Camera access
  "expo-image-picker": "^16.x",                      // Gallery picker
  "expo-media-library": "^17.x"                      // Media permissions
}
```

**Nota:** ML Kit requiere development build (no funciona con Expo Go)

---

## 🎨 UX/UI

### Estados Visuales

1. **Sin Foto:**
   - Instrucciones con consejos (iluminación, claridad)
   - Botones: "Tomar Foto" / "Elegir de Galería"
   - Card verde con tips

2. **Con Foto:**
   - Preview de imagen (300px altura)
   - Botón principal: "✨ Extraer y Analizar"
   - Botón secundario: "🔄 Tomar Otra Foto"

3. **Procesando:**
   - Loading spinner
   - Mensaje: "Extrayendo texto..." / "Analizando información médica..."
   - Subtexto: "Esto puede tomar unos segundos..."

4. **Texto Extraído:**
   - Card blanco con texto
   - Badge de confianza: "Confianza: 85%"
   - Scroll si el texto es largo

### Mensajes de Error

**No se detectó texto:**
```
"No pudimos extraer texto de la imagen. 
Intenta con una foto más clara."
```

**No se encontraron planes:**
```
"No pudimos identificar medicamentos o citas. 
¿Quieres editar el texto manualmente?"
[Cancelar] [Editar texto]
```

---

## ⚙️ Configuración

### Detección de Idioma

ML Kit **detecta automáticamente** el idioma del texto. No necesitas configurar nada.

Soporta: Español, Inglés, Francés, Alemán, Italiano, Portugués, y muchos más.

### Optimizar Calidad de Imagen

Editar `src/screens/CameraScreen.tsx`:

```typescript
const result = await ImagePicker.launchCameraAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 1, // 0-1 (1 = máxima calidad)
  allowsEditing: true,
  aspect: [4, 3],
});
```

**Trade-offs:**
- `quality: 1` → Mejor OCR, archivos más grandes
- `quality: 0.8` → Balance (recomendado para producción)
- `quality: 0.5` → Archivos pequeños, OCR menos preciso

---

## 🧪 Testing

### MockOCRService

Para desarrollo sin procesar imágenes reales:

```typescript
// En CameraScreen.tsx, cambiar:
const ocrService = new MockOCRService(); // ← Usa mock

// Mock siempre retorna:
return {
  text: 'Amoxicilina 500mg cada 8 horas por 7 días\nCita: 15 enero 2026 10:00am',
  confidence: 0.85
};
```

### Consejos para Testing

1. **Fotos de prueba:**
   - Recetas impresas (mejor resultado)
   - Texto claro, sin sombras
   - Buena iluminación natural

2. **Casos de prueba:**
   - ✅ Receta estándar (medicamentos + dosis)
   - ✅ Cita médica (fecha + hora)
   - ✅ Foto borrosa (debe fallar gracefully)
   - ✅ Sin texto (debe mostrar error)

---

## 🚨 Problemas Conocidos

### 1. **Requiere Development Build**
**Síntoma:** No funciona en Expo Go
**Causa:** ML Kit usa módulos nativos
**Solución:** Hacer build con EAS: `eas build --profile development --platform android`

### 2. **Texto Cursivo/Manuscrito**
**Síntoma:** No reconoce texto escrito a mano
**Causa:** ML Kit optimizado para texto impreso
**Solución:** Guiar al usuario: "Solo recetas impresas"

### 3. **Fotos Muy Borrosas**
**Síntoma:** Extrae texto incorrecto o incompleto
**Causa:** Baja calidad de imagen
**Solución:** Mostrar tips al usuario sobre iluminación y enfoque

---

## 💰 ¿Por Qué NO Usar Alternativas de Pago?

### Google Cloud Vision API ❌
**Costo:** $1.50 por 1,000 imágenes

**Por qué NO:**
- ML Kit ya tiene excelente precisión (casi igual que Cloud Vision)
- Cloud Vision requiere backend para seguridad (más complejidad)
- ML Kit funciona offline (mejor UX)
- Para MVP, **no justifica el gasto**

**Cuándo considerarlo:**
- Si usuarios reportan <80% precisión constantemente
- Cuando tengas ingresos recurrentes ($1000+/mes)
- Para casos especiales (recetas manuscritas, muy borrosas)

### AWS Textract / Azure Computer Vision ❌
**Costo similar:** $1-2 por 1,000 imágenes

**Mismo análisis:** No vale la pena con ML Kit gratis funcionando bien

---

## 📊 Métricas a Monitorear

1. **Tasa de éxito OCR:**
   - ¿Qué % de fotos extrae texto correctamente?
   - Meta: >85%

2. **Tiempo de procesamiento:**
   - ¿Cuánto tarda OCR → Extracción → Results?
   - Meta: <15 segundos

3. **Confianza promedio:**
   - ¿Qué confianza reporta Tesseract?
   - Meta: >70% promedio

4. **Errores comunes:**
   - ¿Qué tipos de fotos fallan más?
   - Usar para mejorar instrucciones al usuario

---

## 🎓 Recursos

- **ML Kit Text Recognition:** https://github.com/react-native-ml-kit/text-recognition
- **Google ML Kit Docs:** https://developers.google.com/ml-kit/vision/text-recognition
- **Expo Camera:** https://docs.expo.dev/versions/latest/sdk/camera/
- **Expo Image Picker:** https://docs.expo.dev/versions/latest/sdk/imagepicker/

---

## ✅ Checklist de Producción

Antes de lanzar a producción:

- [ ] Probar con 10+ recetas reales diferentes
- [ ] Verificar permisos en iOS y Android
- [ ] Optimizar `quality` para balance tamaño/precisión
- [ ] Agregar analytics para éxito/fallo OCR
- [ ] Documentar tipos de recetas compatibles
- [ ] Agregar botón "Reportar problema con OCR"
- [ ] A/B test: Tesseract vs Google Vision (si hay presupuesto)

---

## 🎯 Resumen: ¿Por Qué ML Kit?

| Característica | ML Kit | Tesseract.js | react-native-tesseract-ocr | Google Cloud Vision |
|---|---|---|---|---|
| **Precio** | ✅ GRATIS | ✅ GRATIS | ✅ GRATIS | ❌ $1.50/1000 |
| **Funciona en RN** | ✅ Sí | ❌ No (Web Workers) | ⚠️ Build falló | ✅ Sí |
| **Offline** | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No |
| **Precisión** | ✅ Excelente | ⚠️ Buena | ⚠️ Buena | ✅ Excelente |
| **Velocidad** | ✅ 1-3 seg | ⚠️ 5-10 seg | ⚠️ 5-10 seg | ⚠️ 2-5 seg + latencia |
| **Compatible Expo** | ✅ Dev build | ❌ No | ⚠️ Incompatible SDK 54 | ✅ Sí |
| **Mantenimiento** | ✅ Google oficial | ⚠️ Comunidad | ❌ Abandonado | ✅ Google oficial |

**Veredicto:** ML Kit es la **mejor opción gratis** para React Native + Expo.

---

**Última actualización:** 9 de enero de 2026
**Versión:** 1.1.0 - MVP con Google ML Kit (GRATIS)
