#!/bin/bash

# 📱 Photolarm iOS Build Helper Script
# Este script facilita el proceso de build para iOS

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Photolarm - iOS Development Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar si EAS CLI está instalado
if ! command -v eas &> /dev/null; then
    echo "📦 EAS CLI no encontrado. Instalando..."
    npm install -g eas-cli
    echo "✅ EAS CLI instalado"
    echo ""
else
    echo "✅ EAS CLI ya instalado"
    eas --version
    echo ""
fi

# Verificar si el usuario está logueado
echo "🔐 Verificando sesión de Expo..."
if ! eas whoami &> /dev/null; then
    echo "⚠️  No estás logueado en Expo"
    echo "📝 Iniciando sesión..."
    eas login
    echo "✅ Sesión iniciada"
    echo ""
else
    echo "✅ Ya estás logueado como: $(eas whoami)"
    echo ""
fi

# Mostrar información del proyecto
echo "📋 Información del proyecto:"
echo "   Nombre: Photolarm"
echo "   Bundle ID: com.photolarm.app"
echo "   Platform: iOS"
echo "   Profile: development"
echo ""

# Preguntar si quiere continuar
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "¿Quieres iniciar el build? (y/n): " -n 1 -r
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Build cancelado"
    exit 0
fi

echo ""
echo "🏗️  Iniciando build de iOS..."
echo "⏱️  Esto tomará ~10-15 minutos"
echo ""

# Ejecutar el build
eas build --platform ios --profile development

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Build completado!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Próximos pasos:"
echo "   1. Abre el link en Safari en tu iPhone"
echo "   2. Toca 'Install'"
echo "   3. Confía en el perfil en Ajustes → General"
echo "   4. Abre la app y escanea el QR del dev server"
echo ""
echo "🔥 Para iniciar el dev server:"
echo "   npx expo start --dev-client"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
