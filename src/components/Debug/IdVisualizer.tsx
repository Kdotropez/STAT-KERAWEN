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
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { ProcessedFile } from '../Upload/FileUpload';
import * as XLSX from 'xlsx';

// Fonction pour formater la date - VERSION CORRIGÉE POUR EXCEL
const formaterDate = (dateValue: any): string => {
  if (!dateValue) return 'N/A';
  
  try {
    let date: Date;
    
    // Si c'est un nombre (format Excel), utiliser la formule standard
    if (typeof dateValue === 'number') {
      // Formule Excel : (dateValue - 25569) * 86400 * 1000
      // 25569 = nombre de jours entre 1900-01-01 et 1970-01-01
      // 86400 = nombre de secondes par jour
      // 1000 = conversion en millisecondes
      date = new Date((dateValue - 25569) * 86400 * 1000);
    } else if (typeof dateValue === 'string') {
      // Gérer le format DD/MM/YYYY
      const parts = dateValue.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        date = new Date(year, month, day);
      } else {
        date = new Date(dateValue);
      }
    } else {
      date = new Date(dateValue);
    }
    
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    // Formater en français
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    
    return date.toLocaleDateString('fr-FR', options);
  } catch (error) {
    return 'N/A';
  }
};

interface IdVisualizerProps {
  processedFiles: ProcessedFile[];
  mapping: { [key: string]: string | undefined };
}

const IdVisualizer: React.FC<IdVisualizerProps> = ({ processedFiles, mapping }) => {
  // Vérifier quels IDs correspondent à des compositions - DIRECTIVE PRIORITAIRE
  const [compositionsTrouvees, setCompositionsTrouvees] = React.useState<Array<{
    id: string;
    nom: string;
    type: string;
    nombreComposants: number;
  }>>([]);

  // Extraire les données si disponibles
  const file = processedFiles[0];
  const headers = file?.headers || [];
  const data = file?.data || [];

  // Trouver l'index de la colonne ID
  const idColumnIndex = headers.findIndex((header: string, index: number) => {
    const mappedValue = mapping[header];
    return mappedValue === 'id' || index === 11; // Colonne L = index 11
  });

  // Extraire tous les IDs uniques
  const ids = new Set<string>();
  const lignesAvecIds: Array<{ ligne: number; id: string; donnees: any[] }> = [];

  if (data && Array.isArray(data) && data.length > 1) {
    data.slice(1).forEach((ligne: any[], index: number) => {
      if (idColumnIndex !== -1 && ligne && ligne[idColumnIndex]) {
        const id = String(ligne[idColumnIndex]).trim();
        if (id && id !== '') {
          ids.add(id);
          lignesAvecIds.push({
            ligne: index + 1,
            id: id,
            donnees: ligne
          });
        }
      }
    });
  }

  const idsUniques = Array.from(ids).sort();

  React.useEffect(() => {
    const verifierCompositions = async () => {
      try {
        const response = await fetch('/compositions-unifiees.json');
        const compositionsData = await response.json();
        
        if (compositionsData && compositionsData.compositions && Array.isArray(compositionsData.compositions)) {
          const compositionsCorrespondantes = compositionsData.compositions.filter((comp: any) => 
            idsUniques.includes(comp.id)
          );
          
          setCompositionsTrouvees(compositionsCorrespondantes);
          if (compositionsCorrespondantes.length > 0) {
            console.log(`🔍 ${compositionsCorrespondantes.length} compositions trouvées dans les IDs`);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des compositions:', error);
      }
    };

    if (idsUniques && Array.isArray(idsUniques) && idsUniques.length > 0) {
      verifierCompositions();
    }
  }, [idsUniques]);

  if (processedFiles.length === 0) {
    return null;
  }

  // Trouver l'index de la colonne Produit
  const produitColumnIndex = headers.findIndex((header) => {
    const mappedValue = mapping[header];
    return mappedValue === 'produit';
  });

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mb: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Visualisation des IDs trouvés
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            📊 Informations de traitement
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Colonne ID détectée: {idColumnIndex !== -1 ? `Colonne ${idColumnIndex + 1} (${headers[idColumnIndex]})` : 'Non trouvée'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nombre total de lignes: {data.length - 1}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lignes avec ID valide: {lignesAvecIds.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            IDs uniques trouvés: {idsUniques.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Colonne Produit détectée: {produitColumnIndex !== -1 ? `Colonne ${produitColumnIndex + 1} (${headers[produitColumnIndex]})` : 'Non trouvée'}
          </Typography>
        </Box>

        {idColumnIndex === -1 ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            ❌ Aucune colonne ID détectée ! Vérifiez le mapping de la colonne L (index 11).
          </Alert>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                🆔 IDs uniques trouvés ({idsUniques.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 200, overflow: 'auto' }}>
                {idsUniques.map((id, index) => (
                  <Chip 
                    key={index} 
                    label={id} 
                    size="small" 
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>

            {/* DIRECTIVE PRIORITAIRE - Vérification des compositions */}
            {compositionsTrouvees.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  🧩 IDs qui sont des compositions ({compositionsTrouvees.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {compositionsTrouvees.map((comp, index) => (
                    <Alert key={index} severity="info" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>ID {comp.id}</strong> - {comp.nom}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Type: {comp.type} | Composants: {comp.nombreComposants}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                📋 Toutes les lignes avec IDs ({lignesAvecIds.length} lignes)
              </Typography>
              <TableContainer sx={{ maxHeight: 600, maxWidth: '100%' }}>
                <Table size="small" sx={{ minWidth: 1200 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ligne</TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell>Nom Produit</TableCell>
                      <TableCell>Déclinaison</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Heure</TableCell>
                      <TableCell>Boutique</TableCell>
                      <TableCell>Caissier</TableCell>
                      <TableCell>Qté</TableCell>
                      <TableCell>Prix TTC</TableCell>
                      <TableCell>Prix Achat</TableCell>
                      <TableCell>Montant TTC</TableCell>
                      <TableCell>TVA</TableCell>
                      <TableCell>Remise TTC</TableCell>
                      <TableCell>Fournisseur</TableCell>
                      <TableCell>Fabricant</TableCell>
                      <TableCell>Catégorie</TableCell>
                      <TableCell>Paiement</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>EAN</TableCell>
                      <TableCell>Référence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lignesAvecIds.map((item, index) => {
                      const ligne = item.donnees;
                      return (
                        <TableRow key={index}>
                          <TableCell>{item.ligne}</TableCell>
                          <TableCell>
                            <Chip label={item.id} size="small" color="primary" />
                          </TableCell>
                          <TableCell>
                            {ligne[produitColumnIndex] || ligne[12] || 'N/A'}
                          </TableCell>
                          <TableCell>{ligne[13] || 'N/A'}</TableCell>
                          <TableCell>{formaterDate(ligne[1])}</TableCell>
                          <TableCell>{ligne[2] || 'N/A'}</TableCell>
                          <TableCell>{ligne[4] || 'N/A'}</TableCell>
                          <TableCell>{ligne[6] || 'N/A'}</TableCell>
                          <TableCell>{ligne[18] || 'N/A'}</TableCell>
                          <TableCell>
                            {ligne[17] ? `${(parseFloat(ligne[17]) / 100).toFixed(2)} €` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {ligne[23] ? `${(parseFloat(ligne[23]) / 100).toFixed(2)} €` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {ligne[20] ? `${(parseFloat(ligne[20]) / 100).toFixed(2)} €` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {ligne[21] ? `${(parseFloat(ligne[21]) / 100).toFixed(2)} €` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {ligne[22] ? `${(parseFloat(ligne[22]) / 100).toFixed(2)} €` : 'N/A'}
                          </TableCell>
                          <TableCell>{ligne[15] || 'N/A'}</TableCell>
                          <TableCell>{ligne[16] || 'N/A'}</TableCell>
                          <TableCell>{ligne[26] || 'N/A'}</TableCell>
                          <TableCell>{ligne[29] || 'N/A'}</TableCell>
                          <TableCell>{ligne[9] || 'N/A'}</TableCell>
                          <TableCell>{ligne[14] || 'N/A'}</TableCell>
                          <TableCell>{ligne[25] || 'N/A'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Alert severity="info">
              <Typography variant="body2">
                <strong>Mapping actuel :</strong> {Object.entries(mapping).map(([source, target]) => 
                  `${source} → ${target}`
                ).join(', ')}
              </Typography>
              <Typography variant="body2">
                <strong>Colonne ID :</strong> {headers[idColumnIndex]} (index {idColumnIndex})
              </Typography>
            </Alert>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default IdVisualizer;
