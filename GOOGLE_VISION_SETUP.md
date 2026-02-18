# 🔍 Google Cloud Vision API - Guía de Implementación

## ⚠️ Contexto

**Tesseract.js NO funciona en React Native** porque requiere Web Workers (solo disponible en navegadores).

Para OCR real en producción, necesitas usar **Google Cloud Vision API**.

---

## 💰 Costos

- **Gratis:** Primeras 1,000 imágenes/mes
- **Después:** $1.50 por cada 1,000 imágenes
- **Costo real estimado:**
  - 100 usuarios × 20 fotos/mes = 2,000 fotos = **$1.50/mes**
  - 1,000 usuarios × 20 fotos/mes = 20,000 fotos = **$30/mes**

**Conclusión:** Súper económico para una app médica.

---

## 🛠️ Implementación en 3 Pasos

### Paso 1: Configurar Google Cloud (5 min)

1. **Crear proyecto en Google Cloud Console:**
   - Ve a: https://console.cloud.google.com
   - Crear nuevo proyecto: "photolarm"

2. **Habilitar Vision API:**
   - En el menú, buscar "Vision API"
   - Click "Habilitar"

3. **Crear API Key:**
   - APIs & Services → Credentials
   - Create Credentials → API Key
   - Copiar la key: `AIza...`

4. **Configurar billing:**
   - Billing → Link billing account
   - Agregar tarjeta de crédito
   - No te cobrarán hasta superar 1,000 imágenes/mes

---

### Paso 2: Crear Backend Proxy (Seguridad)

**IMPORTANTE:** NO pongas tu API key directamente en la app (usuarios podrían robarla).

Crea un backend simple que haga las llamadas por ti:

```javascript
// backend/server.js (Node.js + Express)
const express = require('express');
const vision = require('@google-cloud/vision');
const app = express();

const client = new vision.ImageAnnotatorClient({
  keyFilename: './google-credentials.json' // Tu key aquí
});

app.post('/api/ocr', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    
    const [result] = await client.textDetection({
      image: { content: imageBase64 }
    });
    
    const text = result.fullTextAnnotation?.text || '';
    
    res.json({ 
      text,
      confidence: 0.9 // Google no retorna confidence para OCR
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

**Deploy opciones:**
- Vercel (gratis hasta 100GB bandwidth)
- Railway (gratis $5/mes crédito)
- Render (gratis tier)

---

### Paso 3: Implementar en la App

```typescript
// src/services/ocr.service.ts

export class GoogleVisionOCRService implements IOCRService {
  private apiUrl = 'https://tu-backend.vercel.app/api/ocr';
  
  async extractText(imageUri: string): Promise<OCRResult> {
    try {
      // 1. Convertir imagen a base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // 2. Enviar a tu backend
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'OCR failed');
      }
      
      return {
        text: data.text,
        confidence: data.confidence,
      };
    } catch (error) {
      console.error('Google Vision OCR error:', error);
      throw new Error('No se pudo extraer texto de la imagen');
    }
  }
}
```

**Actualizar CameraScreen:**
```typescript
// Cambiar de MockOCRService a GoogleVisionOCRService
const ocrService = new GoogleVisionOCRService();
```

---

## 🧪 Testing

### Con MockOCRService (actual):
```typescript
const ocrService = new MockOCRService(); // ✅ Funciona ahora
```

### Con Google Vision (producción):
```typescript
const ocrService = new GoogleVisionOCRService(); // 🚀 Para lanzamiento
```

---

## 📊 Alternativas

### 1. **AWS Textract**
- Precio similar a Google Vision
- Mejor para documentos complejos
- Más caro: $1.50 por 1,000 páginas

### 2. **Azure Computer Vision**
- $1.00 por 1,000 transacciones
- Ligeramente más barato
- Menos documentación

### 3. **OCR.space API**
- Gratis: 25,000 requests/mes
- Menor calidad que Google
- Bueno para MVP

---

## 🎯 Recomendación

**Para MVP:** Usa **MockOCRService** (actual)
- Valida product-market fit
- Sin costos
- UX completa funcional

**Para Lanzamiento:** Implementa **Google Vision**
- 1,000 imágenes gratis/mes
- Solo pagas si tienes tracción
- Mejor calidad de OCR

**Timeline sugerido:**
1. Semana 1-2: Desarrollar con MockOCRService ✅ (ACTUAL)
2. Semana 3: Implementar Google Vision backend
3. Semana 4: Testing con fotos reales
4. Lanzamiento: Contar usuarios y revisar costos

---

## 📝 Checklist de Implementación

### Backend (2-3h):
- [ ] Crear proyecto Node.js
- [ ] Instalar @google-cloud/vision
- [ ] Configurar credentials
- [ ] Endpoint POST /api/ocr
- [ ] Deploy a Vercel/Railway
- [ ] Probar con Postman

### App (1-2h):
- [ ] Instalar expo-file-system
- [ ] Crear GoogleVisionOCRService
- [ ] Convertir imagen a base64
- [ ] Llamar a backend
- [ ] Manejar errores
- [ ] Testing con fotos reales

### Seguridad:
- [ ] NO poner API key en la app
- [ ] Usar backend proxy
- [ ] Rate limiting en backend
- [ ] Validar tamaño de imagen
- [ ] CORS configurado correctamente

---

## 🚨 Problemas Comunes

### Error: "API key not valid"
**Solución:** Verifica que habilitaste Vision API en Google Cloud Console

### Error: "Quota exceeded"
**Solución:** Superaste 1,000 imágenes gratis. Revisa billing.

### Imagen muy grande
**Solución:** Reduce calidad en ImagePicker:
```typescript
quality: 0.7, // En vez de 1
```

### Backend muy lento
**Solución:** 
- Optimiza calidad de imagen antes de enviar
- Usa CDN para distribución global
- Cachea resultados si la imagen no cambia

---

## 💡 Optimizaciones Futuras

### 1. **Cache de resultados**
```typescript
// Si usuario vuelve a escanear la misma receta
const cached = await getCachedOCR(imageHash);
if (cached) return cached;
```

### 2. **Preprocessing de imagen**
```typescript
// Mejorar contraste antes de OCR
import { manipulateAsync } from 'expo-image-manipulator';

const processed = await manipulateAsync(
  imageUri,
  [{ rotate: 0 }, { flip: FlipType.Vertical }],
  { compress: 0.8 }
);
```

### 3. **Batch processing**
```typescript
// Procesar múltiples páginas juntas
const results = await Promise.all(
  images.map(img => ocrService.extractText(img))
);
```

---

**Última actualización:** 8 de enero de 2026  
**Próximo paso:** Implementar backend proxy para Google Vision
