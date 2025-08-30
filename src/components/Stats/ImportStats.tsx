import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert
} from '@mui/material';
import {
  TableChart as TableChartIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { VenteLigne, ComposantVendu } from '../../types';

interface ImportStatsProps {
  stats: {
    lignesOriginales: number;
    lignesFinales: number;
    composantsAjoutes: number;
    compositionsTrouvees: number;
  } | null;
  ventes?: VenteLigne[]; // Ajouter les ventes pour l'affichage
}

const ImportStats: React.FC<ImportStatsProps> = ({ stats, ventes = [] }) => {
  const [openDialog, setOpenDialog] = useState(false);

  if (!stats) {
    return (
      <Alert severity="info">
        Aucune statistique d'import disponible. Importez d'abord des données.
      </Alert>
    );
  }

  const handleViewFile = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleExportFile = async () => {
    try {
      console.log('📁 Début de l\'export du fichier final...');
      const FileExportService = (await import('../../services/FileExportService')).default;
      const exportService = new FileExportService();
      console.log(`📊 Export de ${ventes.length} lignes...`);
      await exportService.exporterVentesDecomposees(ventes);
      console.log('✅ Export terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TableChartIcon />
          Statistiques d'Import et Décomposition
        </Typography>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3, 
          mt: 2 
        }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Lignes Originales
              </Typography>
              <Typography variant="h4" component="div">
                {stats.lignesOriginales}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Compositions Trouvées
              </Typography>
              <Typography variant="h4" component="div" color="primary">
                {stats.compositionsTrouvees}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Composants Ajoutés
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                +{stats.composantsAjoutes}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Après Décomposition
              </Typography>
              <Typography variant="h4" component="div" color="secondary.main">
                {stats.lignesFinales}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<VisibilityIcon />}
            onClick={handleViewFile}
            size="large"
          >
            📊 Voir le fichier complet (Total après composition)
          </Button>
          
                     <Button
             variant="outlined"
             color="secondary"
             startIcon={<DownloadIcon />}
             onClick={handleExportFile}
             size="large"
           >
             📥 Télécharger le fichier final
           </Button>
        </Box>
      </Paper>

      {/* Dialog pour afficher le fichier complet */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          📊 Fichier Final - Total après décomposition ({ventes.length} lignes)
        </DialogTitle>
        <DialogContent>
          <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
            <TableContainer>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Boutique</TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Produit</TableCell>
                    <TableCell>Quantité</TableCell>
                    <TableCell>Prix TTC</TableCell>
                    <TableCell>Montant TTC</TableCell>
                    <TableCell>Prix Achat</TableCell>
                    <TableCell>Marge</TableCell>
                    <TableCell>Composants</TableCell>
                    <TableCell>Caissier</TableCell>
                    <TableCell>Commande</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ventes.map((vente, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{formatDate(vente.date)}</TableCell>
                      <TableCell>{vente.boutique}</TableCell>
                      <TableCell>
                        <Chip 
                          label={vente.id} 
                          size="small" 
                          color={vente.composants ? "secondary" : "default"}
                        />
                      </TableCell>
                      <TableCell>{vente.produit}</TableCell>
                      <TableCell>{vente.quantite}</TableCell>
                      <TableCell>{formatPrice(vente.prix_ttc || 0)}</TableCell>
                      <TableCell>{formatPrice(vente.montantTTC)}</TableCell>
                      <TableCell>{vente.prixAchat ? formatPrice(vente.prixAchat) : '-'}</TableCell>
                      <TableCell>{vente.marge ? formatPrice(vente.marge) : '-'}</TableCell>
                      <TableCell>
                        {vente.composants && vente.composants.length > 0 ? (
                          <Box>
                            {vente.composants.map((comp: ComposantVendu, compIndex: number) => (
                              <Chip
                                key={compIndex}
                                label={`${comp.nom} (${comp.quantite})`}
                                size="small"
                                variant="outlined"
                                sx={{ mb: 0.5, mr: 0.5 }}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Chip label="Produit simple" size="small" color="default" />
                        )}
                      </TableCell>
                      <TableCell>{vente.caissier || '-'}</TableCell>
                      <TableCell>{vente.commande || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Fermer</Button>
                     <Button 
             onClick={handleExportFile}
             variant="contained"
           >
             Télécharger
           </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImportStats;
