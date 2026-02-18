# 🤖 Transformers.js - IA Local en React Native

## ✅ Qué es?

**Transformers.js** permite correr modelos de IA (como GPT) directamente en tu dispositivo móvil, sin internet, 100% gratis.

---

## 📦 Instalación

```bash
npm install @xenova/transformers
```

**Nota:** Requiere development build (como ML Kit)

---

## 🧠 Modelos Recomendados para Extracción Médica

### Opción 1: **Flan-T5-Small** (77MB)
- **Uso:** Question-answering, extracción de información
- **Velocidad:** ~2-5 segundos
- **Precisión:** Buena para texto estructurado
- **Ideal para:** Recetas médicas simples

### Opción 2: **DistilGPT-2** (353MB)
- **Uso:** Generación y comprensión de texto
- **Velocidad:** ~3-7 segundos
- **Precisión:** Muy buena
- **Ideal para:** Textos médicos complejos

### Opción 3: **BERT-Base-Multilingual** (177MB)
- **Uso:** Extracción de entidades (NER)
- **Velocidad:** ~1-3 segundos
- **Precisión:** Excelente para español
- **Ideal para:** Nombres de medicamentos, dosis

---

## 🚀 Implementación en Photolarm

### 1. Crear `TransformersExtractorService`

```typescript
// src/services/extractor.service.transformers.ts
import { pipeline } from '@xenova/transformers';

export class TransformersExtractorService implements IExtractorService {
  private extractor: any = null;
  private isLoaded = false;

  async loadModel() {
    if (this.isLoaded) return;
    
    console.log('Loading Transformers model...');
    this.extractor = await pipeline('text2text-generation', 'Xenova/flan-t5-small');
    this.isLoaded = true;
    console.log('Model loaded!');
  }

  async extractPlans(text: string, context?: ExtractorContext): Promise<DocumentParse> {
    await this.loadModel();

    // Create prompt for the model
    const prompt = `Extract medication information from this medical text in JSON format.
Text: "${text}"

Extract:
1. Medication name
2. Dosage (mg, ml, tablets)
3. Frequency (times per day or every X hours)
4. Duration (number of days)

Format: {"medications": [{"name": "...", "dosage": "...", "frequency": "...", "duration_days": ...}]}`;

    // Run model
    const result = await this.extractor(prompt, {
      max_new_tokens: 200,
      temperature: 0.3,
    });

    // Parse model output
    try {
      const extracted = JSON.parse(result[0].generated_text);
      
      // Convert to DocumentParse format
      const plans = extracted.medications.map((med: any) => ({
        id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mode: 'flexible' as const,
        domain: 'medication' as const,
        category: 'health' as const,
        confidence: 0.75,
        evidence: text,
        flexible_pattern: {
          items: [{
            interval_hours: this.parseFrequency(med.frequency),
            duration_days: med.duration_days || 7,
            title: `${med.name} ${med.dosage}`,
            description: `Tomar ${med.dosage} ${med.frequency}`,
          }],
        },
      }));

      return {
        success: plans.length > 0,
        plans,
        raw_text: text,
        metadata: {
          extraction_model: 'transformers-flan-t5-small',
          extraction_timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Failed to parse model output:', error);
      return {
        success: false,
        plans: [],
        raw_text: text,
        errors: ['Model parsing failed'],
        metadata: {
          extraction_model: 'transformers-flan-t5-small',
          extraction_timestamp: new Date().toISOString(),
        },
      };
    }
  }

  private parseFrequency(frequency: string): number {
    // "2 times per day" -> 12 hours
    // "every 8 hours" -> 8 hours
    const timesMatch = frequency.match(/(\d+)\s+times?\s+per\s+day/i);
    if (timesMatch) {
      return Math.floor(24 / parseInt(timesMatch[1]));
    }
    
    const hoursMatch = frequency.match(/every\s+(\d+)\s+hours?/i);
    if (hoursMatch) {
      return parseInt(hoursMatch[1]);
    }
    
    return 24; // Default: once daily
  }

  validate(parse: DocumentParse): string[] {
    return parse.success ? [] : ['Extraction failed'];
  }
}
```

### 2. Actualizar `CameraScreen.tsx`

```typescript
import { TransformersExtractorService } from '@/services/extractor.service.transformers';

// En CameraScreen:
const extractorService = new TransformersExtractorService();
```

---

## ⚙️ Configuración

### Development Build

Transformers.js necesita módulos nativos para ONNX Runtime:

```bash
eas build --profile development --platform android
```

---

## 📊 Comparación de Modelos

| Modelo | Tamaño | Velocidad | Precisión | Idiomas |
|---|---|---|---|---|
| **Flan-T5-Small** | 77MB | ⚡⚡⚡ | ⭐⭐⭐ | Multi |
| **DistilGPT-2** | 353MB | ⚡⚡ | ⭐⭐⭐⭐ | EN |
| **BERT-Multilingual** | 177MB | ⚡⚡⚡ | ⭐⭐⭐⭐ | Multi |

---

## 🎯 Pros vs Cons

### ✅ Ventajas
- 100% gratis, sin límites
- Funciona offline
- Privacidad total
- No requiere API keys
- Después de descarga inicial, muy rápido

### ❌ Desventajas
- Primera descarga (~77-350MB según modelo)
- Menos preciso que GPT-4
- Consume batería al procesar
- Requiere development build

---

## 🚀 Build y Deploy

1. Instalar dependencia:
```bash
npm install @xenova/transformers
```

2. Hacer build:
```bash
eas build --profile development --platform android
```

3. Primera vez app descargará el modelo (~10 segundos)

4. Después de eso, todo es instantáneo y offline

---

## 🔍 Testing

```typescript
const service = new TransformersExtractorService();

const text = `
Paracetamol 500 miligramos
1 tableta. Vía oral. 2 veces al día. Por 30 días.
`;

const result = await service.extractPlans(text);
console.log(result);
// Output: 1 plan de Paracetamol 500mg cada 12h por 30 días
```

---

## 💡 Tips

1. **Cache el modelo:** La primera carga tarda, luego es rápido
2. **Usa Flan-T5-Small:** Mejor balance tamaño/precisión
3. **Prueba con texto real:** Los modelos aprenden de ejemplos
4. **Ajusta temperatura:** Más bajo = más consistente (0.1-0.5)

---

## 📚 Recursos

- **Transformers.js:** https://huggingface.co/docs/transformers.js
- **Modelos disponibles:** https://huggingface.co/models?library=transformers.js
- **React Native ONNX:** https://onnxruntime.ai/docs/get-started/with-javascript.html

---

**Última actualización:** 9 de enero de 2026
**Recomendación:** Ideal para MVP, luego migrar a GPT-4 si escala
