const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// Configuration multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Routes existantes
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier uploadé' });
  }
  res.json({ 
    message: 'Fichier uploadé avec succès',
    filename: req.file.originalname 
  });
});

// Nouvel endpoint pour sauvegarder les compositions
app.post('/api/save-compositions', (req, res) => {
  try {
    const { produits } = req.body;
    
    if (!produits || !Array.isArray(produits)) {
      return res.status(400).json({ error: 'Données invalides' });
    }

    // Charger les métadonnées existantes
    const filePath = path.join(__dirname, 'public', 'produits-unifies-avec-prix.json');
    let existingData = {};
    
    if (fs.existsSync(filePath)) {
      const existingContent = fs.readFileSync(filePath, 'utf8');
      existingData = JSON.parse(existingContent);
    }

    // Créer la sauvegarde avant modification
    const backupPath = filePath.replace('.json', `_backup_${Date.now()}.json`);
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
      console.log(`Sauvegarde créée: ${backupPath}`);
    }

    // Préparer les nouvelles données
    const newData = {
      ...existingData,
      produits: produits,
      metadata: {
        ...existingData.metadata,
        date_modification: new Date().toISOString(),
        total_produits: produits.length,
        compositions: produits.filter(p => p.type === 'composition').length,
        composants: produits.filter(p => p.type === 'composant').length,
        produits_simples: produits.filter(p => p.type === 'simple').length
      }
    };

    // Sauvegarder le fichier
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
    
    console.log('Compositions sauvegardées avec succès');
    res.json({ 
      success: true, 
      message: 'Compositions sauvegardées avec succès',
      backup: backupPath
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la sauvegarde',
      details: error.message 
    });
  }
});

// Endpoint pour obtenir les statistiques des compositions
app.get('/api/compositions-stats', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'public', 'produits-unifies-avec-prix.json');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier de compositions non trouvé' });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const compositions = data.produits.filter(p => p.type === 'composition');
    
    const stats = {
      total_compositions: compositions.length,
      total_composants: compositions.reduce((sum, comp) => sum + comp.nombre_composants, 0),
      categories: [...new Set(compositions.map(c => c.categorie))],
      date_derniere_modification: data.metadata?.date_modification || 'Inconnue'
    };

    res.json(stats);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message 
    });
  }
});

// Démarrage du serveur avec gestionnaire d'erreur
const server = app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
}).on('error', (error) => {
  console.error('Erreur lors du démarrage du serveur:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Le port ${PORT} est déjà utilisé. Essayez un autre port.`);
  }
  process.exit(1);
});

// Gestionnaire pour arrêt propre
process.on('SIGINT', () => {
  console.log('\nArrêt du serveur...');
  server.close(() => {
    console.log('Serveur arrêté.');
    process.exit(0);
  });
});
