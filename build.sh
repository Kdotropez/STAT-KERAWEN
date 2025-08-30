#!/bin/bash

# Script de build personnalisé pour Vercel
echo "🚀 Début du build personnalisé..."

# Vérifier que les fichiers nécessaires sont présents
echo "📁 Vérification des fichiers nécessaires..."

if [ ! -f "public/index.html" ]; then
    echo "❌ ERREUR: public/index.html manquant!"
    exit 1
fi

if [ ! -f "public/manifest.json" ]; then
    echo "❌ ERREUR: public/manifest.json manquant!"
    exit 1
fi

if [ ! -f "public/favicon.ico" ]; then
    echo "❌ ERREUR: public/favicon.ico manquant!"
    exit 1
fi

echo "✅ Tous les fichiers nécessaires sont présents"

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Build de l'application
echo "🔨 Build de l'application..."
npm run build

echo "✅ Build terminé avec succès!"
