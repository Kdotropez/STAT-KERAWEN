import React, { useState } from 'react';
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
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Inventory as InventoryIcon
} from '@mui/icons-material';

interface ProductDetailsProps {
  statistiques: any;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ statistiques }) => {
  const [rechercheProduit, setRechercheProduit] = useState('');
  const [triProduit, setTriProduit] = useState('quantite');
  const [afficherComposants, setAfficherComposants] = useState(true);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Simple':
        return 'success';
      case 'Composant':
        return 'secondary';
      case 'Mixte':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Filtrage et tri des produits
  const produitsFiltres = statistiques.ventesParProduit
    .filter((produit: any) => {
      // Filtrage par type (composants ou non)
      if (!afficherComposants && produit.type === 'Composant') {
        return false;
      }
      
      // Filtrage par recherche
      if (!rechercheProduit) return true;
      const recherche = rechercheProduit.toLowerCase();
      return produit.nom.toLowerCase().includes(recherche) || 
             produit.id.toLowerCase().includes(recherche);
    })
    .sort((a: any, b: any) => {
      switch (triProduit) {
        case 'quantite':
          return b.quantite - a.quantite;
        case 'montant':
          return b.montant - a.montant;
        case 'nom':
          return a.nom.localeCompare(b.nom);
        case 'id':
          return a.id.localeCompare(b.id);
        default:
          return 0;
      }
    });

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InventoryIcon color="primary" />
        Ventes par Produit
      </Typography>

      {/* Contrôles de recherche et tri */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Rechercher un produit"
          variant="outlined"
          size="small"
          value={rechercheProduit}
          onChange={(e) => setRechercheProduit(e.target.value)}
          sx={{ minWidth: 250 }}
          placeholder="Ex: VN TROPEZ, BK VERRE..."
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Trier par</InputLabel>
          <Select
            value={triProduit}
            label="Trier par"
            onChange={(e) => setTriProduit(e.target.value)}
          >
            <MenuItem value="quantite">Quantité (décroissant)</MenuItem>
            <MenuItem value="montant">Montant (décroissant)</MenuItem>
            <MenuItem value="nom">Nom (A-Z)</MenuItem>
            <MenuItem value="id">ID (croissant)</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant={afficherComposants ? "contained" : "outlined"}
          size="small"
          onClick={() => setAfficherComposants(!afficherComposants)}
        >
          {afficherComposants ? 'Masquer composants' : 'Afficher composants'}
        </Button>
      </Box>

      {/* Statistiques de filtrage */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {afficherComposants ? 'Tous les produits' : 'Produits simples uniquement'} 
          ({produitsFiltres.length} produits visibles sur {statistiques.ventesParProduit.length})
        </Typography>
      </Box>

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Produit</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Quantité</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Prix Moyen</TableCell>
              <TableCell>% du CA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {produitsFiltres.map((produit: any) => (
              <TableRow key={produit.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {produit.nom}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {produit.id}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={produit.type} 
                    size="small" 
                    color={getTypeColor(produit.type) as any}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{produit.quantite}</TableCell>
                <TableCell>{formatPrice(produit.montant)}</TableCell>
                <TableCell>{formatPrice(produit.montant / produit.quantite)}</TableCell>
                <TableCell>
                  {((produit.montant / statistiques.totalMontant) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ProductDetails;


