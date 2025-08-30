import React, { useState } from 'react';
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
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import ExcelAnalyzerService, { ProduitExcel } from '../../services/ExcelAnalyzerService';

const ExcelAnalyzerTest: React.FC = () => {
  const [produits, setProduits] = useState<ProduitExcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ProduitExcel[]>([]);

  const handleAnalyserFichier = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const service = new ExcelAnalyzerService();
      const produits = await service.analyserFichierExcel('/id produits pour mappage.xls');
      setProduits(produits);
      setSuccess(`✅ Fichier Excel analysé: ${produits.length} produits trouvés`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse du fichier Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleExporterAnalyse = async () => {
    setLoading(true);
    setError(null);

    try {
      const service = new ExcelAnalyzerService();
      service.exporterAnalyse();
      setSuccess('✅ Analyse exportée avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  const handleRechercher = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const service = new ExcelAnalyzerService();
    const results = service.chercherProduitsParMotCle(searchTerm);
    setSearchResults(results);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Composants de l'article 7788 à rechercher
  const composants7788 = [
    "SAC TRIO KDO",
    "WHITE TROPEZ 75 ROSE", 
    "VN BLANC TROPEZ",
    "VN BLANC PORT GRIMAUD"
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon />
          Analyse du Fichier Excel
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Analyse du fichier "id produits pour mappage.xls" pour trouver les correspondances des composants de l'article 7788.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleAnalyserFichier}
            disabled={loading}
          >
            Analyser le fichier Excel
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExporterAnalyse}
            disabled={loading || produits.length === 0}
          >
            Exporter l'analyse
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
      </Paper>

      {/* Recherche des composants */}
      {produits.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recherche des Composants de l'Article 7788
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Rechercher un produit"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRechercher()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button onClick={handleRechercher}>
                      <SearchIcon />
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {searchResults.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Résultats de recherche ({searchResults.length} produits)
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResults.map((produit) => (
                      <TableRow key={produit.id} hover>
                        <TableCell>
                          <Chip label={produit.id} size="small" />
                        </TableCell>
                        <TableCell>{produit.nom}</TableCell>
                        <TableCell>{produit.categorie}</TableCell>
                        <TableCell>{formatPrice(produit.prixAchatHT)}</TableCell>
                        <TableCell>{formatPrice(produit.prixVenteTTC)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Recherche automatique des composants */}
          <Typography variant="subtitle1" gutterBottom>
            Recherche Automatique des Composants
          </Typography>
          
          {composants7788.map((composant) => {
            const service = new ExcelAnalyzerService();
            const resultat = service.chercherProduitParNom(composant);
            
            return (
              <Box key={composant} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Composant: {composant}
                </Typography>
                {resultat ? (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Chip label={`ID: ${resultat.id}`} color="success" size="small" />
                    <Typography variant="body2">
                      Nom trouvé: {resultat.nom}
                    </Typography>
                    <Typography variant="body2">
                      Catégorie: {resultat.categorie}
                    </Typography>
                    <Typography variant="body2">
                      Prix: {formatPrice(resultat.prixVenteTTC)}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="error">
                    ❌ Aucune correspondance trouvée
                  </Typography>
                )}
              </Box>
            );
          })}
        </Paper>
      )}

      {/* Aperçu des produits */}
      {produits.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Aperçu des Produits ({produits.length} produits)
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
                </TableRow>
              </TableHead>
              <TableBody>
                {produits.slice(0, 20).map((produit) => (
                  <TableRow key={produit.id} hover>
                    <TableCell>
                      <Chip label={produit.id} size="small" />
                    </TableCell>
                    <TableCell>{produit.nom}</TableCell>
                    <TableCell>{produit.categorie}</TableCell>
                    <TableCell>{formatPrice(produit.prixAchatHT)}</TableCell>
                    <TableCell>{formatPrice(produit.prixVenteTTC)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {produits.length > 20 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Affichage des 20 premiers produits sur {produits.length} au total
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ExcelAnalyzerTest;


