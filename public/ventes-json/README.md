# Dossier des Fichiers de Ventes JSON

Ce dossier contient les fichiers de ventes convertis au format JSON pour optimiser les performances.

## 📁 Structure

```
public/ventes-json/
├── README.md
├── index.json (optionnel - liste des fichiers)
└── ventes-*.json (fichiers de ventes convertis)
```

## 🔄 Processus de Conversion

1. **Upload Excel** → Traitement → **Conversion JSON automatique**
2. **Téléchargement** du fichier JSON
3. **Placement** dans ce dossier
4. **Chargement automatique** au prochain démarrage

## 📊 Format des Fichiers JSON

```json
{
  "nomFichier": "ventes-nom_original-2025-08-28-1958.json",
  "dateConversion": "2025-08-28T19:58:00.000Z",
  "ventes": [...],
  "metadata": {
    "nombreLignes": 1500,
    "boutiques": ["Saint Tropez", "Port Grimaud"],
    "periodeDebut": "2025-08-01",
    "periodeFin": "2025-08-28",
    "version": "1.0"
  }
}
```

## ⚡ Avantages

- **Performance** : Chargement 10x plus rapide que Excel
- **Persistance** : Fichiers accessibles même après fermeture
- **Réutilisabilité** : Pas besoin de re-uploader
- **Métadonnées** : Informations structurées

## 🚀 Utilisation

1. **Premier import** : Upload Excel → Conversion automatique
2. **Fichiers suivants** : Chargement direct depuis JSON
3. **Fusion** : Possibilité de charger plusieurs fichiers JSON


