import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { VenteLigne } from '../../types';
import CompositionService from '../../services/CompositionService';

const DecompositionTest: React.FC = () => {
  const [ventesOriginales, setVentesOriginales] = useState<VenteLigne[]>([]);
  const [ventesDecomposees, setVentesDecomposees] = useState<VenteLigne[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compositionService, setCompositionService] = useState<CompositionService | null>(null);
  const [afficherComposants, setAfficherComposants] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const chargerDonneesTest = async () => {
    setLoading(true);
    setError(null);

    try {
      // Charger le service de composition
      const service = new CompositionService();
      await service.chargerCompositions();
      setCompositionService(service);

      // Charger les données de test
      const response = await fetch('/test-ventes-data.json');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const testData = await response.json();
      
      // Convertir en VenteLigne
      const ventes: VenteLigne[] = testData.data.map((row: any[]) => ({
        date: row[0],
        boutique: row[1],
        id: row[2],
        produit: row[3],
        quantite: parseInt(row[4]),
        prix_ttc: parseFloat(row[5]),
        montantTTC: parseFloat(row[6]),
        prix_achat: 0,
        tva: 0,
        mode_paiement: 'Carte bancaire',
        caissier: 'Test',
        commande: 'TEST001'
      }));

      setVentesOriginales(ventes);
      console.log('✅ Données de test chargées:', ventes);
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const testerDecomposition = async () => {
    if (!compositionService || ventesOriginales.length === 0) {
      setError('Veuillez d\'abord charger les données de test');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Début du test de décomposition...');
      console.log('📊 Ventes originales:', ventesOriginales);
      
      // Effectuer la décomposition
      const resultatDecomposition = await compositionService.decomposerVentes(ventesOriginales);
      
      setVentesDecomposees(resultatDecomposition.ventes);
      console.log('✅ Décomposition terminée:', resultatDecomposition.ventes);
      console.log('📊 Composants ajoutés:', resultatDecomposition.composantsAjoutes);
      
    } catch (err) {
      console.error('❌ Erreur lors de la décomposition:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const getCompositionInfo = (id: string) => {
    if (!compositionService) return null;
    return compositionService.trouverCompositionParId(id);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlayArrowIcon />
          Test de Décomposition avec Cumul
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Test de la décomposition des produits composés avec cumul des quantités des composants vendus séparément.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={chargerDonneesTest}
            disabled={loading}
          >
            Charger les données de test
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={testerDecomposition}
            disabled={loading || ventesOriginales.length === 0}
          >
            Tester la décomposition
          </Button>

          {ventesDecomposees.length > 0 && (
            <Button
              variant={afficherComposants ? "contained" : "outlined"}
              startIcon={afficherComposants ? <VisibilityOffIcon /> : <VisibilityIcon />}
              onClick={() => setAfficherComposants(!afficherComposants)}
              color="warning"
            >
              {afficherComposants ? "Masquer" : "Afficher"} les composants (0€)
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Ventes originales */}
      {ventesOriginales.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ventes Originales ({ventesOriginales.length} lignes)
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Boutique</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Produit</TableCell>
                  <TableCell>Quantité</TableCell>
                  <TableCell>Prix TTC</TableCell>
                  <TableCell>Montant TTC</TableCell>
                  <TableCell>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventesOriginales.map((vente, index) => {
                  const composition = getCompositionInfo(vente.id);
                  return (
                    <TableRow key={index} hover>
                      <TableCell>{vente.boutique}</TableCell>
                      <TableCell>
                        <Chip 
                          label={vente.id} 
                          size="small" 
                          color={composition ? "secondary" : "default"}
                        />
                      </TableCell>
                      <TableCell>{vente.produit}</TableCell>
                      <TableCell>{vente.quantite}</TableCell>
                      <TableCell>{formatPrice(vente.prix_ttc)}</TableCell>
                      <TableCell>{formatPrice(vente.montantTTC)}</TableCell>
                      <TableCell>
                        {composition ? (
                          <Chip 
                            label="Composé" 
                            size="small" 
                            color="secondary" 
                            variant="outlined"
                          />
                        ) : (
                          <Chip 
                            label="Simple" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Ventes décomposées */}
      {ventesDecomposees.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ventes Après Décomposition ({ventesDecomposees.length} lignes totales)
            {!afficherComposants && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                ({ventesDecomposees.filter(v => v.prix_ttc > 0).length} lignes visibles)
              </Typography>
            )}
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Boutique</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Produit</TableCell>
                  <TableCell>Quantité</TableCell>
                  <TableCell>Prix TTC</TableCell>
                  <TableCell>Montant TTC</TableCell>
                  <TableCell>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventesDecomposees
                  .filter(vente => {
                    // Si l'option est désactivée, masquer les composants (prix = 0€)
                    if (!afficherComposants && vente.prix_ttc === 0) {
                      return false;
                    }
                    return true;
                  })
                  .map((vente, index) => {
                  const composition = getCompositionInfo(vente.id);
                  const isComposant = vente.prix_ttc === 0 && composition;
                  const isOriginal = ventesOriginales.find(v => v.id === vente.id && v.quantite === vente.quantite);
                  
                  return (
                    <TableRow 
                      key={index} 
                      hover
                      sx={{ 
                        backgroundColor: isComposant ? 'warning.light' : 
                                       isOriginal ? 'success.light' : 'inherit'
                      }}
                    >
                      <TableCell>{vente.boutique}</TableCell>
                      <TableCell>
                        <Chip 
                          label={vente.id} 
                          size="small" 
                          color={isComposant ? "warning" : 
                                 composition ? "secondary" : "default"}
                        />
                      </TableCell>
                      <TableCell>{vente.produit}</TableCell>
                      <TableCell>{vente.quantite}</TableCell>
                      <TableCell>{formatPrice(vente.prix_ttc)}</TableCell>
                      <TableCell>{formatPrice(vente.montantTTC)}</TableCell>
                      <TableCell>
                        {isComposant ? (
                          <Chip 
                            label="Composant (0€)" 
                            size="small" 
                            color="warning"
                          />
                        ) : isOriginal ? (
                          <Chip 
                            label="Original" 
                            size="small" 
                            color="success"
                          />
                        ) : (
                          <Chip 
                            label="Cumulé" 
                            size="small" 
                            color="info"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Légende :
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label="Original" size="small" color="success" />
            <Chip label="Composant (0€)" size="small" color="warning" />
            <Chip label="Cumulé" size="small" color="info" />
            {!afficherComposants && (
              <Chip 
                label={`${ventesDecomposees.filter(v => v.prix_ttc === 0).length} composants masqués`} 
                size="small" 
                color="warning" 
                variant="outlined"
              />
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default DecompositionTest;
