# 🌐 APIs de IA Gratuitas para Extracción

## ✅ Opción 2: APIs Cloud Gratuitas

Si prefieres no procesar en el dispositivo, estas APIs cloud son **100% gratuitas**:

---

## 🥇 1. Hugging Face Inference API (GRATIS)

### **Mejor opción cloud gratuita**

**Qué es:**
- API gratuita para correr modelos de IA en la nube de Hugging Face
- Miles de modelos disponibles
- Sin límites estrictos (rate limit razonable)

**Ventajas:**
- ✅ **100% GRATIS** - Sin tarjeta de crédito
- ✅ **Sin configuración backend** - Llamada directa desde app
- ✅ **Miles de modelos** - Puedes elegir el mejor
- ✅ **Buena precisión** - Modelos estado del arte
- ✅ **Rate limit generoso** - ~1000 requests/día

**Desventajas:**
- ⚠️ Requiere internet
- ⚠️ Latencia ~2-5 segundos
- ⚠️ Rate limit (pero alto)

### 📦 Implementación

```bash
npm install @huggingface/inference
```

```typescript
// src/services/extractor.service.huggingface.ts
import { HfInference } from '@huggingface/inference';

export class HuggingFaceExtractorService implements IExtractorService {
  private hf: HfInference;

  constructor() {
    // API key gratuita - obtener en huggingface.co/settings/tokens
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  }

  async extractPlans(text: string, context?: ExtractorContext): Promise<DocumentParse> {
    const prompt = `Extract medication information from this medical prescription in JSON format:

Text: """
${text}
"""

Extract all medications with:
- name (medication name)
- dosage (amount and unit)
- frequency (times per day or every X hours)
- duration (number of days)

Respond ONLY with valid JSON:
{"medications": [{"name": "...", "dosage": "...", "frequency": "...", "duration_days": ...}]}`;

    try {
      // Using Flan-T5 model (free, fast, good quality)
      const response = await this.hf.textGeneration({
        model: 'google/flan-t5-large',
        inputs: prompt,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.3,
          return_full_text: false,
        },
      });

      const extracted = JSON.parse(response.generated_text);
      
      const plans = extracted.medications.map((med: any) => ({
        id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mode: 'flexible' as const,
        domain: 'medication' as const,
        category: 'health' as const,
        confidence: 0.8,
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
          extraction_model: 'huggingface-flan-t5-large',
          extraction_timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('HuggingFace API error:', error);
      return {
        success: false,
        plans: [],
        raw_text: text,
        errors: [error instanceof Error ? error.message : 'API call failed'],
        metadata: {
          extraction_model: 'huggingface-flan-t5-large',
          extraction_timestamp: new Date().toISOString(),
        },
      };
    }
  }

  private parseFrequency(frequency: string): number {
    // Parse "2 veces al día" -> 12 horas
    const vecesMatch = frequency.match(/(\d+)\s+veces?\s+(?:al|por)\s+día/i);
    if (vecesMatch) return Math.floor(24 / parseInt(vecesMatch[1]));
    
    // Parse "cada 8 horas" -> 8 horas
    const horasMatch = frequency.match(/cada\s+(\d+)\s+horas?/i);
    if (horasMatch) return parseInt(horasMatch[1]);
    
    return 24;
  }

  validate(parse: DocumentParse): string[] {
    return parse.success ? [] : ['Extraction failed'];
  }
}
```

### 🔑 Obtener API Key (GRATIS)

1. Ir a https://huggingface.co/join
2. Crear cuenta (gratis)
3. Ir a https://huggingface.co/settings/tokens
4. Crear token con permisos de "Read"
5. Copiar token

### 📝 Agregar a .env

```bash
# .env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🥈 2. Groq API (GRATIS - Llama 3)

### **Llama 3 ultra rápido y gratis**

**Qué es:**
- API cloud para Llama 3 (modelo open source de Meta)
- Velocidad insana: 500+ tokens/segundo
- 100% gratis con límites generosos

**Ventajas:**
- ✅ **100% GRATIS** - Sin tarjeta
- ✅ **Ultra rápido** - Más rápido que GPT-4
- ✅ **Llama 3** - Calidad similar a GPT-3.5
- ✅ **Rate limit generoso** - 14,400 requests/día

**Desventajas:**
- ⚠️ Requiere internet
- ⚠️ Beta (puede cambiar límites)

### 📦 Implementación

```bash
npm install groq-sdk
```

```typescript
// src/services/extractor.service.groq.ts
import Groq from 'groq-sdk';

export class GroqExtractorService implements IExtractorService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async extractPlans(text: string, context?: ExtractorContext): Promise<DocumentParse> {
    const prompt = `Eres un asistente médico que extrae información de recetas.

Texto de la receta:
"""
${text}
"""

Extrae TODOS los medicamentos con:
- Nombre del medicamento
- Dosis (cantidad y unidad)
- Frecuencia (veces al día o cada X horas)
- Duración (número de días)

Responde SOLO con JSON válido:
{"medications": [{"name": "...", "dosage": "...", "frequency": "...", "duration_days": ...}]}`;

    try {
      const response = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192', // Llama 3 8B - gratis y rápido
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const extracted = JSON.parse(content);
      
      const plans = extracted.medications.map((med: any) => ({
        id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mode: 'flexible' as const,
        domain: 'medication' as const,
        category: 'health' as const,
        confidence: 0.85,
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
          extraction_model: 'groq-llama3-8b',
          extraction_timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Groq API error:', error);
      return {
        success: false,
        plans: [],
        raw_text: text,
        errors: [error instanceof Error ? error.message : 'API call failed'],
        metadata: {
          extraction_model: 'groq-llama3-8b',
          extraction_timestamp: new Date().toISOString(),
        },
      };
    }
  }

  private parseFrequency(frequency: string): number {
    const vecesMatch = frequency.match(/(\d+)\s+veces?\s+(?:al|por)\s+día/i);
    if (vecesMatch) return Math.floor(24 / parseInt(vecesMatch[1]));
    
    const horasMatch = frequency.match(/cada\s+(\d+)\s+horas?/i);
    if (horasMatch) return parseInt(horasMatch[1]);
    
    return 24;
  }

  validate(parse: DocumentParse): string[] {
    return parse.success ? [] : ['Extraction failed'];
  }
}
```

### 🔑 Obtener API Key (GRATIS)

1. Ir a https://console.groq.com
2. Crear cuenta (gratis)
3. Generar API key
4. Copiar key

---

## 🥉 3. Together AI (GRATIS)

### **Múltiples modelos open source**

**Qué es:**
- API cloud con modelos open source (Llama, Mistral, etc)
- $25 créditos gratis al registrarse
- Después: $0.20 / millón de tokens (muy barato)

**Ventajas:**
- ✅ **$25 gratis** - ~125,000 requests
- ✅ **Múltiples modelos** - Llama, Mistral, Mixtral
- ✅ **Buena precisión**
- ✅ **Barato después** - $0.20/M tokens

### 🔑 Setup

```bash
npm install together-ai
```

```typescript
import Together from 'together-ai';

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

const response = await together.chat.completions.create({
  messages: [{ role: 'user', content: prompt }],
  model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
  temperature: 0.3,
  max_tokens: 500,
});
```

---

## 📊 Comparación de APIs Gratuitas

| API | Gratis | Rate Limit | Velocidad | Precisión | Idiomas |
|---|---|---|---|---|---|
| **Hugging Face** | ✅ ∞ | ~1000/día | ⚡⚡ | ⭐⭐⭐ | Multi |
| **Groq (Llama 3)** | ✅ ∞ | 14,400/día | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | Multi |
| **Together AI** | ✅ $25 | ~125K req | ⚡⚡⚡ | ⭐⭐⭐⭐ | Multi |
| **OpenAI GPT-4** | ❌ Pago | Ilimitado | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | Multi |

---

## 🎯 Recomendación

### Para MVP (ahora):
**Groq API (Llama 3)** - Gratis, rápido, buena calidad

### Para Producción (después):
**OpenAI GPT-4** - Mejor precisión, vale la pena si tienes ingresos

---

## 💰 Estimación de Costos

### Groq (Gratis)
- 100 usuarios × 20 fotos/mes = 2,000 requests
- **Costo: $0** ✅

### Hugging Face (Gratis)
- 100 usuarios × 20 fotos/mes = 2,000 requests
- **Costo: $0** ✅

### OpenAI GPT-4 (Futuro)
- 100 usuarios × 20 fotos/mes = 2,000 requests
- ~500 tokens/request = 1M tokens/mes
- **Costo: ~$0.50/mes** 💵

---

**Última actualización:** 9 de enero de 2026
**Recomendación:** Groq para MVP, luego OpenAI si escala
