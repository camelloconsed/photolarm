# 🤖 OpenAI Integration Setup

## Configuración Rápida

1. **Obtén tu API Key de OpenAI:**
   - Ve a https://platform.openai.com/api-keys
   - Crea una nueva API key
   - Cópiala (solo se muestra una vez)

2. **Agrega tu API key al código:**
   Abre `src/screens/TextImportScreen.tsx` y busca la línea 30:
   ```typescript
   const OPENAI_API_KEY = ''; // Add your key: 'sk-proj-...'
   ```
   
   Reemplázala con:
   ```typescript
   const OPENAI_API_KEY = 'sk-proj-TU_API_KEY_AQUI';
   ```

3. **Reinicia la app:**
   - El hot reload actualizará automáticamente
   - O reinicia con `r` en la terminal de Expo

## Uso

El servicio automáticamente usa:
- ✅ **OpenAIExtractorService** si la API key está configurada
- ⚡ **MockExtractorService** si la key está vacía (desarrollo sin costo)

## Modelos disponibles

Por defecto usa `gpt-4o-mini` (rápido y económico). Puedes cambiarlo en `TextImportScreen.tsx`:

```typescript
new OpenAIExtractorService({ 
  apiKey: OPENAI_API_KEY,
  model: 'gpt-4o'  // Más preciso pero más caro
})
```

## Costos aproximados

- **gpt-4o-mini**: ~$0.0001 por extracción
- **gpt-4o**: ~$0.001 por extracción

## Testing

Para probar con textos reales médicos:
1. Copia el texto de una receta médica
2. Pégalo en "Importar Texto"
3. El servicio detectará automáticamente:
   - Planes flexibles (medicamentos)
   - Planes fixed (citas médicas)
   - Categorías correctas
   - Duraciones y frecuencias

## Troubleshooting

### Error: "Invalid API Key"
- Verifica que copiaste la key completa
- La key debe empezar con `sk-`

### Error: "Rate limit exceeded"
- Espera un momento e intenta de nuevo
- OpenAI tiene límites de tasa en el tier gratuito

### Sigue usando Mock en lugar de OpenAI
- Verifica que reiniciaste el servidor con `--clear`
- Confirma que el `.env` está en la raíz del proyecto
