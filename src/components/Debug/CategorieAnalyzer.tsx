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
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Category as CategoryIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { VenteLigne } from '../../types';

interface CategorieAnalyzerProps {
  ventes: VenteLigne[];
}

const CategorieAnalyzer: React.FC<CategorieAnalyzerProps> = ({ ventes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState<string>('Non classé');

  // Analyser les catégories
  const analyseCategories = useMemo(() => {
    const categories = new Map<string, {
      count: number;
      montant: number;
      produits: Set<string>;
      ids: Set<string>;
      ventes: VenteLigne[];
    }>();

    ventes.forEach(vente => {
      const categorie = vente.categorie || 'Non classé';
      const existant = categories.get(categorie) || {
        count: 0,
        montant: 0,
        produits: new Set<string>(),
        ids: new Set<string>(),
        ventes: []
      };

      existant.count++;
      existant.montant += vente.montantTTC;
      existant.produits.add(vente.produit);
      existant.ids.add(vente.id);
      existant.ventes.push(vente);

      categories.set(categorie, existant);
    });

    return Array.from(categories.entries()).map(([categorie, data]) => ({
      categorie,
      count: data.count,
      montant: data.montant,
      produits: Array.from(data.produits),
      ids: Array.from(data.ids),
      ventes: data.ventes
    })).sort((a, b) => b.count - a.count);
  }, [ventes]);

  // Filtrer les ventes de la catégorie sélectionnée
  const ventesFiltrees = useMemo(() => {
    const categorieData = analyseCategories.find(c => c.categorie === selectedCategorie);
    if (!categorieData) return [];

    return categorieData.ventes.filter(vente => 
      vente.produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vente.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [analyseCategories, selectedCategorie, searchTerm]);

  // Trouver les produits sans ID valide
  const produitsSansId = useMemo(() => {
    return ventes.filter(vente => 
      !vente.id || 
      vente.id === 'undefined' || 
      vente.id === 'null' || 
      vente.id.trim() === '' ||
      isNaN(Number(vente.id)) ||
      Number(vente.id) <= 0
    );
  }, [ventes]);

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
          <CategoryIcon />
          Analyse des Catégories
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Explorez et analysez les catégories de produits, notamment "Non classé"
        </Typography>

        {/* Résumé des catégories */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📊 Résumé par Catégorie
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {analyseCategories.map((cat) => (
              <Chip
                key={cat.categorie}
                label={`${cat.categorie}: ${cat.count} ventes (${formatPrice(cat.montant)})`}
                color={cat.categorie === 'Non classé' ? 'error' : 'default'}
                variant={selectedCategorie === cat.categorie ? 'filled' : 'outlined'}
                onClick={() => setSelectedCategorie(cat.categorie)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        {/* Produits sans ID valide */}
        {produitsSansId.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              ⚠️ {produitsSansId.length} produits sans ID valide détectés
            </Typography>
            <Typography variant="body2">
              Ces produits peuvent être classés dans "Non classé" car ils n'ont pas d'ID numérique valide.
            </Typography>
          </Alert>
        )}

        {/* Détails de la catégorie sélectionnée */}
        {selectedCategorie && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                🔍 Détails: {selectedCategorie}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  📋 Statistiques de la catégorie
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip label={`${analyseCategories.find(c => c.categorie === selectedCategorie)?.count || 0} ventes`} />
                  <Chip label={`${formatPrice(analyseCategories.find(c => c.categorie === selectedCategorie)?.montant || 0)}`} />
                  <Chip label={`${analyseCategories.find(c => c.categorie === selectedCategorie)?.produits.length || 0} produits uniques`} />
                  <Chip label={`${analyseCategories.find(c => c.categorie === selectedCategorie)?.ids.length || 0} IDs uniques`} />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  🔍 Recherche dans {selectedCategorie}
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Rechercher par nom de produit ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                />
              </Box>

              {/* Liste des produits */}
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
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ventesFiltrees.map((vente, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Chip 
                            label={vente.id} 
                            size="small" 
                            color={!vente.id || isNaN(Number(vente.id)) ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{vente.produit}</TableCell>
                        <TableCell>{vente.quantite}</TableCell>
                        <TableCell>{formatPrice(vente.prix_ttc || 0)}</TableCell>
                        <TableCell>{formatPrice(vente.montantTTC)}</TableCell>
                        <TableCell>{vente.boutique}</TableCell>
                        <TableCell>
                          {new Date(vente.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {ventesFiltrees.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Aucun produit trouvé avec ce critère de recherche
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        )}
      </Paper>
    </Box>
  );
};

export default CategorieAnalyzer;
