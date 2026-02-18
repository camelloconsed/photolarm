# UI Components - Componentes Reutilizables

## 📋 Overview

Biblioteca de componentes UI para Photolarm con diseño iOS nativo.

**7 componentes principales:**
1. **Button** - Botón con variantes y estados
2. **Card** - Tarjeta contenedora con sombra
3. **Input** - Campo de texto con validación
4. **AlarmCard** - Tarjeta especializada para alarmas
5. **PlanCard** - Tarjeta especializada para planes
6. **EmptyState** - Estado vacío con ilustración
7. **LoadingSpinner** - Indicador de carga

---

## 🎨 Características

✅ **Design System iOS** - Siguiendo Human Interface Guidelines  
✅ **Type-Safe** - 100% TypeScript  
✅ **Accesible** - Touch targets optimizados  
✅ **Responsive** - Funciona en todos los tamaños de pantalla  
✅ **Dark Mode Ready** - (Pendiente de implementar)  

---

## 📦 Button

### Props
```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}
```

### Uso
```tsx
import { Button } from '@/components';

// Primary button
<Button title="Continuar" onPress={handleContinue} />

// Outline variant
<Button 
  title="Cancelar" 
  onPress={handleCancel} 
  variant="outline" 
/>

// Loading state
<Button 
  title="Guardando..." 
  onPress={handleSave} 
  loading={true} 
/>

// Full width
<Button 
  title="Iniciar" 
  onPress={handleStart} 
  fullWidth 
/>
```

### Variantes
- **primary** - Azul (#007AFF)
- **secondary** - Púrpura (#5856D6)
- **outline** - Transparente con borde
- **danger** - Rojo (#FF3B30)

---

## 📦 Card

### Props
```typescript
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
  padding?: number;
}
```

### Uso
```tsx
import { Card } from '@/components';

// Basic card
<Card>
  <Text>Contenido</Text>
</Card>

// Custom padding
<Card padding={24}>
  <Text>Más espacio</Text>
</Card>

// No shadow
<Card elevated={false}>
  <Text>Sin sombra</Text>
</Card>
```

---

## 📦 Input

### Props
```typescript
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

### Uso
```tsx
import { Input } from '@/components';

// Basic input
<Input 
  label="Email"
  placeholder="tu@email.com"
  value={email}
  onChangeText={setEmail}
/>

// With validation
<Input 
  label="Contraseña"
  placeholder="••••••••"
  secureTextEntry
  error={passwordError}
  value={password}
  onChangeText={setPassword}
/>

// With helper text
<Input 
  label="Teléfono"
  helperText="Incluye código de área"
  keyboardType="phone-pad"
/>

// With icons
<Input 
  placeholder="Buscar..."
  leftIcon={<SearchIcon />}
  rightIcon={<ClearIcon />}
/>
```

---

## 📦 AlarmCard

### Props
```typescript
interface AlarmCardProps {
  alarm: Alarm;
  onComplete?: () => void;
  onSnooze?: () => void;
  onToggle?: () => void;
  showActions?: boolean;
}
```

### Uso
```tsx
import { AlarmCard } from '@/components';
import { useSchedulesStore } from '@/store';

function AlarmsList() {
  const alarms = useSchedulesStore((s) => s.getUpcomingAlarms(10));
  const { markAlarmCompleted, snoozeAlarm, toggleAlarmEnabled } = useSchedulesStore();

  return alarms.map(alarm => (
    <AlarmCard
      key={alarm.id}
      alarm={alarm}
      onComplete={() => markAlarmCompleted(alarm.plan_id, alarm.id)}
      onSnooze={() => snoozeAlarm(alarm.plan_id, alarm.id, 10)}
      onToggle={() => toggleAlarmEnabled(alarm.plan_id, alarm.id)}
    />
  ));
}
```

### Características
- Muestra hora en grande (32px)
- Fecha formateada en español
- Estados: completada, pendiente, deshabilitada
- Actions: completar, snooze (+10 min), toggle
- Badge de estado visual

---

## 📦 PlanCard

### Props
```typescript
interface PlanCardProps {
  plan: Plan;
  onPress?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}
```

### Uso
```tsx
import { PlanCard } from '@/components';
import { usePlansStore } from '@/store';

function PlansList() {
  const plans = usePlansStore((s) => s.plans);
  const deletePlan = usePlansStore((s) => s.deletePlan);
  const navigation = useNavigation();

  return plans.map(plan => (
    <PlanCard
      key={plan.id}
      plan={plan}
      onPress={() => navigation.navigate('PlanDetails', { planId: plan.id })}
      onDelete={() => deletePlan(plan.id)}
    />
  ));
}
```

### Características
- Badge de dominio con color (💊 Medicación, 📅 Cita, etc.)
- Badge de modo (📍 Fijo / 🔄 Flexible)
- Descripción automática del patrón
- Warning si confidence < 80%
- Muestra evidencia original
- Actions: ver detalles, eliminar

---

## 📦 EmptyState

### Props
```typescript
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

### Uso
```tsx
import { EmptyState } from '@/components';

// No alarms
<EmptyState
  icon="📭"
  title="No tienes alarmas"
  description="Importa un documento médico para comenzar"
  actionLabel="Importar ahora"
  onAction={() => navigation.navigate('Import')}
/>

// No plans
<EmptyState
  icon="📄"
  title="Sin planes activos"
  description="Tus planes médicos aparecerán aquí"
/>
```

---

## 📦 LoadingSpinner

### Props
```typescript
interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}
```

### Uso
```tsx
import { LoadingSpinner } from '@/components';

// Inline spinner
<LoadingSpinner size="small" />

// With message
<LoadingSpinner 
  message="Extrayendo información..." 
/>

// Full screen
<LoadingSpinner 
  fullScreen 
  message="Generando alarmas..."
/>
```

---

## 🎨 Design Tokens

### Colores
```typescript
const COLORS = {
  // Primary
  primary: '#007AFF',      // iOS Blue
  secondary: '#5856D6',    // iOS Purple
  danger: '#FF3B30',       // iOS Red
  success: '#34C759',      // iOS Green
  warning: '#FF9500',      // iOS Orange
  
  // Neutrals
  black: '#1C1C1E',
  gray: '#8E8E93',
  lightGray: '#C7C7CC',
  background: '#F2F2F7',
  white: '#FFFFFF',
};
```

### Typography
```typescript
const TYPOGRAPHY = {
  // Sizes
  small: 12,
  body: 14,
  title: 16,
  heading: 18,
  large: 20,
  display: 32,
  
  // Weights
  regular: '400',
  semibold: '600',
  bold: '700',
};
```

### Spacing
```typescript
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};
```

### Border Radius
```typescript
const RADIUS = {
  small: 8,
  medium: 12,
  large: 16,
  round: 999,
};
```

---

## 🧪 Testing

### Unit Tests
```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components';

test('Button calls onPress when tapped', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <Button title="Test" onPress={onPress} />
  );
  
  fireEvent.press(getByText('Test'));
  expect(onPress).toHaveBeenCalled();
});

test('Button shows loading state', () => {
  const { getByTestId } = render(
    <Button title="Test" onPress={() => {}} loading />
  );
  
  expect(getByTestId('activity-indicator')).toBeTruthy();
});
```

---

## 📝 Archivos

- `src/components/Button.tsx` - Botón reutilizable
- `src/components/Card.tsx` - Tarjeta contenedora
- `src/components/Input.tsx` - Campo de texto
- `src/components/AlarmCard.tsx` - Tarjeta de alarma
- `src/components/PlanCard.tsx` - Tarjeta de plan
- `src/components/EmptyState.tsx` - Estado vacío
- `src/components/LoadingSpinner.tsx` - Spinner de carga
- `src/components/index.ts` - Exports centralizados

---

## 🚀 Próximos Pasos

1. Agregar **Dark Mode** support
2. Crear **TimePicker** component para horarios
3. Crear **DatePicker** component para fechas
4. Agregar **Modal** component
5. Agregar **BottomSheet** component
6. Tests unitarios con Jest

---

## ✅ Status

**COMPLETADO** ✅

- ✅ 7 componentes principales
- ✅ Type-safe 100%
- ✅ Design system iOS
- ✅ Documentación completa
- ✅ Zero TypeScript errors

**Próximo paso:** Screens (Step 7)
