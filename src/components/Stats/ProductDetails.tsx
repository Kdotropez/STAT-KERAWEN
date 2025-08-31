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
      case 'Composition':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Logique de regroupement des produits selon le mode d'affichage (mémorisée)
  const produitsRegroupes = useMemo(() => {
    if (afficherComposants) {
      // Mode "Afficher composants" : différencier les composants des articles simples
      // Pour l'instant, on utilise les mêmes données car le filtrage se fait au niveau du service
      return statistiques.ventesParProduit;
    } else {
      // Mode "Masquer composants" : les composants sont déjà filtrés au niveau du service
      // On peut juste regrouper les produits avec le même ID si nécessaire
      const produitsRegroupesMap = new Map<string, {
        id: string;
        nom: string;
        quantite: number;
        montant: number;
        prix_ttc: number;
        type: string;
        prixMoyen: number;
      }>();

      statistiques.ventesParProduit.forEach((produit: any) => {
        const idPur = produit.id;
        const existant = produitsRegroupesMap.get(idPur);
        
        if (existant) {
          // Additionner les quantités et montants
          existant.quantite += produit.quantite;
          existant.montant += produit.montant;
          
          // Recalculer le prix moyen
          existant.prixMoyen = existant.montant / existant.quantite;
        } else {
          // Nouveau produit
          produitsRegroupesMap.set(idPur, {
            id: idPur,
            nom: produit.nom,
            quantite: produit.quantite,
            montant: produit.montant,
            prix_ttc: produit.prix_ttc,
            type: produit.type,
            prixMoyen: produit.montant / produit.quantite
          });
        }
      });

      return Array.from(produitsRegroupesMap.values());
    }
  }, [afficherComposants, statistiques.ventesParProduit]);

  // Filtrage et tri des produits (mémorisé)
  const produitsFiltres = useMemo(() => {
    return produitsRegroupes
      .filter((produit: any) => {
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
  }, [produitsRegroupes, rechercheProduit, triProduit]);

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
          {afficherComposants 
            ? 'Composants et articles simples différenciés' 
            : 'Produits vendus individuellement (composants masqués)'
          } 
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


