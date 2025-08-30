import React, { useState } from 'react';
import { Box, Paper, Typography, Button, Alert } from '@mui/material';
import CompositionService from '../../services/CompositionService';

const CompositionDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const debugCompositions = async () => {
    setLoading(true);
    try {
      const compositionService = new CompositionService();
      await compositionService.chargerCompositions();
      
      const compositions = compositionService.getCompositions();
      const compositionsPourEdition = compositionService.getCompositionsPourEdition();
      
      // Test avec quelques IDs spécifiques
      const testIds = ['7518', '6967', '7549', '6141'];
      const testResults = testIds.map(id => {
        const composition = compositionService.trouverCompositionParId(id);
        return {
          id,
          trouve: !!composition,
          nom: composition?.nom || 'Non trouvé',
          type: composition?.type || 'N/A',
          composants: composition ? compositionService.obtenirComposants(composition) : []
        };
      });

      // Debug des catégories des composants
      const categoriesComposants = new Map<string, number>();
      compositions.forEach(comp => {
        const composants = compositionService.obtenirComposants(comp);
        composants.forEach(composant => {
          const categorie = composant.categorie || 'Non classé';
          categoriesComposants.set(categorie, (categoriesComposants.get(categorie) || 0) + 1);
        });
      });

      setDebugInfo({
        totalCompositions: compositions.length,
        totalCompositionsEdition: compositionsPourEdition.length,
        testResults,
        premieresCompositions: compositions.slice(0, 5).map(c => ({
          id: c.id,
          nom: c.nom,
          type: c.type
        })),
        categoriesComposants: Array.from(categoriesComposants.entries()).map(([categorie, count]) => ({
          categorie,
          count
        }))
      });
      
    } catch (error) {
      console.error('Erreur lors du debug:', error);
      setDebugInfo({ error: error instanceof Error ? error.message : 'Erreur inconnue' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          🐛 Debug des Compositions
        </Typography>
        
        <Button
          variant="contained"
          onClick={debugCompositions}
          disabled={loading}
          sx={{ mb: 3 }}
        >
          {loading ? 'Debug en cours...' : 'Lancer le Debug'}
        </Button>

        {debugInfo && (
          <Box>
            {debugInfo.error ? (
              <Alert severity="error">
                Erreur: {debugInfo.error}
              </Alert>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  📊 Informations générales
                </Typography>
                <Typography variant="body1">
                  • Total compositions: <strong>{debugInfo.totalCompositions}</strong>
                </Typography>
                <Typography variant="body1">
                  • Total compositions pour édition: <strong>{debugInfo.totalCompositionsEdition}</strong>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  🧪 Tests avec des IDs spécifiques
                </Typography>
                {debugInfo.testResults.map((test: any, index: number) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                    <Typography variant="body1">
                      <strong>ID {test.id}:</strong> {test.trouve ? '✅ Trouvé' : '❌ Non trouvé'}
                    </Typography>
                    {test.trouve && (
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body2">
                          Nom: {test.nom}
                        </Typography>
                        <Typography variant="body2">
                          Type: {test.type}
                        </Typography>
                        <Typography variant="body2">
                          Composants: {test.composants.length}
                        </Typography>
                        {test.composants.map((comp: any, compIndex: number) => (
                          <Typography key={compIndex} variant="body2" sx={{ ml: 2 }}>
                            • {comp.nom} (ID: {comp.id}) x{comp.quantite} - Catégorie: {comp.categorie || 'Non classé'}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  📋 Premières compositions
                </Typography>
                {debugInfo.premieresCompositions.map((comp: any, index: number) => (
                  <Typography key={index} variant="body2">
                    {comp.id}: {comp.nom} ({comp.type})
                  </Typography>
                ))}

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  🏷️ Catégories des composants
                </Typography>
                {debugInfo.categoriesComposants.map((cat: any, index: number) => (
                  <Typography key={index} variant="body2">
                    • {cat.categorie}: {cat.count} composants
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CompositionDebug;
