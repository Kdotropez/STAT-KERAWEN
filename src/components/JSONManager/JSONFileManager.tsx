import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
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
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Folder as FolderIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { FileConversionService, FichierVenteJSON } from '../../services/FileConversionService';
import { VenteLigne } from '../../types';

interface JSONFileManagerProps {
  onVentesLoaded: (ventes: VenteLigne[]) => void;
}

const JSONFileManager: React.FC<JSONFileManagerProps> = ({ onVentesLoaded }) => {
  const [fileConversionService] = useState(() => new FileConversionService());
  const [fichiersJSON, setFichiersJSON] = useState<string[]>([]);
  const [fichiersDetails, setFichiersDetails] = useState<FichierVenteJSON[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // Charger la liste des fichiers JSON disponibles
  const chargerFichiersJSON = async () => {
    setLoading(true);
    setError(null);

    try {
      const fichiers = await fileConversionService.listerFichiersJSON();
      setFichiersJSON(fichiers);
      
      // Charger les détails de chaque fichier
      const details: FichierVenteJSON[] = [];
      for (const nomFichier of fichiers) {
        const fichierJSON = await fileConversionService.chargerFichierJSON(nomFichier);
        if (fichierJSON) {
          details.push(fichierJSON);
        }
      }
      setFichiersDetails(details);
      
      console.log(`📁 ${fichiers.length} fichiers JSON trouvés`);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des fichiers JSON:', err);
      setError('Erreur lors du chargement des fichiers JSON');
    } finally {
      setLoading(false);
    }
  };

  // Charger et fusionner les fichiers sélectionnés
  const chargerFichiersSelectionnes = async () => {
    if (selectedFiles.length === 0) {
      setError('Veuillez sélectionner au moins un fichier');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ventesFusionnees = await fileConversionService.chargerEtFusionnerFichiersJSON(selectedFiles);
      onVentesLoaded(ventesFusionnees);
      
      setDialogOpen(false);
      setSelectedFiles([]);
      
      console.log(`✅ ${ventesFusionnees.length} ventes chargées depuis ${selectedFiles.length} fichiers`);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des fichiers:', err);
      setError('Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  };

  // Créer un index des fichiers
  const creerIndex = async () => {
    try {
      await fileConversionService.creerIndexFichiersJSON(fichiersJSON);
    } catch (err) {
      console.error('❌ Erreur lors de la création de l\'index:', err);
    }
  };

  // Charger les fichiers au montage du composant
  useEffect(() => {
    chargerFichiersJSON();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            📁 Gestionnaire de Fichiers JSON
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Actualiser la liste">
              <IconButton onClick={chargerFichiersJSON} color="primary" disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Créer un index">
              <IconButton onClick={creerIndex} color="secondary">
                <StorageIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              disabled={fichiersJSON.length === 0}
            >
              Charger des Fichiers
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {fichiersJSON.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fichiers JSON disponibles
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {fichiersDetails.reduce((total, f) => total + f.ventes.length, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total des ventes
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                <SpeedIcon sx={{ fontSize: 'inherit', verticalAlign: 'middle', mr: 1 }} />
                10x
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Plus rapide que Excel
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Chargement en cours...
          </Alert>
        )}

        {fichiersJSON.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun fichier JSON trouvé
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Importez des fichiers Excel pour générer des fichiers JSON optimisés
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fichier</TableCell>
                  <TableCell>Date de Conversion</TableCell>
                  <TableCell>Ventes</TableCell>
                  <TableCell>Boutiques</TableCell>
                  <TableCell>Période</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fichiersDetails.map((fichier) => {
                  const stats = fileConversionService.obtenirStatistiquesFichier(fichier);
                  return (
                    <TableRow key={fichier.nomFichier} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {fichier.nomFichier}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stats.tailleFichier}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(fichier.dateConversion)}</TableCell>
                      <TableCell>
                        <Chip label={fichier.ventes.length} size="small" color="primary" />
                      </TableCell>
                      <TableCell>
                        <Chip label={fichier.metadata.boutiques.length} size="small" color="secondary" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fichier.metadata.periodeDebut} - {fichier.metadata.periodeFin}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Charger ce fichier">
                          <IconButton 
                            size="small" 
                            onClick={() => onVentesLoaded(fichier.ventes)}
                            color="primary"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog de sélection de fichiers */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Sélectionner les Fichiers à Charger
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sélectionnez les fichiers JSON que vous souhaitez charger et fusionner :
          </Typography>
          
          <List>
            {fichiersJSON.map((nomFichier) => (
              <ListItem key={nomFichier} dense>
                <ListItemText 
                  primary={nomFichier}
                  secondary={`Fichier JSON optimisé`}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant={selectedFiles.includes(nomFichier) ? "contained" : "outlined"}
                    size="small"
                    onClick={() => {
                      if (selectedFiles.includes(nomFichier)) {
                        setSelectedFiles(selectedFiles.filter(f => f !== nomFichier));
                      } else {
                        setSelectedFiles([...selectedFiles, nomFichier]);
                      }
                    }}
                  >
                    {selectedFiles.includes(nomFichier) ? "Sélectionné" : "Sélectionner"}
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={chargerFichiersSelectionnes}
            variant="contained"
            disabled={selectedFiles.length === 0 || loading}
          >
            Charger {selectedFiles.length} fichier(s)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JSONFileManager;


