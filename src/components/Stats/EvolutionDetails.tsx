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
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

interface EvolutionDetailsProps {
  statistiques: any;
}

const EvolutionDetails: React.FC<EvolutionDetailsProps> = ({ statistiques }) => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarIcon color="success" />
        Évolution des Ventes par Jour
      </Typography>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Nombre de Ventes</TableCell>
              <TableCell>Quantité</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>% du CA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {statistiques.ventesParJour.map((jour: any) => (
              <TableRow key={jour.date} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {formatDate(jour.date)}
                  </Typography>
                </TableCell>
                <TableCell>{jour.nombreVentes}</TableCell>
                <TableCell>{jour.quantite}</TableCell>
                <TableCell>{formatPrice(jour.montant)}</TableCell>
                <TableCell>
                  {((jour.montant / statistiques.totalMontant) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default EvolutionDetails;
