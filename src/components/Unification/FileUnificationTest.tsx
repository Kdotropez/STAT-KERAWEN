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
  Chip
} from '@mui/material';
import {
  Merge as MergeIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import FileUnificationService, { ProduitUnifie } from '../../services/FileUnificationService';

const FileUnificationTest: React.FC = () => {
  const [produitsUnifies, setProduitsUnifies] = useState<ProduitUnifie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreerFichierUnifie = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const service = new FileUnificationService();
      const fichierUnifie = await service.unifierFichiers();
      setProduitsUnifies(fichierUnifie.produits);
      setSuccess(`✅ Fichier unifié créé avec ${fichierUnifie.produits.length} produits`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du fichier unifié');
    } finally {
      setLoading(false);
    }
  };

  const handleExporterFichier = async () => {
    setLoading(true);
    setError(null);

    try {
      const service = new FileUnificationService();
      await service.exporterFichierUnifie();
      setSuccess('✅ Fichier unifié exporté avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MergeIcon />
          Test d'Unification des Fichiers
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Test de création du fichier unifié pour l'article 7788 "TRIO WHITE VN PORT GRIMAUD/TROPEZ" et ses composants.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleCreerFichierUnifie}
            disabled={loading}
          >
            Créer le fichier unifié
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExporterFichier}
            disabled={loading || produitsUnifies.length === 0}
          >
            Exporter le fichier JSON
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
      </Paper>

      {produitsUnifies.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Produits Unifiés ({produitsUnifies.length} produits)
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Catégorie</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Prix Achat HT</TableCell>
                  <TableCell>Prix Vente TTC</TableCell>
                  <TableCell>Composants</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {produitsUnifies.map((produit) => (
                  <TableRow key={produit.id} hover>
                    <TableCell>
                      <Chip 
                        label={produit.id} 
                        size="small" 
                        color={produit.type === 'compose' ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{produit.nom}</TableCell>
                    <TableCell>{produit.categorie}</TableCell>
                    <TableCell>
                      <Chip 
                        label={produit.type} 
                        size="small" 
                        variant="outlined"
                        color={produit.type === 'compose' ? 'secondary' : 'primary'}
                      />
                    </TableCell>
                    <TableCell>{formatPrice(produit.prix_achat_ht)}</TableCell>
                    <TableCell>{formatPrice(produit.prix_vente_ttc)}</TableCell>
                    <TableCell>
                      {produit.composants && produit.composants.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {produit.composants.map((comp, index) => (
                            <Chip
                              key={index}
                              label={`${comp.nom} (${comp.quantite})`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Chip label="Aucun" size="small" color="default" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default FileUnificationTest;
