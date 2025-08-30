import React, { useState } from 'react';
import { Box, Paper, Typography, Button, Alert, CircularProgress } from '@mui/material';
import CompositionNameFixer from '../services/CompositionNameFixer';

const CompositionNameFixerComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<{ success: boolean; message: string } | null>(null);

  const corrigerNomsCompositions = async () => {
    setLoading(true);
    setResultat(null);

    try {
      // Charger le fichier compositions-enrichies.json
      const response = await fetch('/compositions-enrichies.json');
      if (!response.ok) {
        throw new Error('Impossible de charger le fichier compositions-enrichies.json');
      }

      const compositions = await response.json();
      console.log(`📊 ${compositions.length} compositions chargées pour correction`);

      // Corriger les noms et télécharger le fichier
      await CompositionNameFixer.sauvegarderCompositionsCorrigees(compositions);

      setResultat({
        success: true,
        message: `✅ ${compositions.length} compositions corrigées et téléchargées !`
      });

    } catch (error) {
      console.error('Erreur lors de la correction:', error);
      setResultat({
        success: false,
        message: `❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          🔧 Correcteur de Noms de Compositions
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          Ce service corrige automatiquement les noms des compositions en générant des noms descriptifs 
          basés sur leurs composants. Les noms numériques (comme "13", "9") seront remplacés par des 
          noms explicites (comme "VASQUE VICTORIA TROPEZ + BK VERRE VILLAGE TROPEZ x12").
        </Typography>

        <Button
          variant="contained"
          onClick={corrigerNomsCompositions}
          disabled={loading}
          sx={{ mb: 3 }}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Correction en cours...' : 'Corriger et Télécharger'}
        </Button>

        {resultat && (
          <Alert severity={resultat.success ? 'success' : 'error'} sx={{ mb: 2 }}>
            {resultat.message}
          </Alert>
        )}

        {resultat?.success && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              📋 Instructions
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              1. <strong>Téléchargez</strong> le fichier "compositions-enrichies-corrigees.json"
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              2. <strong>Remplacez</strong> le fichier "compositions-enrichies.json" dans le dossier /public/
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              3. <strong>Rechargez</strong> l'application pour appliquer les corrections
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              4. <strong>Testez</strong> l'import de ventes pour voir les composants
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CompositionNameFixerComponent;


