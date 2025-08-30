import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  CloudDownload as CloudDownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import CompositionsEnrichiesImporter, { ImportResult } from '../services/CompositionsEnrichiesImporter';

const CompositionsEnrichiesImporterComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<ImportResult | null>(null);
  const [statistiques, setStatistiques] = useState<{
    existe: boolean;
    nombreCompositions: number;
    typesCompositions: Record<string, number>;
  } | null>(null);

  const importer = new CompositionsEnrichiesImporter();

  useEffect(() => {
    chargerStatistiques();
  }, []);

  const chargerStatistiques = async () => {
    try {
      const stats = await importer.obtenirStatistiques();
      setStatistiques(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const importerCompositions = async () => {
    setLoading(true);
    setResultat(null);
    
    try {
      console.log('🔄 Début de l\'import...');
      const resultat = await importer.importerCompositionsEnrichies();
      setResultat(resultat);
      
      if (resultat.success) {
        // Recharger les statistiques après import
        await chargerStatistiques();
        
        // Forcer le rechargement de la page pour mettre à jour tous les composants
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
      
      console.log('✅ Import terminé:', resultat);
    } catch (error) {
      console.error('❌ Erreur lors de l\'import:', error);
      setResultat({
        success: false,
        message: `Erreur lors de l'import : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        compositionsImportees: 0,
        erreurs: [error instanceof Error ? error.message : 'Erreur inconnue']
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CloudDownloadIcon sx={{ mr: 1 }} />
          <Typography variant="h5" component="h2">
            Import des Compositions Enrichies
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Importe automatiquement les compositions enrichies avec les vrais IDs depuis le fichier 
          <code>compositions-enrichies.json</code> dans le système de gestion des compositions.
        </Typography>

        {/* Statistiques du fichier */}
        {statistiques && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              📊 État du fichier enrichi
            </Typography>
            
            {statistiques.existe ? (
              <Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  ✅ Fichier <code>compositions-enrichies.json</code> trouvé
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  📦 <strong>{statistiques.nombreCompositions}</strong> compositions disponibles
                </Typography>
                
                {Object.keys(statistiques.typesCompositions).length > 0 && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Répartition par type :
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {Object.entries(statistiques.typesCompositions).map(([type, count]) => (
                        <Chip 
                          key={type}
                          label={`${type}: ${count}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <Alert severity="warning">
                ⚠️ Fichier <code>compositions-enrichies.json</code> non trouvé dans le dossier public.
                <br />
                Assurez-vous que le fichier existe avant de procéder à l'import.
              </Alert>
            )}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Bouton d'import */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={importerCompositions}
            disabled={loading || !statistiques?.existe}
            startIcon={loading ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
            size="large"
          >
            {loading ? 'Import en cours...' : 'Importer les Compositions Enrichies'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={chargerStatistiques}
            disabled={loading}
            startIcon={<RefreshIcon />}
          >
            Actualiser
          </Button>
        </Box>

        {/* Résultat de l'import */}
        {resultat && (
          <Box sx={{ mt: 3 }}>
            <Alert 
              severity={resultat.success ? 'success' : 'error'}
              icon={resultat.success ? <CheckCircleIcon /> : undefined}
            >
              <Typography variant="h6" gutterBottom>
                {resultat.success ? '✅ Import réussi' : '❌ Import échoué'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {resultat.message}
              </Typography>
              
                             {resultat.success && (
                 <Typography variant="body2" sx={{ mb: 1 }}>
                   📊 <strong>{resultat.compositionsImportees}</strong> compositions importées dans le système
                 </Typography>
               )}
               
               {resultat.success && (
                 <Typography variant="body2" sx={{ mb: 1, color: 'warning.main' }}>
                   ⚠️ La page va se recharger automatiquement dans 2 secondes pour mettre à jour tous les composants...
                 </Typography>
               )}
              
              {resultat.erreurs.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    ⚠️ Erreurs rencontrées :
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {resultat.erreurs.map((erreur, index) => (
                      <Typography key={index} component="li" variant="body2" color="error">
                        {erreur}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Alert>
          </Box>
        )}

        {/* Instructions */}
        {!loading && !resultat && (
          <Alert severity="info">
            <Typography variant="body1" gutterBottom>
              <strong>Instructions :</strong>
            </Typography>
            <Typography variant="body2" component="div">
              1. Assurez-vous que le fichier <code>compositions-enrichies.json</code> est dans le dossier <code>public/</code>
              <br />
              2. Cliquez sur "Importer les Compositions Enrichies"
              <br />
              3. Les compositions seront automatiquement chargées dans le système
              <br />
              4. Vous pourrez ensuite les gérer via l'onglet "Gestion Compositions"
            </Typography>
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default CompositionsEnrichiesImporterComponent;
