import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { ReferenceService, ProduitReference } from '../../services/ReferenceService';

interface ProduitInfoProps {
  referenceService: ReferenceService;
}

const ProduitInfo: React.FC<ProduitInfoProps> = ({ referenceService }) => {
  const [searchId, setSearchId] = useState('7815');
  const [produit, setProduit] = useState<ProduitReference | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [composants, setComposants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const rechercherProduit = async () => {
    if (!searchId.trim()) {
      setError('Veuillez entrer un ID de produit');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Chercher d'abord dans les produits de référence
      const produitTrouve = referenceService.trouverProduitParId(searchId.trim());
      if (produitTrouve) {
        setProduit(produitTrouve);
      } else {
        setProduit(null);
        setError(`Aucun produit trouvé avec l'ID: ${searchId} dans le fichier de référence`);
      }

      // Chercher aussi dans les compositions
      const response = await fetch('/compositions-unifiees.json');
      const compositionsData = await response.json();
      
      const composition = compositionsData.compositions.find((comp: any) => comp.id === searchId.trim());
      if (composition) {
        setComposants(composition.composants || []);
        console.log('🔍 Composition trouvée:', composition);
      } else {
        setComposants([]);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setError('Erreur lors de la recherche des informations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Rechercher automatiquement l'ID 7815 au chargement
    rechercherProduit();
  }, []);

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', mb: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Informations Produit
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Rechercher un produit par ID
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="ID Produit"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            />
            <Button 
              variant="contained" 
              onClick={rechercherProduit}
              size="small"
              disabled={loading}
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {produit && (
          <Box>
            <Typography variant="h5" gutterBottom color="primary">
              📦 {produit.nom}
            </Typography>
            
            <Chip 
              label={`ID: ${produit.id}`} 
              color="primary" 
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            <List dense>
              {Object.entries(produit).map(([key, value]) => {
                if (key === 'id' || key === 'nom') return null; // Déjà affiché
                
                return (
                  <ListItem key={key} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}:
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {String(value)}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note :</strong> Ces informations proviennent du fichier de référence des produits.
                Si certaines données sont manquantes, vérifiez que le fichier de référence est bien chargé.
              </Typography>
            </Alert>
          </Box>
        )}

        {composants.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom color="secondary">
              🧩 Composants de l'article composé
            </Typography>
            
            <List dense>
              {composants.map((composant, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {composant.nom}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Quantité : {composant.quantite}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Décomposition :</strong> Cet article composé sera automatiquement décomposé en {composants.length} composants individuels lors du traitement des ventes.
                Chaque composant aura son propre ID et ses caractéristiques dans le fichier de référence.
              </Typography>
            </Alert>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ProduitInfo;
