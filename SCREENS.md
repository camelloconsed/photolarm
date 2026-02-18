# Screens - Pantallas de la Aplicación

## 📋 Overview

4 pantallas principales del flujo MVP de Photolarm con navegación React Navigation.

**Pantallas implementadas:**
1. **HomeScreen** - Vista principal con próximas alarmas
2. **TextImportScreen** - Importar texto médico
3. **ResultsScreen** - Revisar planes extraídos
4. **PreviewScheduleScreen** - Vista previa de alarmas generadas

---

## 🎯 Flujo de Usuario

```
HomeScreen
    ↓ (+) Botón
TextImportScreen
    ↓ Extraer
ResultsScreen
    ↓ Generar Alarmas
PreviewScheduleScreen
    ↓ Confirmar
HomeScreen (con alarmas)
```

---

## 📱 HomeScreen

### Características
- ✅ Lista de próximas alarmas (10 max)
- ✅ Alerta de alarmas pendientes
- ✅ Pull to refresh
- ✅ Quick stats (próximas, hora despertar, desayuno)
- ✅ Botón (+) para importar
- ✅ Estado vacío con call-to-action

### Interacciones
- **Complete** - Marca alarma como completada
- **Snooze** - Pospone 10 minutos
- **Toggle** - Activa/desactiva alarma
- **Refresh** - Actualiza lista
- **Add** - Navega a TextImport

### Props
```typescript
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
```

### Stores usados
- `useSchedulesStore` - getUpcomingAlarms, getPendingAlarms, markAlarmCompleted, snoozeAlarm, toggleAlarmEnabled
- `usePreferencesStore` - preferences

---

## 📱 TextImportScreen

### Características
- ✅ Input multilínea para texto
- ✅ Botón de ejemplo para demo
- ✅ Card informativa sobre qué importar
- ✅ Validación en tiempo real
- ✅ Loading state durante extracción
- ✅ Error handling con alerts
- ✅ KeyboardAvoidingView para iOS

### Flujo
1. Usuario pega/escribe texto médico
2. Click en "Extraer alarmas"
3. MockExtractorService procesa el texto
4. Planes se guardan en PlansStore
5. Navega a Results con planIds

### Props
```typescript
type Props = NativeStackScreenProps<RootStackParamList, 'TextImport'>;
```

### Ejemplo de texto
```
Amoxicilina 500mg cada 8 horas por 7 días con comida
Ibuprofeno 400mg cada 6 horas si hay dolor
Cita médica 25/12/2025 10:00am
```

### Stores usados
- `usePlansStore` - addPlans
- `usePreferencesStore` - preferences

---

## 📱 ResultsScreen

### Características
- ✅ Lista de planes extraídos con PlanCard
- ✅ Selección de plan (uno a la vez)
- ✅ Badge visual de "Seleccionado"
- ✅ Eliminar planes
- ✅ Generación de schedule al confirmar
- ✅ Manejo de planes fixed y flexible

### Flujo
1. Recibe planIds por parámetros
2. Muestra planes con PlanCard
3. Usuario selecciona un plan
4. Click en "Generar alarmas"
5. Llama a generateFixedSchedule o generateFlexibleSchedule
6. Schedule se guarda en SchedulesStore
7. Navega a PreviewSchedule

### Props
```typescript
type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

// Route params
{ planIds: string[] }
```

### Stores usados
- `usePlansStore` - plans, deletePlan
- `useSchedulesStore` - addSchedule
- `usePreferencesStore` - preferences

---

## 📱 PreviewScheduleScreen

### Características
- ✅ Summary card con estadísticas
- ✅ Info del anchor (now / recommended)
- ✅ Lista completa de alarmas
- ✅ Fechas formateadas en español
- ✅ Confirmación final
- ✅ Opción de cancelar todo

### Flujo
1. Recibe scheduleId por parámetros
2. Muestra resumen (total, fecha inicio, fecha fin, anchor)
3. Lista todas las alarmas
4. Usuario confirma
5. Alert de éxito
6. Navega a Home

### Props
```typescript
type Props = NativeStackScreenProps<RootStackParamList, 'PreviewSchedule'>;

// Route params
{ scheduleId: string }
```

### Stores usados
- `useSchedulesStore` - getScheduleById, deleteSchedule

---

## 🗺️ Navegación

### Stack Navigator
```typescript
export type RootStackParamList = {
  Home: undefined;
  TextImport: undefined;
  Results: { planIds: string[] };
  PreviewSchedule: { scheduleId: string };
};
```

### Configuración
```tsx
<Stack.Navigator
  initialRouteName="Home"
  screenOptions={{
    headerShown: false, // Headers custom en cada screen
    contentStyle: { backgroundColor: '#F2F2F7' },
  }}
>
  <Stack.Screen name="Home" component={HomeScreen} />
  <Stack.Screen
    name="TextImport"
    component={TextImportScreen}
    options={{ presentation: 'modal' }} // Modal en iOS
  />
  <Stack.Screen name="Results" component={ResultsScreen} />
  <Stack.Screen name="PreviewSchedule" component={PreviewScheduleScreen} />
</Stack.Navigator>
```

---

## 🎨 Design Patterns

### SafeAreaView
Todas las pantallas usan `SafeAreaView` de `react-native-safe-area-context`:
```tsx
<SafeAreaView style={styles.container} edges={['top']}>
  {/* content */}
</SafeAreaView>
```

### Bottom Actions Bar
Patrón consistente para acciones primarias:
```tsx
<View style={styles.actions}>
  <Button title="Cancelar" variant="outline" />
  <View style={styles.actionSpacer} />
  <Button title="Continuar" variant="primary" fullWidth />
</View>
```

### Error Handling
```tsx
try {
  // operación async
} catch (error) {
  const message = error instanceof Error ? error.message : 'Error genérico';
  Alert.alert('Error', message);
}
```

---

## 📝 Archivos

- `src/screens/HomeScreen.tsx` (300+ líneas)
- `src/screens/TextImportScreen.tsx` (250+ líneas)
- `src/screens/ResultsScreen.tsx` (250+ líneas)
- `src/screens/PreviewScheduleScreen.tsx` (280+ líneas)
- `src/screens/index.ts` (exports)
- `App.tsx` (configuración navegación)

---

## 🧪 Testing

### Navigation Testing
```tsx
import { NavigationContainer } from '@react-navigation/native';
import { render } from '@testing-library/react-native';

test('HomeScreen renders', () => {
  const { getByText } = render(
    <NavigationContainer>
      <HomeScreen />
    </NavigationContainer>
  );
  
  expect(getByText('Photolarm 👋')).toBeTruthy();
});
```

### Store Mocking
```tsx
jest.mock('@/store', () => ({
  useSchedulesStore: () => ({
    getUpcomingAlarms: jest.fn(() => []),
    getPendingAlarms: jest.fn(() => []),
  }),
}));
```

---

## 🚀 Próximos Pasos

1. **Agregar más pantallas**:
   - SettingsScreen (configurar preferencias)
   - PlanDetailsScreen (editar plan)
   - AlarmHistoryScreen (historial)

2. **Mejorar UX**:
   - Animaciones con Reanimated
   - Gestos (swipe to delete)
   - Skeleton loaders

3. **Agregar funcionalidad**:
   - Photo import con cámara
   - PDF import
   - QR scan

---

## ✅ Status

**COMPLETADO** ✅

- ✅ 4 pantallas principales
- ✅ Navegación completa
- ✅ Integración con Stores
- ✅ Error handling
- ✅ Loading states
- ✅ Empty states
- ✅ Type-safe navigation
- ✅ Zero TypeScript errors

**Próximo paso:** Scheduler Service (expo-notifications)
