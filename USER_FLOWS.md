# 🎯 Photolarm - Casos de Uso y Flujos de Usuario

**Última actualización**: 19 de diciembre de 2025

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Tipos de Alarmas](#tipos-de-alarmas)
3. [Flujo Principal](#flujo-principal)
4. [Casos de Uso Detallados](#casos-de-uso-detallados)
5. [Componentes UI por Flujo](#componentes-ui-por-flujo)
6. [Prompts de OpenAI](#prompts-de-openai)

---

## 🎯 Visión General

### Concepto Central
El usuario tiene **UN SOLO PUNTO DE ENTRADA**: botón "➕ Agregar Alarma"

Desde ahí, puede elegir el método de entrada:
- 📸 **Foto Alarma** (principal)
- 📄 **PDF Alarma**
- ✍️ **Texto Alarma**
- 📱 **QR Alarma** (B2B)

La app **automáticamente detecta** si es:
- ⏰ **Alarma Flexible** (depende de cuándo empieces)
- 📅 **Alarma Fija** (fechas y horarios específicos)

Y le presenta las opciones correctas al usuario de forma **entretenida y visual**.

---

## 🎨 Tipos de Alarmas (Naming Atractivo)

### 🔄 ALARMAS FLEXIBLES
**Eslogan**: "Empieza cuando tú quieras"

**Categorías visuales**:
1. 💊 **Salud** - Medicamentos, tratamientos
2. 🍳 **Cocina** - Recetas, horneados, tiempos de cocción
3. 🏋️ **Fitness** - Rutinas de ejercicio, descansos
4. 🌱 **Hábitos** - Beber agua, meditar, estudiar
5. ⏱️ **Temporizadores** - Tareas con intervalos

**Ejemplos**:
- "Amoxicilina 500mg cada 8 horas por 7 días"
- "Hervir agua 20 minutos, reposar 10 minutos"
- "Hacer ejercicio 3 veces al día"
- "Beber agua cada 2 horas"

---

### 📅 ALARMAS FIJAS
**Eslogan**: "En la fecha y hora exacta"

**Categorías visuales**:
1. 🏥 **Citas** - Médicas, dentista, terapias
2. 📚 **Clases** - Horario de clases, reuniones
3. 💼 **Trabajo** - Juntas, deadlines
4. 🎉 **Eventos** - Cumpleaños, aniversarios
5. 🗓️ **Calendario** - Tareas programadas

**Ejemplos**:
- "Cita con Dr. González el 25/12 a las 10:00 AM"
- "Clases de yoga: Lunes, Miércoles, Viernes 6:00 PM"
- "Reunión de equipo todos los martes 3:00 PM"

---

## 🔄 Flujo Principal de Usuario

### PASO 1: Home Screen
```
┌─────────────────────────────────┐
│      🏠 Photolarm               │
├─────────────────────────────────┤
│                                 │
│  📋 Próximas Alarmas           │
│  ┌─────────────────────────┐   │
│  │ 💊 Amoxicilina          │   │
│  │ 🕐 Hoy 2:00 PM          │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ 🏥 Dr. González         │   │
│  │ 📅 25 Dic 10:00 AM      │   │
│  └─────────────────────────┘   │
│                                 │
│         [➕ Agregar]            │
│                                 │
└─────────────────────────────────┘
```

**Al presionar "➕ Agregar"**:
→ Bottom sheet con opciones de entrada

---

### PASO 2: Selección de Método de Entrada

```
┌─────────────────────────────────┐
│  ¿Cómo quieres crear la alarma? │
├─────────────────────────────────┤
│                                 │
│  ┌───────────┐  ┌───────────┐  │
│  │     📸    │  │     📄    │  │
│  │   Foto    │  │    PDF    │  │
│  │  Alarma   │  │  Alarma   │  │
│  └───────────┘  └───────────┘  │
│                                 │
│  ┌───────────┐  ┌───────────┐  │
│  │     ✍️     │  │     📱    │  │
│  │   Texto   │  │    QR     │  │
│  │  Alarma   │  │  Alarma   │  │
│  └───────────┘  └───────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Usuario elige**: 📸 **Foto Alarma** (caso más común)

---

### PASO 3: Captura de Imagen

```
┌─────────────────────────────────┐
│      📸 Foto Alarma             │
├─────────────────────────────────┤
│                                 │
│    [Vista de cámara activa]     │
│                                 │
│         🔦 [Flash]              │
│                                 │
│                                 │
│         ⭕ [Capturar]           │
│                                 │
└─────────────────────────────────┘
```

**Después de capturar**:
→ Pantalla de revisión

---

### PASO 4: Revisión de Foto

```
┌─────────────────────────────────┐
│      ✅ Revisar Foto            │
├─────────────────────────────────┤
│                                 │
│    [Preview de la foto]         │
│                                 │
│    "Receta Médica               │
│     Amoxicilina 500mg           │
│     Cada 8 horas..."            │
│                                 │
├─────────────────────────────────┤
│  [🔄 Retocar]  [✓ Usar esta]   │
└─────────────────────────────────┘
```

**Usuario confirma**:
→ Procesamiento con OpenAI (OCR + Extracción)

---

### PASO 5: Procesamiento (Loading)

```
┌─────────────────────────────────┐
│      🔮 Analizando...           │
├─────────────────────────────────┤
│                                 │
│         [Spinner animado]       │
│                                 │
│   "Extrayendo texto de imagen"  │
│   "Identificando alarmas..."    │
│   "Preparando tu plan..."       │
│                                 │
└─────────────────────────────────┘
```

**OpenAI responde**:
```json
{
  "mode": "flexible",
  "category": "health",
  "plans": [{...}]
}
```

---

### PASO 6A: Resultado - FLEXIBLE

```
┌─────────────────────────────────┐
│      💊 Plan de Salud           │
├─────────────────────────────────┤
│  Amoxicilina 500mg              │
│  📦 Cada 8 horas por 7 días     │
│                                 │
│  🎯 ¿Cuándo empiezas?           │
│                                 │
│  ┌───────────────────────────┐ │
│  │  ⚡ AHORA MISMO           │ │
│  │  Comenzar inmediatamente   │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  🕐 ELEGIR HORA           │ │
│  │  Tú decides cuándo         │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  ⭐ HORA RECOMENDADA      │ │
│  │  Optimizada para descanso  │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Usuario elige**: ⭐ **Hora Recomendada**

---

### PASO 6A.1: Recomendación de IA

```
┌─────────────────────────────────┐
│      ⭐ Hora Recomendada        │
├─────────────────────────────────┤
│                                 │
│  🌙 Basado en tu horario de     │
│     sueño (11:00 PM - 7:00 AM)  │
│                                 │
│  💡 Sugerimos empezar:          │
│                                 │
│     🕐 7:00 AM                  │
│                                 │
│  📋 Tus alarmas serán:          │
│     • 7:00 AM                   │
│     • 3:00 PM                   │
│     • 11:00 PM                  │
│                                 │
│  ✅ Sin interrumpir tu sueño    │
│                                 │
├─────────────────────────────────┤
│  [← Cambiar]  [✓ Confirmar]    │
└─────────────────────────────────┘
```

---

### PASO 6B: Resultado - FIJA

```
┌─────────────────────────────────┐
│      🏥 Citas Médicas           │
├─────────────────────────────────┤
│  Dr. González - Cardiología     │
│                                 │
│  📅 Detectamos estas fechas:    │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📆 Lunes 25 Dic           │ │
│  │ 🕐 10:00 AM               │ │
│  │ 📍 Hospital Central        │ │
│  └───────────────────────────┘ │
│                                 │
│  🔔 Recordatorios:              │
│  ☐ 1 día antes                  │
│  ☑ 1 hora antes                 │
│  ☐ 15 minutos antes             │
│                                 │
├─────────────────────────────────┤
│  [← Editar]  [✓ Crear Alarma]  │
└─────────────────────────────────┘
```

**Usuario confirma**:
→ Preview de todas las alarmas

---

### PASO 7: Preview Final

```
┌─────────────────────────────────┐
│      📋 Resumen de Alarmas      │
├─────────────────────────────────┤
│  21 alarmas en 7 días           │
│                                 │
│  📅 Hoy - 19 Dic                │
│  • 7:00 AM - Amoxicilina ✓     │
│  • 3:00 PM - Amoxicilina        │
│  • 11:00 PM - Amoxicilina       │
│                                 │
│  📅 Mañana - 20 Dic             │
│  • 7:00 AM - Amoxicilina        │
│  • 3:00 PM - Amoxicilina        │
│  • 11:00 PM - Amoxicilina       │
│                                 │
│  [Ver todas ↓]                  │
│                                 │
├─────────────────────────────────┤
│  [← Cancelar] [✓ Confirmar]    │
└─────────────────────────────────┘
```

**Usuario confirma**:
→ Alarmas creadas! 🎉

---

### PASO 8: Confirmación

```
┌─────────────────────────────────┐
│      🎉 ¡Listo!                 │
├─────────────────────────────────┤
│                                 │
│       ✅ Alarmas Creadas        │
│                                 │
│   21 recordatorios programados  │
│                                 │
│   Primera alarma:               │
│   🕐 Hoy a las 7:00 AM          │
│                                 │
│   [Ver en Inicio]               │
│                                 │
└─────────────────────────────────┘
```

---

## 📱 Casos de Uso Detallados

### CASO 1: 💊 Medicamento Flexible

**Input del usuario**:
- Foto de receta: "Amoxicilina 500mg, tomar cada 8 horas por 7 días"

**Respuesta de OpenAI** (JSON estructurado):
```json
{
  "mode": "flexible",
  "category": "health",
  "confidence": 0.95,
  "plans": [{
    "id": "plan_1",
    "domain": "medication",
    "mode": "flexible",
    "flexible_pattern": {
      "items": [{
        "medication_name": "Amoxicilina",
        "dosage": "500mg",
        "interval_hours": 8,
        "duration_days": 7,
        "with_meal": false
      }]
    },
    "evidence": "cada 8 horas por 7 días"
  }]
}
```

**Flujo UI**:
1. ✅ Detecta `mode: "flexible"`
2. 🎨 Muestra categoría: 💊 Salud
3. 🎯 Presenta 3 opciones de inicio:
   - ⚡ Ahora mismo
   - 🕐 Elegir hora
   - ⭐ Hora recomendada
4. 👤 Usuario elige "⭐ Hora recomendada"
5. 🤖 App calcula mejor horario (evitando sueño)
6. 📋 Preview de 21 alarmas (3/día × 7 días)
7. ✅ Usuario confirma → Alarmas creadas

---

### CASO 2: 🍳 Receta de Cocina Flexible

**Input del usuario**:
- Foto de receta: "Hervir agua 20 min, dejar reposar 10 min, hornear 45 min a 180°C"

**Respuesta de OpenAI**:
```json
{
  "mode": "flexible",
  "category": "cooking",
  "confidence": 0.92,
  "plans": [{
    "id": "plan_1",
    "domain": "cooking",
    "mode": "flexible",
    "flexible_pattern": {
      "recipe_name": "Receta",
      "steps": [
        {
          "action": "Hervir agua",
          "duration_minutes": 20
        },
        {
          "action": "Dejar reposar",
          "duration_minutes": 10
        },
        {
          "action": "Hornear",
          "duration_minutes": 45,
          "temperature": "180°C"
        }
      ]
    },
    "evidence": "Hervir agua 20 min, dejar reposar 10 min..."
  }]
}
```

**Flujo UI**:
1. 🍳 Detecta categoría: Cocina
2. 🎯 Solo muestra 2 opciones (no tiene sentido "hora recomendada"):
   - ⚡ Empezar ahora
   - 🕐 Programar para después
3. 👤 Usuario elige "⚡ Empezar ahora"
4. 📋 Preview:
   - Alarma 1: En 20 min → "Dejar reposar"
   - Alarma 2: En 30 min → "Poner en horno"
   - Alarma 3: En 75 min → "¡Listo para servir!"
5. ✅ Confirma → Alarmas secuenciales creadas

---

### CASO 3: 🏥 Cita Médica Fija

**Input del usuario**:
- Foto de orden: "Cita con Dr. González - Cardiología, Lunes 25 de Diciembre, 10:00 AM, Hospital Central"

**Respuesta de OpenAI**:
```json
{
  "mode": "fixed",
  "category": "appointment",
  "confidence": 0.98,
  "plans": [{
    "id": "plan_1",
    "domain": "appointment",
    "mode": "fixed",
    "fixed_events": [{
      "datetime": "2025-12-25T10:00:00-03:00",
      "title": "Dr. González - Cardiología",
      "location": "Hospital Central",
      "alert_before_minutes": [1440, 60, 15]
    }],
    "evidence": "Lunes 25 de Diciembre, 10:00 AM"
  }]
}
```

**Flujo UI**:
1. 🏥 Detecta `mode: "fixed"`
2. 📅 Muestra card de cita:
   - Fecha: Lunes 25 Dic
   - Hora: 10:00 AM
   - Lugar: Hospital Central
3. 🔔 Opciones de recordatorio (checkboxes):
   - ☑ 1 día antes (24 Dic 10:00 AM)
   - ☑ 1 hora antes (25 Dic 9:00 AM)
   - ☑ 15 min antes (25 Dic 9:45 AM)
4. 📋 Preview de 3 alarmas
5. ✅ Confirma → Alarmas creadas

---

### CASO 4: 📚 Horario de Clases Fijo

**Input del usuario**:
- Foto de horario: "Yoga: Lunes, Miércoles, Viernes 6:00 PM"

**Respuesta de OpenAI**:
```json
{
  "mode": "fixed",
  "category": "schedule",
  "confidence": 0.96,
  "plans": [{
    "id": "plan_1",
    "domain": "class",
    "mode": "fixed",
    "fixed_events": [{
      "title": "Yoga",
      "repeat": {
        "type": "weekly",
        "days_of_week": [1, 3, 5],
        "time": "18:00:00"
      },
      "alert_before_minutes": [30]
    }],
    "evidence": "Lunes, Miércoles, Viernes 6:00 PM"
  }]
}
```

**Flujo UI**:
1. 📚 Detecta horario recurrente
2. 📅 Muestra patrón:
   - "Cada Lunes, Miércoles, Viernes"
   - "A las 6:00 PM"
3. 🔔 Recordatorio:
   - ☑ 30 minutos antes
4. 📋 Preview de próximas 10 clases
5. ✅ Confirma → Alarmas recurrentes creadas

---

### CASO 5: 🌱 Hábito Diario Flexible

**Input del usuario**:
- Texto: "Beber agua cada 2 horas, 8 veces al día"

**Respuesta de OpenAI**:
```json
{
  "mode": "flexible",
  "category": "habit",
  "confidence": 0.90,
  "plans": [{
    "id": "plan_1",
    "domain": "hydration",
    "mode": "flexible",
    "flexible_pattern": {
      "items": [{
        "habit_name": "Beber agua",
        "times_per_day": 8,
        "interval_hours": 2
      }]
    },
    "evidence": "cada 2 horas, 8 veces al día"
  }]
}
```

**Flujo UI**:
1. 🌱 Detecta categoría: Hábito
2. 🎯 Opciones de inicio:
   - ⚡ Empezar ahora
   - ⭐ Horario saludable (evita noche)
3. 👤 Usuario elige "⭐ Horario saludable"
4. 🤖 App sugiere: 7:00 AM - 9:00 PM (cada 2h)
5. 📋 Preview de 8 alarmas diarias
6. ✅ Confirma → Hábito programado

---

## 🎨 Componentes UI por Flujo

### 1. InputMethodSheet (Bottom Sheet)
```tsx
<InputMethodSheet>
  <MethodCard
    icon="📸"
    title="Foto Alarma"
    description="Escanea un documento"
    onPress={() => navigate('Camera')}
  />
  <MethodCard
    icon="📄"
    title="PDF Alarma"
    description="Importa un PDF"
    onPress={() => navigate('PDFImport')}
  />
  <MethodCard
    icon="✍️"
    title="Texto Alarma"
    description="Escribe o pega texto"
    onPress={() => navigate('TextImport')}
  />
  <MethodCard
    icon="📱"
    title="QR Alarma"
    description="Escanea código QR"
    onPress={() => navigate('QRScan')}
  />
</InputMethodSheet>
```

---

### 2. PlanCategoryBadge
```tsx
<PlanCategoryBadge mode="flexible" category="health">
  💊 Salud
</PlanCategoryBadge>

<PlanCategoryBadge mode="fixed" category="appointment">
  🏥 Citas
</PlanCategoryBadge>

<PlanCategoryBadge mode="flexible" category="cooking">
  🍳 Cocina
</PlanCategoryBadge>
```

---

### 3. AnchorSelectionCard (FLEXIBLE)
```tsx
<AnchorSelectionCard
  icon="⚡"
  title="AHORA MISMO"
  description="Comenzar inmediatamente"
  highlighted={selected === 'now'}
  onPress={() => setAnchor('now')}
/>

<AnchorSelectionCard
  icon="🕐"
  title="ELEGIR HORA"
  description="Tú decides cuándo"
  highlighted={selected === 'custom'}
  onPress={() => setAnchor('custom')}
/>

<AnchorSelectionCard
  icon="⭐"
  title="HORA RECOMENDADA"
  description="Optimizada para descanso"
  recommended
  highlighted={selected === 'recommended'}
  onPress={() => setAnchor('recommended')}
/>
```

---

### 4. RecommendationCard
```tsx
<RecommendationCard
  sleepWindow={{ start: '23:00', end: '07:00' }}
  recommendedTime="07:00"
  alarmTimes={['07:00', '15:00', '23:00']}
  reasoning="Sin interrumpir tu sueño"
/>
```

---

### 5. FixedEventCard (FIJO)
```tsx
<FixedEventCard
  date="2025-12-25T10:00:00"
  title="Dr. González - Cardiología"
  location="Hospital Central"
  reminders={[
    { label: '1 día antes', minutes: 1440, enabled: true },
    { label: '1 hora antes', minutes: 60, enabled: true },
    { label: '15 min antes', minutes: 15, enabled: false }
  ]}
  onToggleReminder={(index) => {...}}
/>
```

---

### 6. AlarmPreviewList
```tsx
<AlarmPreviewList
  alarms={[
    { datetime: '...', title: 'Amoxicilina', enabled: true },
    // ...
  ]}
  groupedBy="day"
  onToggleAlarm={(id) => {...}}
/>
```

---

## 🤖 Prompts de OpenAI

### Prompt de Sistema (Común para todos)

```typescript
const SYSTEM_PROMPT = `
Eres un asistente experto en analizar documentos y extraer planes de alarmas/recordatorios.

Tu tarea es:
1. Leer el texto proporcionado
2. Identificar si hay alarmas/recordatorios
3. Determinar si son FIJAS (fechas/horas específicas) o FLEXIBLES (intervalos/frecuencias)
4. Categorizar por tipo (salud, cocina, citas, clases, hábitos, etc.)
5. Extraer toda la información relevante
6. Devolver un JSON estructurado válido

TIPOS DE ALARMAS:

FLEXIBLE: Dependen de cuándo el usuario comienza
- Medicamentos: "cada X horas", "X veces al día", "cada 8 horas por 7 días"
- Cocina: "hervir 20 min", "hornear 45 min"
- Hábitos: "beber agua cada 2 horas", "hacer ejercicio 3 veces al día"
- Ejercicios: "descansar 30 segundos", "repetir 4 veces"

FIJA: Fechas y horas específicas inamovibles
- Citas médicas: "25 de diciembre a las 10:00 AM"
- Clases: "lunes, miércoles, viernes 6:00 PM"
- Eventos: "cumpleaños 15 de enero"
- Reuniones: "todos los martes 3:00 PM"

CATEGORÍAS:
- health (💊): medicamentos, tratamientos
- cooking (🍳): recetas, tiempos de cocción
- appointment (🏥): citas médicas
- class (📚): clases, cursos
- habit (🌱): hábitos diarios
- fitness (🏋️): rutinas de ejercicio
- event (🎉): eventos especiales
- work (💼): tareas laborales
- other (📌): otros

Responde SIEMPRE con un JSON válido siguiendo este schema:
{
  "mode": "flexible" | "fixed",
  "category": string,
  "confidence": number (0-1),
  "plans": Array<Plan>
}

Si no detectas ningún plan de alarmas, devuelve:
{
  "mode": null,
  "category": null,
  "confidence": 0,
  "plans": []
}
`;
```

---

### Prompt de Usuario (Ejemplos)

**Para imagen (después de OCR)**:
```typescript
const userPrompt = `
Analiza este texto extraído de una imagen y extrae los planes de alarmas:

"""
${ocrText}
"""

Devuelve el JSON estructurado con los planes detectados.
`;
```

**Para texto directo**:
```typescript
const userPrompt = `
Analiza este texto y extrae los planes de alarmas:

"""
${userText}
"""

Devuelve el JSON estructurado con los planes detectados.
`;
```

---

### Ejemplos de Respuestas Esperadas

**Ejemplo 1: Medicamento**
```json
{
  "mode": "flexible",
  "category": "health",
  "confidence": 0.95,
  "plans": [{
    "id": "plan_med_1",
    "domain": "medication",
    "mode": "flexible",
    "title": "Amoxicilina 500mg",
    "flexible_pattern": {
      "items": [{
        "medication_name": "Amoxicilina",
        "dosage": "500mg",
        "interval_hours": 8,
        "duration_days": 7,
        "with_meal": false,
        "instructions": "Tomar con agua"
      }]
    },
    "evidence": "Amoxicilina 500mg cada 8 horas por 7 días",
    "confidence": 0.95,
    "metadata": {
      "source": "prescription",
      "doctor": null
    }
  }]
}
```

**Ejemplo 2: Receta Cocina**
```json
{
  "mode": "flexible",
  "category": "cooking",
  "confidence": 0.92,
  "plans": [{
    "id": "plan_cook_1",
    "domain": "cooking",
    "mode": "flexible",
    "title": "Receta de Pastel",
    "flexible_pattern": {
      "recipe_name": "Pastel",
      "steps": [
        { "action": "Precalentar horno", "duration_minutes": 10 },
        { "action": "Mezclar ingredientes", "duration_minutes": 15 },
        { "action": "Hornear", "duration_minutes": 45, "temperature": "180°C" },
        { "action": "Enfriar", "duration_minutes": 30 }
      ]
    },
    "evidence": "Precalentar 10min, mezclar 15min, hornear 45min...",
    "confidence": 0.92
  }]
}
```

**Ejemplo 3: Cita Médica**
```json
{
  "mode": "fixed",
  "category": "appointment",
  "confidence": 0.98,
  "plans": [{
    "id": "plan_appt_1",
    "domain": "appointment",
    "mode": "fixed",
    "title": "Dr. González - Cardiología",
    "fixed_events": [{
      "datetime": "2025-12-25T10:00:00-03:00",
      "title": "Dr. González - Cardiología",
      "location": "Hospital Central",
      "duration_minutes": 60,
      "alert_before_minutes": [1440, 60, 15],
      "repeat": null
    }],
    "evidence": "Lunes 25 de Diciembre, 10:00 AM, Hospital Central",
    "confidence": 0.98
  }]
}
```

**Ejemplo 4: Horario Recurrente**
```json
{
  "mode": "fixed",
  "category": "class",
  "confidence": 0.96,
  "plans": [{
    "id": "plan_class_1",
    "domain": "class",
    "mode": "fixed",
    "title": "Clase de Yoga",
    "fixed_events": [{
      "title": "Yoga",
      "time": "18:00:00",
      "duration_minutes": 60,
      "repeat": {
        "type": "weekly",
        "days_of_week": [1, 3, 5],
        "interval": 1,
        "end_date": null
      },
      "alert_before_minutes": [30]
    }],
    "evidence": "Lunes, Miércoles, Viernes 6:00 PM",
    "confidence": 0.96
  }]
}
```

---

## 🔄 Actualización de Código Existente

### Cambios Necesarios en `ResultsScreen.tsx`

**ANTES** (actual):
```tsx
// Muestra lista de planes sin categorización
<PlanCard plan={plan} onPress={...} />
```

**DESPUÉS** (nuevo):
```tsx
// Detecta modo y muestra opciones correspondientes
{plan.mode === 'flexible' ? (
  <FlexiblePlanCard
    plan={plan}
    onSelectAnchor={(type) => handleAnchorSelection(plan.id, type)}
  />
) : (
  <FixedPlanCard
    plan={plan}
    onConfigure={() => handleFixedConfiguration(plan.id)}
  />
)}
```

---

### Nuevo Componente: `FlexiblePlanCard.tsx`

```tsx
export function FlexiblePlanCard({ plan, onSelectAnchor }: Props) {
  return (
    <Card>
      {/* Header con categoría */}
      <PlanCategoryBadge mode="flexible" category={plan.category} />
      
      {/* Título y descripción */}
      <Text style={styles.title}>{plan.title}</Text>
      <Text style={styles.pattern}>
        {formatFlexiblePattern(plan.flexible_pattern)}
      </Text>
      
      {/* Opciones de ancla */}
      <Text style={styles.question}>🎯 ¿Cuándo empiezas?</Text>
      
      <AnchorSelectionCard
        icon="⚡"
        title="AHORA MISMO"
        description="Comenzar inmediatamente"
        onPress={() => onSelectAnchor('now')}
      />
      
      <AnchorSelectionCard
        icon="🕐"
        title="ELEGIR HORA"
        description="Tú decides cuándo"
        onPress={() => onSelectAnchor('custom')}
      />
      
      {/* Solo mostrar si tiene sentido para la categoría */}
      {shouldShowRecommended(plan.category) && (
        <AnchorSelectionCard
          icon="⭐"
          title="HORA RECOMENDADA"
          description="Optimizada para ti"
          recommended
          onPress={() => onSelectAnchor('recommended')}
        />
      )}
    </Card>
  );
}
```

---

### Nuevo Componente: `FixedPlanCard.tsx`

```tsx
export function FixedPlanCard({ plan, onConfigure }: Props) {
  return (
    <Card>
      {/* Header con categoría */}
      <PlanCategoryBadge mode="fixed" category={plan.category} />
      
      {/* Eventos fijos */}
      <Text style={styles.title}>{plan.title}</Text>
      
      {plan.fixed_events.map((event, idx) => (
        <FixedEventItem key={idx} event={event} />
      ))}
      
      {/* Opciones de recordatorio */}
      <Text style={styles.reminders}>🔔 Recordatorios:</Text>
      {event.alert_before_minutes?.map((minutes, idx) => (
        <ReminderCheckbox
          key={idx}
          label={formatReminderLabel(minutes)}
          checked={...}
          onToggle={...}
        />
      ))}
      
      <Button
        title="Crear Alarma"
        onPress={onConfigure}
        variant="primary"
      />
    </Card>
  );
}
```

---

## 📝 Checklist de Implementación

### Fase 1: Detección de Modo (CRÍTICO)
- [ ] Actualizar prompt de OpenAI para incluir `mode` y `category`
- [ ] Validar respuesta con Zod schema actualizado
- [ ] Testing con ejemplos de cada categoría

### Fase 2: UI Cards Entretenidas
- [ ] Crear `PlanCategoryBadge` con iconos
- [ ] Crear `FlexiblePlanCard` con opciones de ancla
- [ ] Crear `FixedPlanCard` con checkboxes de recordatorios
- [ ] Crear `AnchorSelectionCard` (botones grandes y claros)
- [ ] Crear `RecommendationCard` para mostrar sugerencias IA

### Fase 3: Lógica de Recomendación
- [ ] Implementar algoritmo de hora recomendada
- [ ] Considerar horario de sueño del usuario
- [ ] Considerar horarios de comida (si aplica)
- [ ] Mostrar reasoning al usuario

### Fase 4: Integración Completa
- [ ] Actualizar `ResultsScreen` para detectar modo
- [ ] Crear flujos separados para flexible vs fijo
- [ ] Testing end-to-end con casos reales

---

## 🎯 Próximos Pasos Inmediatos

1. **Actualizar Prompt de OpenAI** ← Empezar aquí
   - Agregar detección de modo (flexible/fixed)
   - Agregar categorización (health, cooking, etc.)
   - Testing con 10 ejemplos variados

2. **Crear Componentes Visuales**
   - `PlanCategoryBadge`
   - `AnchorSelectionCard`
   - `FlexiblePlanCard`
   - `FixedPlanCard`

3. **Actualizar ResultsScreen**
   - Detectar modo del plan
   - Renderizar card correspondiente
   - Manejar selección de ancla

4. **Testing con Usuarios**
   - Recetas médicas
   - Recetas de cocina
   - Citas médicas
   - Horarios de clases

---

**¿Listo para empezar? 🚀**

Sugerencia: Comencemos actualizando el prompt de OpenAI en `src/prompts/extractor.ts` para incluir la detección de modo y categoría. Luego creamos los componentes visuales uno por uno.

