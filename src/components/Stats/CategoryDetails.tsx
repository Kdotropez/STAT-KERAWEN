import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Category as CategoryIcon
} from '@mui/icons-material';

interface CategoryDetailsProps {
  statistiques: any;
}

const CategoryDetails: React.FC<CategoryDetailsProps> = ({ statistiques }) => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CategoryIcon color="secondary" />
        Ventes par Catégorie
      </Typography>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Catégorie</TableCell>
              <TableCell>Types de Produits</TableCell>
              <TableCell>Unités Vendues</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>% du CA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {statistiques.ventesParCategorie.map((categorie: any) => (
              <TableRow key={categorie.categorie} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {categorie.categorie}
                  </Typography>
                </TableCell>
                <TableCell>{categorie.nombreProduits}</TableCell>
                <TableCell>{categorie.quantite}</TableCell>
                <TableCell>{formatPrice(categorie.montant)}</TableCell>
                <TableCell>
                  {((categorie.montant / statistiques.totalMontant) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default CategoryDetails;
