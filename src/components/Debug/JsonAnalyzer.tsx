import React, { useState, useMemo } from 'react';
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
  Button,
  TextField,
  InputAdornment,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Upload as UploadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { VenteLigne } from '../../types';

interface JsonAnalyzerProps {
  ventes: VenteLigne[];
}

const JsonAnalyzer: React.FC<JsonAnalyzerProps> = ({ ventes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileAnalysis, setFileAnalysis] = useState<any>(null);

  // Analyser les ventes actuelles
  const analyseVentes = useMemo(() => {
    if (!ventes || ventes.length === 0) {
      return {
        totalVentes: 0,
        idsUniques: new Set<string>(),
        produitsUniques: new Set<string>(),
        categories: new Map<string, number>(),
        montants: [] as number[],
        problemes: [] as string[]
      };
    }

    const idsUniques = new Set<string>();
    const produitsUniques = new Set<string>();
    const categories = new Map<string, number>();
    const montants: number[] = [];
    const problemes: string[] = [];

    ventes.forEach(vente => {
      // Collecter les IDs
      if (vente.id) {
        idsUniques.add(vente.id);
      }

      // Collecter les produits
      if (vente.produit) {
        produitsUniques.add(vente.produit);
      }

      // Collecter les catégories
      const categorie = vente.categorie || 'Non classé';
      categories.set(categorie, (categories.get(categorie) || 0) + 1);

      // Collecter les montants
      if (vente.montantTTC) {
        montants.push(vente.montantTTC);
      }

      // Détecter les problèmes
      if (!vente.id || vente.id === 'undefined' || vente.id === 'null') {
        problemes.push(`Produit sans ID valide: ${vente.produit}`);
      }

      if (vente.montantTTC && vente.montantTTC % 1 !== 0) {
        problemes.push(`Montant avec centimes: ${vente.produit} = ${vente.montantTTC}`);
      }
    });

    return {
      totalVentes: ventes.length,
      idsUniques,
      produitsUniques,
      categories,
      montants,
      problemes
    };
  }, [ventes]);

  // Analyser un fichier JSON
  const analyserFichier = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      let ventesFichier: VenteLigne[] = [];
      
      // Détecter le format du fichier
      if (Array.isArray(data)) {
        ventesFichier = data;
      } else if (data.ventes && Array.isArray(data.ventes)) {
        ventesFichier = data.ventes;
      } else if (data.data && Array.isArray(data.data)) {
        ventesFichier = data.data;
      } else {
        throw new Error('Format de fichier non reconnu');
      }

      // Analyser les ventes du fichier
      const idsUniques = new Set<string>();
      const produitsUniques = new Set<string>();
      const categories = new Map<string, number>();
      const montants: number[] = [];
      const problemes: string[] = [];

      ventesFichier.forEach((vente: any) => {
        if (vente.id) idsUniques.add(vente.id);
        if (vente.produit) produitsUniques.add(vente.produit);
        
        const categorie = vente.categorie || 'Non classé';
        categories.set(categorie, (categories.get(categorie) || 0) + 1);
        
        if (vente.montantTTC) montants.push(vente.montantTTC);
        
        if (!vente.id || vente.id === 'undefined' || vente.id === 'null') {
          problemes.push(`Produit sans ID valide: ${vente.produit}`);
        }
        
        if (vente.montantTTC && vente.montantTTC % 1 !== 0) {
          problemes.push(`Montant avec centimes: ${vente.produit} = ${vente.montantTTC}`);
        }
      });

      setFileAnalysis({
        nomFichier: file.name,
        totalVentes: ventesFichier.length,
        idsUniques: Array.from(idsUniques),
        produitsUniques: Array.from(produitsUniques),
        categories: Array.from(categories.entries()),
        montants,
        problemes,
        ventes: ventesFichier.slice(0, 10) // Premières 10 ventes pour exemple
      });

    } catch (error) {
      console.error('Erreur lors de l\'analyse du fichier:', error);
      setFileAnalysis({
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      analyserFichier(file);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon />
          Analyseur de Fichiers JSON
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Analysez vos fichiers JSON convertis pour diagnostiquer les problèmes
        </Typography>

        {/* Upload de fichier */}
        <Box sx={{ mb: 3 }}>
          <input
            accept=".json"
            style={{ display: 'none' }}
            id="json-file-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="json-file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<UploadIcon />}
            >
              Analyser un fichier JSON
            </Button>
          </label>
          {selectedFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Fichier sélectionné: {selectedFile.name}
            </Typography>
          )}
        </Box>

        {/* Analyse des ventes actuelles */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              📊 Ventes actuellement chargées ({analyseVentes.totalVentes})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Statistiques générales
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`${analyseVentes.totalVentes} ventes`} />
                <Chip label={`${analyseVentes.idsUniques.size} IDs uniques`} />
                <Chip label={`${analyseVentes.produitsUniques.size} produits uniques`} />
                <Chip label={`${analyseVentes.categories.size} catégories`} />
              </Box>
            </Box>

            {analyseVentes.problemes.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  ⚠️ {analyseVentes.problemes.length} problèmes détectés
                </Typography>
                <List dense>
                  {analyseVentes.problemes.slice(0, 5).map((probleme, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={probleme} />
                    </ListItem>
                  ))}
                  {analyseVentes.problemes.length > 5 && (
                    <ListItem>
                      <ListItemText primary={`... et ${analyseVentes.problemes.length - 5} autres problèmes`} />
                    </ListItem>
                  )}
                </List>
              </Alert>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Catégories
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Array.from(analyseVentes.categories.entries()).map(([categorie, count]) => (
                  <Chip
                    key={categorie}
                    label={`${categorie}: ${count}`}
                    color={categorie === 'Non classé' ? 'error' : 'default'}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Analyse du fichier sélectionné */}
        {fileAnalysis && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                🔍 Analyse: {fileAnalysis.nomFichier}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {fileAnalysis.error ? (
                <Alert severity="error">
                  Erreur lors de l'analyse: {fileAnalysis.error}
                </Alert>
              ) : (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Statistiques du fichier
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Chip label={`${fileAnalysis.totalVentes} ventes`} />
                      <Chip label={`${fileAnalysis.idsUniques.length} IDs uniques`} />
                      <Chip label={`${fileAnalysis.produitsUniques.length} produits uniques`} />
                      <Chip label={`${fileAnalysis.categories.length} catégories`} />
                    </Box>
                  </Box>

                  {fileAnalysis.problemes.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        ⚠️ {fileAnalysis.problemes.length} problèmes détectés
                      </Typography>
                      <List dense>
                        {fileAnalysis.problemes.slice(0, 10).map((probleme: string, index: number) => (
                          <ListItem key={index}>
                            <ListItemText primary={probleme} />
                          </ListItem>
                        ))}
                        {fileAnalysis.problemes.length > 10 && (
                          <ListItem>
                            <ListItemText primary={`... et ${fileAnalysis.problemes.length - 10} autres problèmes`} />
                          </ListItem>
                        )}
                      </List>
                    </Alert>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Catégories dans le fichier
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {fileAnalysis.categories.map(([categorie, count]: [string, number]) => (
                        <Chip
                          key={categorie}
                          label={`${categorie}: ${count}`}
                          color={categorie === 'Non classé' ? 'error' : 'default'}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Exemples de ventes (premières 10)
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Produit</TableCell>
                            <TableCell>Catégorie</TableCell>
                            <TableCell>Montant TTC</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {fileAnalysis.ventes.map((vente: any, index: number) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Chip 
                                  label={vente.id || 'N/A'} 
                                  size="small" 
                                  color={!vente.id || vente.id === 'undefined' ? 'error' : 'default'}
                                />
                              </TableCell>
                              <TableCell>{vente.produit || 'N/A'}</TableCell>
                              <TableCell>{vente.categorie || 'Non classé'}</TableCell>
                              <TableCell>{formatPrice(vente.montantTTC || 0)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        )}
      </Paper>
    </Box>
  );
};

export default JsonAnalyzer;
