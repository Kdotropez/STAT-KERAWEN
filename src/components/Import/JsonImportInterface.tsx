import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore, CloudUpload, Download } from '@mui/icons-material';
import JsonImportService, { ImportResult } from '../../services/JsonImportService';
import { JsonVenteData } from '../../services/ExcelToJsonService';

interface JsonImportInterfaceProps {
  onImportComplete: (result: ImportResult) => void;
}

const JsonImportInterface: React.FC<JsonImportInterfaceProps> = ({ onImportComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.json')) {
      setSelectedFile(file);
      setError(null);
      setImportResult(null);
    } else {
      setError('Veuillez sélectionner un fichier JSON valide');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier JSON');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const jsonContent = await selectedFile.text();
      console.log('🔍 Contenu du fichier JSON:', jsonContent.substring(0, 500) + '...');

      const importService = new JsonImportService();
      
      // Importer directement avec la nouvelle méthode qui gère les deux formats
      const result = await importService.importVentesJsonFile(jsonContent);
      
      if (result.success) {
        setImportResult(result);
        onImportComplete(result);
      } else {
        setError(result.message);
      }

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setError(`Erreur lors de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadVentes = (ventes: any[], filename: string) => {
    const dataStr = JSON.stringify(ventes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Import de Fichier JSON
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sélection du fichier
        </Typography>
        
        <input
          accept=".json"
          style={{ display: 'none' }}
          id="json-file-input"
          type="file"
          onChange={handleFileSelect}
        />
        <label htmlFor="json-file-input">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUpload />}
            disabled={isImporting}
          >
            Sélectionner un fichier JSON
          </Button>
        </label>
        
        {selectedFile && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Fichier sélectionné: {selectedFile.name}
          </Typography>
        )}
        
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!selectedFile || isImporting}
          sx={{ mt: 2 }}
        >
          {isImporting ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Import en cours...
            </>
          ) : (
            'Importer les données'
          )}
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {importResult && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Résultat de l'import
          </Typography>
          
          <Alert severity="success" sx={{ mb: 2 }}>
            {importResult.message}
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Statistiques de l'import
            </Typography>
            {importResult.stats && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{importResult.stats.lignesImportees}</Typography>
                  <Typography variant="body2">Lignes importées</Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{importResult.stats.lignesTraitees}</Typography>
                  <Typography variant="body2">Lignes après décomposition</Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{importResult.stats.compositionsTrouvees}</Typography>
                  <Typography variant="body2">Compositions trouvées</Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{importResult.stats.composantsAjoutes}</Typography>
                  <Typography variant="body2">Composants ajoutés</Typography>
                </Paper>
              </Box>
            )}
          </Box>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">
                Ventes originales ({importResult.ventesOriginales.length} lignes)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Produit</TableCell>
                      <TableCell>Quantité</TableCell>
                      <TableCell>Prix TTC</TableCell>
                      <TableCell>Montant TTC</TableCell>
                      <TableCell>Boutique</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importResult.ventesOriginales.slice(0, 10).map((vente, index) => (
                      <TableRow key={index}>
                        <TableCell>{vente.id}</TableCell>
                        <TableCell>{vente.produit}</TableCell>
                        <TableCell>{vente.quantite}</TableCell>
                        <TableCell>{vente.prix_ttc.toFixed(2)} €</TableCell>
                        <TableCell>{vente.montantTTC.toFixed(2)} €</TableCell>
                        <TableCell>{vente.boutique}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {importResult.ventesOriginales.length > 10 && (
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  Affichage des 10 premières lignes sur {importResult.ventesOriginales.length}
                </Typography>
              )}
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => downloadVentes(importResult.ventesOriginales, 'ventes-originales.json')}
                sx={{ mt: 2 }}
              >
                Télécharger les ventes originales
              </Button>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">
                Ventes après décomposition ({importResult.ventesDecomposees.length} lignes)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Produit</TableCell>
                      <TableCell>Quantité</TableCell>
                      <TableCell>Prix TTC</TableCell>
                      <TableCell>Montant TTC</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Boutique</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importResult.ventesDecomposees.slice(0, 10).map((vente, index) => (
                      <TableRow key={index}>
                        <TableCell>{vente.id}</TableCell>
                        <TableCell>{vente.produit}</TableCell>
                        <TableCell>{vente.quantite}</TableCell>
                        <TableCell>{vente.prix_ttc.toFixed(2)} €</TableCell>
                        <TableCell>{vente.montantTTC.toFixed(2)} €</TableCell>
                        <TableCell>{vente.type}</TableCell>
                        <TableCell>{vente.boutique}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {importResult.ventesDecomposees.length > 10 && (
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  Affichage des 10 premières lignes sur {importResult.ventesDecomposees.length}
                </Typography>
              )}
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => downloadVentes(importResult.ventesDecomposees, 'ventes-decomposees.json')}
                sx={{ mt: 2 }}
              >
                Télécharger les ventes décomposées
              </Button>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}
    </Box>
  );
};

export default JsonImportInterface;
