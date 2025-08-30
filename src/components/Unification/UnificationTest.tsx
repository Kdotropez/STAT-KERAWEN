import React, { useState, useEffect } from 'react';
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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent
} from '@mui/material';
import {
  Merge as MergeIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Upload as UploadIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { FichierUnifie, ProduitUnifie } from '../../services/FileUnificationService';
import FileUnificationService from '../../services/FileUnificationService';

const UnificationTest: React.FC = () => {
  const [fichierUnifie, setFichierUnifie] = useState<FichierUnifie | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unificationService, setUnificationService] = useState<FileUnificationService | null>(null);
  const [afficherComposants, setAfficherComposants] = useState(false);
  const [fileInputRef] = useState(React.createRef<HTMLInputElement>());

  // Chargement automatique au montage du composant
  useEffect(() => {
    initialiserService();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const initialiserService = async () => {
    if (!unificationService) {
      const service = new FileUnificationService();
      setUnificationService(service);
      
      // 1. Essayer de charger le fichier de référence local en premier
      try {
        const fichierReference = await service.chargerDepuisFichierReference();
        if (fichierReference) {
          setFichierUnifie(fichierReference);
          console.log('✅ Fichier de référence local chargé automatiquement');
          return;
        }
      } catch (error) {
        console.log('📁 Fichier de référence local non trouvé, vérification localStorage...');
      }
      
      // 2. Si pas de fichier de référence, vérifier localStorage
      const estAJour = await service.verifierMiseAJour();
      if (estAJour) {
        const fichierSauvegarde = service.chargerDepuisLocalStorage();
        if (fichierSauvegarde) {
          setFichierUnifie(fichierSauvegarde);
          console.log('✅ Fichier unifié chargé depuis localStorage');
        }
      } else {
        console.log('🔄 Aucun fichier unifié disponible, unification nécessaire');
      }
    }
  };

  const unifierFichiers = async () => {
    if (!unificationService) {
      await initialiserService();
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Début de l\'unification des fichiers...');
      
      const service = unificationService || new FileUnificationService();
      const resultat = await service.unifierFichiers();
      
      setFichierUnifie(resultat);
      setUnificationService(service);
      
      // Sauvegarder dans localStorage
      service.sauvegarderDansLocalStorage();
      
      console.log('✅ Unification terminée:', resultat.statistiques);
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'unification:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const exporterFichier = async () => {
    if (!unificationService) {
      setError('Aucun fichier unifié disponible');
      return;
    }

    try {
      await unificationService.exporterFichierUnifie();
    } catch (err) {
      console.error('❌ Erreur lors de l\'export:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'export');
    }
  };

  const importerFichier = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !unificationService) return;

    setLoading(true);
    setError(null);

    try {
      const resultat = await unificationService.chargerDepuisFichier(file);
      setFichierUnifie(resultat);
      console.log('✅ Fichier importé avec succès');
    } catch (err) {
      console.error('❌ Erreur lors de l\'import:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
    } finally {
      setLoading(false);
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const chargerFichierReference = async () => {
    if (!unificationService) return;

    setLoading(true);
    setError(null);

    try {
      const fichierReference = await unificationService.chargerDepuisFichierReference();
      if (fichierReference) {
        setFichierUnifie(fichierReference);
        console.log('✅ Fichier de référence chargé');
      } else {
        setError('Aucun fichier de référence trouvé dans /public/fichier-unifie-reference.json');
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'excel': return 'primary';
      case 'json': return 'secondary';
      case 'fusion': return 'success';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'simple': return 'info';
      case 'compose': return 'warning';
      default: return 'default';
    }
  };

  React.useEffect(() => {
    initialiserService();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MergeIcon />
          Test d'Unification des Fichiers
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Unification du fichier JSON des compositions avec le fichier Excel source pour créer un fichier de référence unique.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<MergeIcon />}
            onClick={unifierFichiers}
            disabled={loading}
          >
            Unifier les fichiers
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={unifierFichiers}
            disabled={loading}
            color="warning"
          >
            Réunifier (forcer)
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<FolderIcon />}
            onClick={chargerFichierReference}
            disabled={loading}
            color="info"
          >
            Charger fichier référence
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            color="secondary"
          >
            Importer fichier
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exporterFichier}
            disabled={!fichierUnifie || loading}
          >
            Exporter le fichier unifié
          </Button>

          {fichierUnifie && (
            <Button
              variant={afficherComposants ? "contained" : "outlined"}
              startIcon={afficherComposants ? <VisibilityOffIcon /> : <VisibilityIcon />}
              onClick={() => setAfficherComposants(!afficherComposants)}
              color="warning"
            >
              {afficherComposants ? "Masquer" : "Afficher"} les composants
            </Button>
          )}
        </Box>

        {/* Input file caché pour l'import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={importerFichier}
          style={{ display: 'none' }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Statistiques */}
      {fichierUnifie && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Statistiques de l'Unification
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="primary">
                    {fichierUnifie.statistiques.total_produits}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total des produits
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="info.main">
                    {fichierUnifie.statistiques.produits_simples}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Produits simples
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="warning.main">
                    {fichierUnifie.statistiques.produits_composes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Produits composés
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="success.main">
                    {fichierUnifie.statistiques.produits_excel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Source Excel
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" color="text.secondary">
            Créé le {new Date(fichierUnifie.date_creation).toLocaleString('fr-FR')} - Version {fichierUnifie.version}
          </Typography>
        </Paper>
      )}

      {/* Liste des produits unifiés */}
      {fichierUnifie && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Produits Unifiés ({fichierUnifie.produits.length} produits)
            {!afficherComposants && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                ({fichierUnifie.produits.filter(p => p.type === 'simple').length} produits simples visibles)
              </Typography>
            )}
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Catégorie</TableCell>
                  <TableCell>Prix Achat HT</TableCell>
                  <TableCell>Prix Vente TTC</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Composants</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fichierUnifie.produits
                  .filter(produit => {
                    // Si l'option est désactivée, masquer les produits composés
                    if (!afficherComposants && produit.type === 'compose') {
                      return false;
                    }
                    return true;
                  })
                  .map((produit, index) => (
                    <TableRow 
                      key={index} 
                      hover
                      sx={{ 
                        backgroundColor: produit.type === 'compose' ? 'warning.light' : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Chip 
                          label={produit.id} 
                          size="small" 
                          color={produit.type === 'compose' ? "warning" : "default"}
                        />
                      </TableCell>
                      <TableCell>{produit.nom}</TableCell>
                      <TableCell>{produit.categorie}</TableCell>
                      <TableCell>{formatPrice(produit.prix_achat_ht)}</TableCell>
                      <TableCell>{formatPrice(produit.prix_vente_ttc)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={produit.type === 'compose' ? 'Composé' : 'Simple'} 
                          size="small" 
                          color={getTypeColor(produit.type)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={produit.source} 
                          size="small" 
                          color={getSourceColor(produit.source)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                                                 {produit.composants && produit.composants.length > 0 ? (
                           <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="body2">
                                {produit.composants.length} composant(s)
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Nom</TableCell>
                                    <TableCell>Qté</TableCell>
                                    <TableCell>Prix HT</TableCell>
                                    <TableCell>Prix TTC</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {produit.composants.map((composant, compIndex) => (
                                    <TableRow key={compIndex}>
                                      <TableCell>{composant.id}</TableCell>
                                      <TableCell>{composant.nom}</TableCell>
                                      <TableCell>{composant.quantite}</TableCell>
                                      <TableCell>{formatPrice(composant.prix_achat_ht)}</TableCell>
                                      <TableCell>{formatPrice(composant.prix_vente_ttc)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </AccordionDetails>
                          </Accordion>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Légende :
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label="Simple" size="small" color="info" />
            <Chip label="Composé" size="small" color="warning" />
            <Chip label="Source Excel" size="small" color="primary" variant="outlined" />
            <Chip label="Source JSON" size="small" color="secondary" variant="outlined" />
            <Chip label="Fusion" size="small" color="success" variant="outlined" />
            {!afficherComposants && (
              <Chip 
                label={`${fichierUnifie.produits.filter(p => p.type === 'compose').length} produits composés masqués`} 
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

export default UnificationTest;
