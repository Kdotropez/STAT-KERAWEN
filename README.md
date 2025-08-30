# 📊 Application d'Analyse de Ventes

Application React/TypeScript pour l'analyse complète des données de ventes avec gestion des compositions de produits.

## 🚀 Fonctionnalités

### 📈 Analyse des Ventes
- **Import Excel/JSON** : Conversion automatique des fichiers de ventes
- **Mapping de colonnes** : Interface intuitive pour mapper les colonnes Excel
- **Statistiques détaillées** : Par produit, catégorie, boutique, période
- **Décomposition des compositions** : Analyse automatique des produits composés

### 🎯 Tableau de Bord
- **Vue simplifiée** : Tableau de bord épuré par jour/ticket
- **Vue détaillée** : Détails complets des opérations
- **Filtres avancés** : Par date, numéro d'opération, catégorie
- **Export de données** : Export JSON des analyses

### 📦 Gestion des Compositions
- **Import de compositions** : Fichiers Excel de décomposition
- **Gestion des composants** : Ajout, modification, suppression
- **Prix des composants** : Gestion des prix à zéro pour les composants
- **Unification des références** : Système de référence unifiée

### 🔍 Détail des Opérations
- **Groupement flexible** : Par jour, semaine, mois, opération
- **Numéros d'opération** : Affichage et filtrage par #Op
- **Articles détaillés** : Vue complète des articles par opération
- **Interface cliquable** : Clic sur numéro d'opération pour détails

## 🛠️ Technologies

- **Frontend** : React 18 + TypeScript
- **UI** : Material-UI (MUI) v5
- **Gestion d'état** : React Hooks (useState, useEffect, useMemo)
- **Stockage** : LocalStorage pour la persistance
- **Import/Export** : Excel.js pour la lecture de fichiers
- **Déploiement** : Vercel

## 📁 Structure du Projet

```
src/
├── components/
│   ├── Stats/                    # Composants de statistiques
│   │   ├── DailyOperationsDetails.tsx
│   │   ├── StatisticsOverview.tsx
│   │   └── TimeBasedStats.tsx
│   ├── Mapping/                  # Mapping des colonnes Excel
│   │   └── ColumnMapping.tsx
│   └── CompositionManager/       # Gestion des compositions
│       └── CompositionManager.tsx
├── services/
│   ├── StatisticsService.ts      # Service de calcul des statistiques
│   ├── JsonImportService.ts      # Import des données JSON
│   ├── fileHandling/             # Gestion des fichiers
│   │   └── excelService.ts
│   └── dataProcessing/           # Traitement des données
│       └── compositionService.ts
├── types/
│   └── index.ts                  # Interfaces TypeScript
└── utils/
    └── formatters.ts             # Fonctions de formatage
```

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 16+ 
- npm ou yarn

### Installation
```bash
# Cloner le repository
git clone [URL_DU_REPO]

# Installer les dépendances
npm install

# Démarrer en mode développement
npm start
```

### Build de Production
```bash
# Construire l'application
npm run build

# Tester la build
npm run test
```

## 📊 Utilisation

### 1. Import des Données
1. **Fichier de ventes** : Importer un fichier Excel de ventes
2. **Mapping des colonnes** : Associer les colonnes Excel aux champs internes
3. **Conversion JSON** : Le fichier est automatiquement converti

### 2. Analyse des Statistiques
- **Vue d'ensemble** : Statistiques globales et tendances
- **Vente par produit** : Analyse détaillée par article
- **Vente par catégorie** : Regroupement par catégories
- **Détail des opérations** : Vue par jour/ticket avec filtres

### 3. Gestion des Compositions
- **Import de compositions** : Charger les fichiers de décomposition
- **Gestion des composants** : Modifier les compositions existantes
- **Prix des composants** : Définir les prix à zéro pour les composants

## 🔧 Configuration

### Variables d'Environnement
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_STORAGE_KEY=sales_analysis_data
```

### LocalStorage
L'application utilise le localStorage pour :
- **Données de ventes** : Persistance des fichiers importés
- **Configurations** : Mappings de colonnes, préférences
- **Compositions** : Stockage des compositions de produits

## 📈 Fonctionnalités Avancées

### Filtres et Recherche
- **Filtre par date** : Sélection d'une journée spécifique
- **Filtre par opération** : Recherche par numéro d'opération
- **Vue simplifiée** : Tableau de bord épuré
- **Combinaison de filtres** : Utilisation simultanée des filtres

### Export et Sauvegarde
- **Export JSON** : Données d'analyse au format JSON
- **Sauvegarde automatique** : Persistance dans le navigateur
- **Restauration** : Chargement automatique des données

## 🐛 Dépannage

### Problèmes Courants
1. **Erreur d'import Excel** : Vérifier le format du fichier
2. **Données manquantes** : Contrôler le mapping des colonnes
3. **Performance lente** : Réduire la taille des fichiers importés

### Logs de Debug
L'application inclut des logs détaillés dans la console pour :
- **Import de données** : Suivi du processus d'import
- **Calculs statistiques** : Validation des calculs
- **Gestion des compositions** : Traçabilité des modifications

## 🤝 Contribution

### Développement
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de Code
- **TypeScript** : Utilisation stricte des types
- **ESLint** : Respect des règles de linting
- **Prettier** : Formatage automatique du code
- **Tests** : Tests unitaires pour les services

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- **Issues GitHub** : Créer une issue détaillée
- **Documentation** : Consulter ce README
- **Logs** : Vérifier la console du navigateur

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024  
**Auteur** : Équipe de développement
