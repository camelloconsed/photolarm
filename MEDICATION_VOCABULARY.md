# Sistema de Vocabulario de Medicamentos

## Descripción General

El sistema de reconocimiento de medicamentos combina dos fuentes de conocimiento:

1. **Vocabulario Base** (`medical-patterns.json`): Lista curada de medicamentos comunes
2. **Vocabulario Aprendido** (AsyncStorage): Medicamentos que los usuarios han confirmado o corregido

## Flujo de Funcionamiento

### 1. Extracción (OCR → Matching)

Cuando se escanea un documento:

```
Texto OCR → Fuzzy Matching → Sugerencia de Medicamento
```

- Si el texto coincide exactamente con un medicamento conocido: **Confianza = 0.8**
- Si se encuentra por similitud (>55%): **Confianza = similitud × 0.7**

### 2. Validación del Usuario

El usuario ve:
- **Alta confianza (≥70%)**: Campo normal, medicamento reconocido
- **Baja confianza (<70%)**: Campo amarillo con advertencia "verificar nombre"

El usuario puede:
- ✅ **Confirmar** sin cambiosGuarda el medicamento en vocabulario aprendido
- ✏️ **Editar y confirmar**: Guarda la versión corregida
- ❌ **Rechazar**: No guarda nada

### 3. Aprendizaje Continuo

Cada vez que se confirma un medicamento:

```typescript
{
  name: "Claritromicina",              // Nombre normalizado
  original_names: [                     // Variaciones detectadas
    "claritromocina",
    "clariyromocina"  
  ],
  times_confirmed: 3,                   // Contador de confirmaciones
  first_seen: "2026-02-17T10:30:00Z",
  last_seen: "2026-02-17T15:45:00Z"
}
```

### 4. Mejora Automática

En futuras extracciones:
- El sistema reconocerá variaciones guardadas
- Palabras comúnmente corregidas se aprenden
- El vocabulario crece con el uso

## Arquitectura

### Servicios

#### `medication-vocabulary.service.ts`
- Gestiona vocabulario aprendido
- Almacenamiento local (AsyncStorage)
- API: `saveMedication()`, `getAllKnownMedications()`, `getStats()`

#### `extractor.service.patterns.ts`
- Extrae medicamentos del texto OCR
- Usa vocabulario base + aprendido
- Implementa fuzzy matching con Levenshtein

#### `pattern-matcher.ts`
- Algoritmo de similitud (distancia de Levenshtein)
- `findClosestMedicationName()`: Busca mejor match
- Threshold configurable (por defecto 0.55)

### UI

#### `MedicationConfirmCard.tsx`
- Muestra medicamento detectado
- Permite edición de todos los campos
- Visual feedback para sugerencias (fondo amarillo)
- Advertencia cuando confianza < 70%

#### `ConfirmMedicationsScreen.tsx`
- Pantalla de validación batch
- Guarda medicamentos validados
- Integra con sistema de aprendizaje

## Roadmap

### ✅ Fase 1: Vocabulario Local (Actual)
- Fuzzy matching implementado
- Almacenamiento en AsyncStorage
- UI con feedback de confianza
- Aprendizaje por usuario individual

### 🚧 Fase 2: Base de Datos (Próximo)
- Migrar de AsyncStorage a SQLite
- Queries más eficientes
- Sincronización con backend

### 📋 Fase 3: Colaborativo (Futuro)
- Compartir vocabulario entre usuarios
- Validación comunitaria
- Privacy-first: solo con consentimiento

## Casos de Uso

### Ejemplo 1: Medicamento Conocido
```
OCR: "ibuprofeno 500 mg cada 8 horas"
Match: EXACTO → "ibuprofeno"
Confianza: 0.8
Usuario: ✅ Confirma
Resultado: Medicamento guardado (confirmación #N)
```

### Ejemplo 2: Variación OCR
```
OCR: "claritromocina 250 mg cada 12 horas"
Match: SIMILAR → "claritromicina" (78% similitud)
Confianza: 0.55
Usuario: ✏️ Edita → "claritromicina"
Resultado: Variación guardada, futuras detecciones mejorarán
```

### Ejemplo 3: Medicamento Nuevo
```
OCR: "esomeprazol 40 mg una vez al día"
Match: NO ENCONTRADO (similitud < 55%)
Resultado: No se crea alarma
Usuario: Debe agregar manualmente (futuro)
```

## Configuración

### Ajustar Threshold de Similitud

```typescript
// En extractor.service.patterns.ts
const medicationMatch = findClosestMedicationName(
  blockNormalized,
  medicationsToSearch,
  0.55  // Ajustar aquí: 0.5 = más permisivo, 0.7 = más estricto
);
```

### Ajustar Penalización de Confianza

```typescript
// En extractor.service.patterns.ts
let confidence = isSuggestedName 
  ? medicationMatch.similarity * 0.7  // Ajustar multiplicador aquí
  : 0.8;
```

## Mantenimiento

### Ver Estadísticas

```typescript
const vocabService = getMedicationVocabularyService();
const stats = await vocabService.getStats();

console.log(`Total aprendidos: ${stats.total_learned}`);
console.log(`Más comunes:`, stats.most_common);
console.log(`Recientes:`, stats.recently_added);
```

### Limpiar Vocabulario

```typescript
const vocabService = getMedicationVocabularyService();
await vocabService.removeMedication("medicamento_incorrecto");
```

## Testing

### Probar Fuzzy Matching

```typescript
import { findClosestMedicationName } from '@/lib/pattern-matcher';

const result = findClosestMedicationName(
  "claritromocina",  // Texto OCR
  ["claritromicina", "azitromicina"],  // Vocabulario
  0.55
);

console.log(result);
// { name: "claritromicina", similarity: 0.92, isExactMatch: false }
```

### Probar Servicio de Vocabulario

```typescript
const vocabService = getMedicationVocabularyService();

// Guardar
await vocabService.saveMedication("Losartán", "losartan");

// Buscar
const med = await vocabService.findLearnedMedication("Losartán");
console.log(med);
// { name: "Losartán", times_confirmed: 1, ... }
```

## Preguntas Frecuentes

### ¿Por qué algunos medicamentos no se detectan?

Tres razones principales:
1. **Similitud muy baja** (< 55%): OCR muy incorrecto
2. **Medicamento no está en vocabulario**: Ni en base ni aprendido
3. **Falta contexto**: Sin dosis o frecuencia, se omite

### ¿Cómo agrego medicamentos manualmente?

Actualmente: Escanear un documento que lo contenga y confirmarlo.
Futuro (Fase 2): Botón "Agregar medicamento" en configuración.

### ¿Los medicamentos aprendidos se sincronizan?

Actualmente: No, son locales por dispositivo.
Futuro (Fase 3): Sincronización opcional con cuenta de usuario.

### ¿Puedo exportar mi vocabulario?

Actualmente: No hay UI para esto.
Manualmente: Los datos están en AsyncStorage bajo la key `@photolarm_medication_vocab:learned_medications`.

## Referencias

- [Levenshtein Distance](https://en.wikipedia.org/wiki/Levenshtein_distance)
- [Fuzzy String Matching](https://en.wikipedia.org/wiki/Approximate_string_matching)
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
