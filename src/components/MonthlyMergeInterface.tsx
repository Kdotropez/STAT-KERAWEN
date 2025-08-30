import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Storage as StorageIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  RestoreFromTrash as RestoreIcon,
  Folder as FolderIcon,
  FileDownload as FileDownloadIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { MonthlyMergeService, MergeResult, SauvegardeConfig } from '../services/MonthlyMergeService';
import { VenteLigne } from '../types';
import { SauvegardeConfigInterface } from './SauvegardeConfigInterface';

interface MonthlyMergeInterfaceProps {
  ventesImportees: VenteLigne[];
  onMergeComplete: (result: MergeResult) => void;
}

export const MonthlyMergeInterface: React.FC<MonthlyMergeInterfaceProps> = ({
  ventesImportees,
  onMergeComplete
}) => {
  const [mergeService] = useState(() => new MonthlyMergeService());
  const [statsCumulatives, setStatsCumulatives] = useState<{
    totalVentes: number;
    periode: { debut: Date | null; fin: Date | null };
    mois: string[];
  } | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showDoublonsDialog, setShowDoublonsDialog] = useState(false);
  const [doublonsInternes, setDoublonsInternes] = useState<{
    total: number;
    details: Array<{
      date: string;
      produit: string;
      boutique: string;
      quantite: number;
      montant: number;
      occurrences: number;
    }>;
  } | null>(null);
  const [listeFichiers, setListeFichiers] = useState<Array<{ mois: string; fusionne: string; dateSauvegarde: string; config?: SauvegardeConfig }>>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Charger les statistiques cumulatives au démarrage
  useEffect(() => {
    chargerStatistiquesCumulatives();
    chargerListeFichiers();
  }, []);

  const chargerStatistiquesCumulatives = () => {
    const stats = mergeService.obtenirStatistiquesCumulatives();
    setStatsCumulatives(stats);
  };

  const chargerListeFichiers = () => {
    const fichiers = mergeService.obtenirListeFichiers();
    setListeFichiers(fichiers);
  };

  const handleMerge = async (supprimerDoublons: boolean = false) => {
    if (ventesImportees.length === 0) {
      return;
    }

    setIsMerging(true);
    try {
      const result = await mergeService.fusionnerVentesMensuelles(ventesImportees, supprimerDoublons);
      setMergeResult(result);
      onMergeComplete(result);
      chargerStatistiquesCumulatives(); // Recharger les stats
      chargerListeFichiers(); // Recharger la liste des fichiers
    } catch (error) {
      console.error('❌ Erreur lors de la fusion:', error);
      setMergeResult({
        success: false,
        ventesExistant: 0,
        ventesNouvelles: ventesImportees.length,
        ventesFusionnees: 0,
        doublonsElimines: 0,
        message: `Erreur de fusion : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        periode: { debut: new Date(), fin: new Date() },
        fichiersSauvegardes: { mois: '', fusionne: '' }
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handlePreMerge = async () => {
    if (ventesImportees.length === 0) {
      return;
    }

    // Détecter les doublons internes avant la fusion
    const doublons = mergeService.detecterDoublonsInternes(ventesImportees);
    
    if (doublons.total > 0) {
      setDoublonsInternes(doublons);
      setShowDoublonsDialog(true);
    } else {
      // Pas de doublons internes, procéder directement à la fusion
      handleMerge(false);
    }
  };

  const handleMergeWithDoublons = async (supprimerDoublons: boolean) => {
    setShowDoublonsDialog(false);
    handleMerge(supprimerDoublons);
  };

  const supprimerDoublonsInternes = (ventes: VenteLigne[]): VenteLigne[] => {
    const ventesUniques = new Map<string, VenteLigne>();
    
    ventes.forEach(vente => {
      const cle = mergeService['creerCleUnique'](vente);
      if (!ventesUniques.has(cle)) {
        ventesUniques.set(cle, vente);
      }
    });
    
    return Array.from(ventesUniques.values());
  };

  const handleExport = () => {
    const data = mergeService.exporterDonneesCumulatives();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventes-cumulatives-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    mergeService.effacerDonneesCumulatives();
    setStatsCumulatives({ totalVentes: 0, periode: { debut: null, fin: null }, mois: [] });
    setListeFichiers([]);
    setShowDeleteDialog(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;

    try {
      const result = await mergeService.restaurerDepuisFichier(selectedFile);
      if (result.success) {
        // Restaurer les ventes dans l'interface principale
        onMergeComplete({
          success: true,
          ventesExistant: 0,
          ventesNouvelles: result.ventes.length,
          ventesFusionnees: result.ventes.length,
          doublonsElimines: 0,
          message: result.message,
          periode: { debut: new Date(), fin: new Date() },
          fichiersSauvegardes: { mois: '', fusionne: '' }
        });
        setShowRestoreDialog(false);
        setSelectedFile(null);
      } else {
        alert(`Erreur de restauration : ${result.message}`);
      }
    } catch (error) {
      alert(`Erreur lors de la restauration : ${error}`);
    }
  };

  const handleConfigChange = (newConfig: SauvegardeConfig) => {
    mergeService.mettreAJourConfiguration(newConfig);
    setShowConfigDialog(false);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Aucune';
    return date.toLocaleDateString('fr-FR');
  };

  const formatMois = (mois: string): string => {
    const [annee, moisNum] = mois.split('-');
    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${moisNoms[parseInt(moisNum) - 1]} ${annee}`;
  };

  const formatDateSauvegarde = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <StorageIcon color="primary" />
        Fusion Mensuelle des Ventes
      </Typography>

      {/* Statistiques cumulatives actuelles */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Données Cumulatives Actuelles
          </Typography>
          
          {statsCumulatives ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Total Ventes</Typography>
                <Typography variant="h4" color="primary">
                  {statsCumulatives.totalVentes.toLocaleString()}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Période</Typography>
                <Typography variant="body2">
                  {formatDate(statsCumulatives.periode.debut)} - {formatDate(statsCumulatives.periode.fin)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Mois Importés</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {statsCumulatives.mois.map(mois => (
                    <Chip key={mois} label={formatMois(mois)} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Aucune donnée cumulative trouvée
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Nouvelles ventes à fusionner */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📥 Nouvelles Ventes à Fusionner
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="body1">
              {ventesImportees.length} ventes prêtes à être fusionnées
            </Typography>
            
            {ventesImportees.length > 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowConfirmDialog(true)}
                disabled={isMerging}
                sx={{ minWidth: 150 }}
              >
                {isMerging ? 'Fusion en cours...' : 'Fusionner'}
              </Button>
            )}
          </Box>

          {ventesImportees.length > 0 && (
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="body2">
                Les nouvelles ventes seront fusionnées avec les données existantes. 
                Les doublons internes au fichier seront détectés et vous pourrez choisir de les supprimer.
                <br />
                <strong>📁 Fichiers automatiquement sauvegardés :</strong>
                <br />
                • Fichier JSON du mois individuel
                <br />
                • Fichier JSON fusionné complet
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Résultat de la fusion */}
      {mergeResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {mergeResult.success ? '✅ Fusion Réussie' : '❌ Erreur de Fusion'}
            </Typography>
            
            <Alert 
              severity={mergeResult.success ? 'success' : 'error'}
              sx={{ mb: 2 }}
            >
              {mergeResult.message}
            </Alert>

            {mergeResult.success && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Ventes Existantes</Typography>
                    <Typography variant="h6">{mergeResult.ventesExistant.toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Nouvelles Ventes</Typography>
                    <Typography variant="h6">{mergeResult.ventesNouvelles.toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Total Après Fusion</Typography>
                    <Typography variant="h6">{mergeResult.ventesFusionnees.toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Doublons Éliminés</Typography>
                    <Typography variant="h6" color="warning.main">
                      {mergeResult.doublonsElimines.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>

                {/* Doublons internes détectés */}
                {mergeResult.doublonsInternes && mergeResult.doublonsInternes.total > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      🔍 Doublons Internes Détectés ({mergeResult.doublonsInternes.total})
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        {mergeResult.doublonsInternes.total} doublons internes ont été détectés dans le fichier importé.
                      </Typography>
                    </Alert>
                  </>
                )}

                {/* Fichiers sauvegardés */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  📁 Fichiers Sauvegardés
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {mergeResult.fichiersSauvegardes.mois && (
                    <Chip 
                      icon={<FileDownloadIcon />} 
                      label={mergeResult.fichiersSauvegardes.mois} 
                      variant="outlined" 
                      color="primary"
                    />
                  )}
                  {mergeResult.fichiersSauvegardes.fusionne && (
                    <Chip 
                      icon={<FileDownloadIcon />} 
                      label={mergeResult.fichiersSauvegardes.fusionne} 
                      variant="outlined" 
                      color="secondary"
                    />
                  )}
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fichiers sauvegardés */}
      {listeFichiers.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FolderIcon color="primary" />
              Fichiers Sauvegardés ({listeFichiers.length})
            </Typography>
            
            <List dense>
              {listeFichiers.slice(-5).reverse().map((fichier, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {fichier.mois && (
                          <Chip label={fichier.mois} size="small" variant="outlined" />
                        )}
                        {fichier.fusionne && (
                          <Chip label={fichier.fusionne} size="small" variant="outlined" color="secondary" />
                        )}
                      </Box>
                    }
                    secondary={formatDateSauvegarde(fichier.dateSauvegarde)}
                  />
                </ListItem>
              ))}
            </List>
            
            {listeFichiers.length > 5 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                ... et {listeFichiers.length - 5} autres fichiers
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions sur les données cumulatives */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔧 Gestion des Données
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Tooltip title="Exporter toutes les données cumulatives">
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={!statsCumulatives || statsCumulatives.totalVentes === 0}
              >
                Exporter
              </Button>
            </Tooltip>
            
            <Tooltip title="Restaurer depuis un fichier JSON">
              <Button
                variant="outlined"
                startIcon={<RestoreIcon />}
                onClick={() => setShowRestoreDialog(true)}
              >
                Restaurer
              </Button>
            </Tooltip>
            
            <Tooltip title="Configurer les options de sauvegarde">
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setShowConfigDialog(true)}
              >
                Configuration
              </Button>
            </Tooltip>
            
            <Tooltip title="Effacer toutes les données cumulatives (irréversible)">
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setShowDeleteDialog(true)}
                disabled={!statsCumulatives || statsCumulatives.totalVentes === 0}
              >
                Effacer Tout
              </Button>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog de confirmation de fusion */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirmer la Fusion</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir fusionner {ventesImportees.length} nouvelles ventes 
            avec les {statsCumulatives?.totalVentes || 0} ventes existantes ?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Le système va d'abord détecter les doublons internes dans votre fichier.
              <br />
              <strong>📁 Fichiers automatiquement sauvegardés :</strong>
              <br />
              • Fichier JSON du mois individuel
              <br />
              • Fichier JSON fusionné complet
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Annuler</Button>
          <Button onClick={() => { setShowConfirmDialog(false); handlePreMerge(); }} variant="contained">
            Confirmer la Fusion
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Confirmer la Suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir effacer toutes les données cumulatives ?
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Cette action est irréversible et supprimera {statsCumulatives?.totalVentes || 0} ventes.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Confirmer la Suppression
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de restauration */}
      <Dialog open={showRestoreDialog} onClose={() => setShowRestoreDialog(false)}>
        <DialogTitle>Restaurer depuis un fichier JSON</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Sélectionnez un fichier JSON de ventes à restaurer :
          </Typography>
          
          <input
            accept=".json"
            style={{ display: 'none' }}
            id="restore-file-input"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="restore-file-input">
            <Button variant="outlined" component="span" startIcon={<FileDownloadIcon />}>
              Choisir un fichier JSON
            </Button>
          </label>
          
          {selectedFile && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Fichier sélectionné : {selectedFile.name}
              </Typography>
            </Alert>
          )}
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              La restauration remplacera toutes les données cumulatives actuelles.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowRestoreDialog(false); setSelectedFile(null); }}>
            Annuler
          </Button>
          <Button 
            onClick={handleRestore} 
            variant="contained" 
            disabled={!selectedFile}
          >
            Restaurer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de configuration */}
      <Dialog 
        open={showConfigDialog} 
        onClose={() => setShowConfigDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Configuration de Sauvegarde</DialogTitle>
        <DialogContent>
          <SauvegardeConfigInterface
            config={mergeService.obtenirConfiguration()}
            onConfigChange={handleConfigChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfigDialog(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog des doublons internes */}
      <Dialog 
        open={showDoublonsDialog} 
        onClose={() => setShowDoublonsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          🔍 Doublons Internes Détectés
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>{doublonsInternes?.total} doublons internes</strong> ont été détectés dans votre fichier importé.
              <br />
              Ces doublons sont des ventes identiques qui apparaissent plusieurs fois dans le même fichier.
            </Typography>
          </Alert>

          <Typography variant="subtitle1" gutterBottom>
            Détails des doublons :
          </Typography>

          {doublonsInternes && (
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Produit</TableCell>
                    <TableCell>Boutique</TableCell>
                    <TableCell>Quantité</TableCell>
                    <TableCell>Montant</TableCell>
                    <TableCell>Occurrences</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {doublonsInternes.details.map((doublon, index) => (
                    <TableRow key={index}>
                      <TableCell>{doublon.date}</TableCell>
                      <TableCell>{doublon.produit}</TableCell>
                      <TableCell>{doublon.boutique}</TableCell>
                      <TableCell>{doublon.quantite}</TableCell>
                      <TableCell>{doublon.montant.toFixed(2)} €</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${doublon.occurrences}x`} 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Que souhaitez-vous faire ?</strong>
              <br />
              • <strong>Supprimer les doublons</strong> : Garder une seule occurrence de chaque vente
              <br />
              • <strong>Garder tous les doublons</strong> : Conserver toutes les ventes (même les doublons)
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDoublonsDialog(false)}
            startIcon={<CancelIcon />}
          >
            Annuler
          </Button>
          <Button 
            onClick={() => handleMergeWithDoublons(false)}
            variant="outlined"
            startIcon={<InfoIcon />}
          >
            Garder Tous les Doublons
          </Button>
          <Button 
            onClick={() => handleMergeWithDoublons(true)}
            variant="contained"
            startIcon={<CheckCircleIcon />}
          >
            Supprimer les Doublons
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
