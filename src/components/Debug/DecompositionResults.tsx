import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import { VenteLigne } from '../../types';

interface DecompositionResultsProps {
  ventesOriginales: VenteLigne[];
  ventesDecomposees: VenteLigne[];
  compositionsTrouvees: Array<{
    id: string;
    nom: string;
    composants: Array<{ id: string; nom: string; quantite: number }>;
  }>;
}

const DecompositionResults: React.FC<DecompositionResultsProps> = ({
  ventesOriginales,
  ventesDecomposees,
  compositionsTrouvees
}) => {
  const decompositionsAjoutees = ventesDecomposees.length - ventesOriginales.length;
  const lignesComposees = ventesDecomposees.filter(vente => 
    compositionsTrouvees.some(comp => comp.id === vente.id)
  );

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Résultats de la Décomposition
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Résumé :</strong> {ventesOriginales.length} lignes originales → {ventesDecomposees.length} lignes totales 
            (+{decompositionsAjoutees} composants ajoutés)
          </Typography>
        </Alert>

        {compositionsTrouvees.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              🧩 Compositions trouvées ({compositionsTrouvees.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {compositionsTrouvees.map((comp, index) => (
                <Chip
                  key={index}
                  label={`${comp.nom} (ID: ${comp.id}) - ${comp.composants.length} composants`}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          📊 Détail des ventes décomposées
        </Typography>

        <TableContainer sx={{ maxHeight: 400 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Produit</TableCell>
                <TableCell>Qté</TableCell>
                <TableCell>Prix TTC</TableCell>
                <TableCell>Montant TTC</TableCell>
                <TableCell>Paiement</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ventesDecomposees.map((vente, index) => {
                const estComposition = compositionsTrouvees.some(comp => comp.id === vente.id);
                const estComposant = vente.prix_ttc === 0 && vente.montant_ttc === 0;
                
                return (
                  <TableRow 
                    key={index}
                    sx={{
                      backgroundColor: estComposition ? '#e3f2fd' : 
                                      estComposant ? '#f3e5f5' : 'inherit',
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                  >
                    <TableCell>
                      {estComposition && <Chip label="Composition" size="small" color="primary" />}
                      {estComposant && <Chip label="Composant" size="small" color="secondary" />}
                      {!estComposition && !estComposant && <Chip label="Produit" size="small" variant="outlined" />}
                    </TableCell>
                    <TableCell>
                      <Chip label={vente.id} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{vente.produit}</TableCell>
                    <TableCell>{vente.qte}</TableCell>
                    <TableCell>
                      {estComposant ? (
                        <Typography variant="body2" color="text.secondary">
                          <em>0€ (composant)</em>
                        </Typography>
                      ) : (
                        `${vente.prix_ttc}€`
                      )}
                    </TableCell>
                    <TableCell>
                      {estComposant ? (
                        <Typography variant="body2" color="text.secondary">
                          <em>0€ (composant)</em>
                        </Typography>
                      ) : (
                        `${vente.montant_ttc}€`
                      )}
                    </TableCell>
                    <TableCell>{vente.paiement}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Légende :</strong> 
            <Chip label="Composition" size="small" color="primary" sx={{ ml: 1, mr: 1 }} /> 
            Produit original composé | 
            <Chip label="Composant" size="small" color="secondary" sx={{ ml: 1, mr: 1 }} /> 
            Composant ajouté (prix à 0€) | 
            <Chip label="Produit" size="small" variant="outlined" sx={{ ml: 1 }} /> 
            Produit simple
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default DecompositionResults;


