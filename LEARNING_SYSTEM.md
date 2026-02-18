# 🎓 Sistema de Aprendizaje Incremental - Photolarm

## 📋 Resumen

Sistema que aprende de las validaciones del usuario para mejorar la precisión de extracción de medicamentos con el tiempo. **100% local**, sin necesidad de IA/ML costosa.

## 🔄 Flujo de Usuario

```
┌─────────────┐
│ Escanear    │ Usuario toma foto de receta médica
│ Receta      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ OCR         │ Tesseract extrae texto
│ Extracción  │ "ibuprofeno x 6 dias cada 8 horas"
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Pattern     │ Busca en patrones aprendidos
│ Matching    │ ¿Hay match similar? (similarity > 0.75)
└──────┬──────┘
       │
       ├─────── SÍ ────▶ Pre-llena valores del patrón (confidence alta)
       │
       └─────── NO ────▶ Usa dictionaries (confidence media)
       │
       ▼
┌─────────────────────────────────────────────────┐
│ 📝 Validación del Usuario                       │
│                                                  │
│ ┌────────────────────────────────────────────┐ │
│ │ "ibuprofeno x 6 dias cada 8 horas"        │ │
│ │                                            │ │
│ │ Medicamento:    [Ibuprofeno      ▼]       │ │
│ │ Dosis:          [500 mg          ▼]       │ │
│ │ Frecuencia:     [8 horas         ▼]       │ │
│ │ Duración:       [6 días          ▼]       │ │
│ │                                            │ │
│ │ Confianza: ████████░░ 85%                 │ │
│ │                                            │ │
│ │ [❌ Rechazar]        [✅ Confirmar]       │ │
│ └────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────┘
                   │
       ┌───────────┴────────────┐
       │                        │
       ▼                        ▼
  Usuario confirma        Usuario corrige
  (sin cambios)          (modifica valores)
       │                        │
       ▼                        ▼
┌─────────────┐         ┌─────────────┐
│ Confirmación│         │ Corrección  │
│ +1          │         │ +1          │
└──────┬──────┘         └──────┬──────┘
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
         ┌─────────────────┐
         │ Guardar Patrón  │
         │ Actualizar      │
         │ Confidence      │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Generar Alarmas │
         └─────────────────┘
```

## 💾 Estructura de Datos

### Patrón Aprendido

```typescript
{
  id: "pattern_1708012800000_abc123",
  
  // Frase original
  raw_phrase: "ibuprofeno x 6 dias cada 8 horas",
  normalized_phrase: "ibuprofeno x 6 dias cada 8 horas", // sin acentos
  tokens: ["ibuprofeno", "x", "6", "dias", "cada", "8", "horas"],
  
  // Valores validados
  extracted: {
    medication_name: "Ibuprofeno",
    frequency_hours: 8,
    duration_days: 6,
    dosage: "500 mg",
    administration: "oral"
  },
  
  // Metadata de aprendizaje
  learning: {
    confirmations: 5,        // Usuario confirmó 5 veces
    corrections: 1,          // Usuario corrigió 1 vez
    confidence: 0.87,        // 5/(5+1) + bonus por volumen
    first_seen: "2026-02-15T10:00:00.000Z",
    last_validated: "2026-02-15T14:30:00.000Z"
  },
  
  // Para matching
  pattern_signature: "MED_CONN_NUM_TIME_FREQ_NUM_TIME",
  similarity_threshold: 0.85  // Más confianza = más estricto
}
```

## 📈 Evolución de Confianza

### Ejemplo Real

**Primera vez** (sin patrón aprendido):
```
Input: "ibuprofeno x 6 dias cada 8 horas"
Match: ❌ No encontrado
Confidence inicial: 0.5 (dictionaries)
→ Usuario confirma sin cambios
→ Nuevo pattern: confirmations=1, corrections=0
→ Confidence: 1.0
```

**Segunda vez** (frase similar):
```
Input: "ibuprofeno cada 8 horas x 6 dias"
Match: ✅ Encontrado (similarity: 0.92)
Pre-llena: ibuprofeno, 8h, 6d, 500mg
Confidence: 0.88 (del patrón existente)
→ Usuario confirma sin cambios
→ Actualizar pattern: confirmations=2, corrections=0
→ Confidence: 1.0
```

**Tercera vez** (con typo OCR):
```
Input: "ilbuprofeno x 5 dlas cada 8 hrs"
Match: ✅ Encontrado (similarity: 0.78)
Pre-llena: ibuprofeno, 8h, 5d, 500mg
Confidence: 0.92
→ Usuario corrige: días=6 (no 5)
→ Actualizar pattern: confirmations=2, corrections=1
→ Confidence: 0.83 (2/(2+1) + 0.06 bonus)
```

**Cuarta vez** (frase idéntica):
```
Input: "ibuprofeno x 6 dias cada 8 horas"
Match: ✅ Exacto (similarity: 1.0)
Pre-llena con alta confianza
→ Usuario confirma
→ confirmations=3, corrections=1
→ Confidence: 0.87
```

## 🎯 Algoritmos Clave

### 1. Similitud de Levenshtein

Calcula la "distancia de edición" entre dos strings:

```
"ibuprofeno x 6 dias" vs "ilbuprofeno x 6 dlas"
Distancia: 2 caracteres (l→i, l→i)
Length: 20
Similarity: 1 - (2/20) = 0.90 (90%)
```

### 2. Pattern Signature

Genera un "fingerprint" de la estructura:

```
["ibuprofeno", "x", "6", "dias", "cada", "8", "horas"]
↓
"MED_CONN_NUM_TIME_FREQ_NUM_TIME"
```

Permite matchear frases con misma estructura pero diferentes valores.

### 3. Confidence Score

```typescript
confidence = (confirmations / (confirmations + corrections)) + volumeBonus
```

- Ratio puro: ¿cuántas veces fue correcto?
- Volume bonus: más validaciones = más confiable (max +20%)

### 4. Similarity Threshold Adaptativo

```typescript
threshold = 0.70 + (confidence * 0.20)
```

| Confidence | Threshold | Descripción |
|-----------|-----------|-------------|
| 0.50 | 0.70 | Acepta variaciones amplias |
| 0.75 | 0.85 | Balance |
| 0.95 | 0.90 | Muy estricto |

## 📊 Estadísticas del Sistema

```typescript
useLearnedPatternsStore.getState().getStats()
```

Retorna:
```json
{
  "total_patterns": 45,
  "total_validations": 127,
  "avg_confidence": 0.84,
  "most_reliable_patterns": [
    {
      "medication_name": "Ibuprofeno",
      "confidence": 0.95,
      "validations": 12
    },
    {
      "medication_name": "Paracetamol",
      "confidence": 0.92,
      "validations": 8
    }
  ],
  "recent_validations": 23
}
```

## 🚀 Casos de Uso

### Caso 1: Usuario regular con misma receta mensual

```
Mes 1: Confidence 0.5 → Usuario corrige varias veces → Confidence 0.7
Mes 2: Confidence 0.7 → Usuario confirma → Confidence 0.85
Mes 3: Confidence 0.85 → Usuario confirma → Confidence 0.92
Mes 4+: Prácticamente automático, solo confirma
```

### Caso 2: Diferentes formatos de la misma medicación

```
"ibuprofeno 600mg cada 8 horas por 5 dias"
"ibuprofeno cada 8h x 5d"
"Ibuprofeno 600 mg - 3 veces al día - 5 días"
```

El sistema aprende a reconocer todas estas variaciones como el mismo medicamento.

### Caso 3: OCR imperfecto

```
OCR: "ilbuprofeno x 6 dlas cada 8 hrs"
Pattern match: "ibuprofeno x 6 dias cada 8 horas" (similarity 0.78)
→ Corrige automáticamente nombres y typos comunes
```

## 🔮 Futuro: Sincronización en la Nube (Fase 2)

```
┌─────────────┐
│ Dispositivo │──┬──▶ AWS S3 / DynamoDB
│ Usuario 1   │  │
└─────────────┘  │
                 │
┌─────────────┐  │    ┌──────────────────┐
│ Dispositivo │──┼───▶│ Base de Datos    │
│ Usuario 2   │  │    │ Compartida       │
└─────────────┘  │    │                  │
                 │    │ • Patrones globales
┌─────────────┐  │    │ • Anónimos       │
│ Dispositivo │──┘    │ • Agregados      │
│ Usuario N   │       └──────────────────┘
└─────────────┘
```

Beneficios:
- Patrones compartidos entre usuarios (anónimos)
- "Sabiduría colectiva"
- Mejora continua sin ML costoso
- Privacidad preservada (no se comparte información personal)

## 📝 Archivos del Sistema

```
src/
├── types/
│   └── learned-patterns.ts          ← Tipos TypeScript
├── lib/
│   └── pattern-matcher.ts           ← Algoritmos (Levenshtein, etc.)
├── store/
│   └── learned-patterns.store.ts    ← Zustand store + AsyncStorage
├── components/
│   └── MedicationConfirmCard.tsx    ← UI de validación
└── screens/
    └── ConfirmMedicationsScreen.tsx ← Pantalla de validación
```

## 🎯 Métricas de Éxito

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Confidence promedio | > 0.80 | - |
| Validaciones sin cambios | > 70% | - |
| Tiempo de validación | < 10s | - |
| Patrones aprendidos | > 20 | 0 |

## 💡 Tips de Uso

### Para Usuarios:
1. **Confirma siempre**: Incluso si está perfecto, confirmar ayuda al sistema
2. **Corrige con precisión**: Valores correctos mejoran el aprendizaje
3. **Rechaza solo si necesario**: Mejor corregir que rechazar

### Para Desarrolladores:
1. Monitor confidence en logs: `console.log('Confidence:', pattern.learning.confidence)`
2. Exportar/importar patrones para testing
3. Reset store si es necesario: `clearAllPatterns()`

## 🔍 Debug Commands

```typescript
// Ver todos los patrones
useLearnedPatternsStore.getState().patterns

// Ver stats
useLearnedPatternsStore.getState().getStats()

// Exportar para backup
useLearnedPatternsStore.getState().exportPatterns()

// Clear all
useLearnedPatternsStore.getState().clearAllPatterns()
```

---

**Estado actual**: ✅ Sistema base implementado (Fase 1: Local)
**Siguiente paso**: AWS sync (Fase 2)
