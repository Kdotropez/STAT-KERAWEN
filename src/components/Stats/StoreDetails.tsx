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
  Store as StoreIcon
} from '@mui/icons-material';

interface StoreDetailsProps {
  statistiques: any;
}

const StoreDetails: React.FC<StoreDetailsProps> = ({ statistiques }) => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <StoreIcon color="info" />
        Ventes par Boutique
      </Typography>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Boutique</TableCell>
              <TableCell>Nombre de Ventes</TableCell>
              <TableCell>Quantité</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>% du CA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {statistiques.ventesParBoutique.map((boutique: any) => (
              <TableRow key={boutique.boutique} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {boutique.boutique}
                  </Typography>
                </TableCell>
                <TableCell>{boutique.nombreVentes}</TableCell>
                <TableCell>{boutique.quantite}</TableCell>
                <TableCell>{formatPrice(boutique.montant)}</TableCell>
                <TableCell>
                  {((boutique.montant / statistiques.totalMontant) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default StoreDetails;
