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
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';

interface VenteJour {
  date: string;
  nombreVentes: number;
  quantite: number;
  montant: number;
}

interface PeriodStat {
  periode: string;
  nombreVentes: number;
  quantite: number;
  montant: number;
  date: string;
}

interface TimeBasedStatsProps {
  statistiques: {
    ventesParJour: VenteJour[];
    totalMontant: number;
  };
}

type PeriodType = 'jour' | 'semaine' | 'mois' | 'annee' | 'annee_fiscale';

const TimeBasedStats: React.FC<TimeBasedStatsProps> = ({ statistiques }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('jour');

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

  const formatPeriodLabel = (period: PeriodType): string => {
    switch (period) {
      case 'jour': return 'Par Jour';
      case 'semaine': return 'Par Semaine';
      case 'mois': return 'Par Mois';
      case 'annee': return 'Par Année';
      case 'annee_fiscale': return 'Année Fiscale (1/12 - 30/11)';
      default: return '';
    }
  };

  // Calcul des statistiques par période
  const periodStats = useMemo((): PeriodStat[] => {
    if (!statistiques?.ventesParJour) return [];

    const ventes = statistiques.ventesParJour;

    switch (selectedPeriod) {
      case 'jour':
        // Statistiques par jour (déjà disponibles)
        return ventes.map((vente: VenteJour) => ({
          periode: formatDate(vente.date),
          nombreVentes: vente.nombreVentes,
          quantite: vente.quantite,
          montant: vente.montant,
          date: vente.date
        }));

      case 'semaine':
        // Grouper par semaine
        const weekStats = new Map<string, PeriodStat>();
        ventes.forEach((vente: VenteJour) => {
          const date = new Date(vente.date);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay()); // Début de semaine (dimanche)
          const weekKey = weekStart.toISOString().split('T')[0];
          
          if (!weekStats.has(weekKey)) {
            weekStats.set(weekKey, {
              periode: `Semaine du ${formatDate(weekKey)}`,
              nombreVentes: 0,
              quantite: 0,
              montant: 0,
              date: weekKey
            });
          }
          
          const week = weekStats.get(weekKey)!;
          week.nombreVentes += vente.nombreVentes;
          week.quantite += vente.quantite;
          week.montant += vente.montant;
        });
        return Array.from(weekStats.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      case 'mois':
        // Grouper par mois
        const monthStats = new Map<string, PeriodStat>();
        ventes.forEach((vente: VenteJour) => {
          const date = new Date(vente.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthStats.has(monthKey)) {
            monthStats.set(monthKey, {
              periode: `${date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
              nombreVentes: 0,
              quantite: 0,
              montant: 0,
              date: monthKey
            });
          }
          
          const month = monthStats.get(monthKey)!;
          month.nombreVentes += vente.nombreVentes;
          month.quantite += vente.quantite;
          month.montant += vente.montant;
        });
        return Array.from(monthStats.values()).sort((a, b) => a.date.localeCompare(b.date));

      case 'annee':
        // Grouper par année
        const yearStats = new Map<string, PeriodStat>();
        ventes.forEach((vente: VenteJour) => {
          const date = new Date(vente.date);
          const yearKey = date.getFullYear().toString();
          
          if (!yearStats.has(yearKey)) {
            yearStats.set(yearKey, {
              periode: `Année ${yearKey}`,
              nombreVentes: 0,
              quantite: 0,
              montant: 0,
              date: yearKey
            });
          }
          
          const year = yearStats.get(yearKey)!;
          year.nombreVentes += vente.nombreVentes;
          year.quantite += vente.quantite;
          year.montant += vente.montant;
        });
        return Array.from(yearStats.values()).sort((a, b) => a.date.localeCompare(b.date));

      case 'annee_fiscale':
        // Année fiscale du 1er décembre au 30 novembre
        const fiscalYearStats = new Map<string, PeriodStat>();
        ventes.forEach((vente: VenteJour) => {
          const date = new Date(vente.date);
          const month = date.getMonth() + 1;
          const year = date.getFullYear();
          
          // Déterminer l'année fiscale
          let fiscalYear = year;
          if (month === 12) {
            fiscalYear = year + 1; // Décembre appartient à l'année fiscale suivante
          }
          
          const fiscalKey = fiscalYear.toString();
          
          if (!fiscalYearStats.has(fiscalKey)) {
            fiscalYearStats.set(fiscalKey, {
              periode: `Année fiscale ${fiscalYear-1}-${fiscalYear} (1/12/${fiscalYear-1} - 30/11/${fiscalYear})`,
              nombreVentes: 0,
              quantite: 0,
              montant: 0,
              date: fiscalKey
            });
          }
          
          const fiscal = fiscalYearStats.get(fiscalKey)!;
          fiscal.nombreVentes += vente.nombreVentes;
          fiscal.quantite += vente.quantite;
          fiscal.montant += vente.montant;
        });
        return Array.from(fiscalYearStats.values()).sort((a, b) => a.date.localeCompare(b.date));

      default:
        return [];
    }
  }, [statistiques, selectedPeriod]);

  // Calcul des tendances
  const trends = useMemo(() => {
    if (periodStats.length < 2) return null;

    const current = periodStats[periodStats.length - 1];
    const previous = periodStats[periodStats.length - 2];

    const montantChange = ((current.montant - previous.montant) / previous.montant) * 100;
    const quantiteChange = ((current.quantite - previous.quantite) / previous.quantite) * 100;

    return {
      montant: {
        change: montantChange,
        trend: montantChange > 0 ? 'up' : 'down'
      },
      quantite: {
        change: quantiteChange,
        trend: quantiteChange > 0 ? 'up' : 'down'
      }
    };
  }, [periodStats]);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarIcon color="primary" />
        Statistiques Temporelles
      </Typography>

      {/* Sélecteur de période */}
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={selectedPeriod}
          exclusive
          onChange={(_, newPeriod) => newPeriod && setSelectedPeriod(newPeriod)}
          aria-label="période"
          size="small"
        >
          <ToggleButton value="jour" aria-label="jour">
            Jour
          </ToggleButton>
          <ToggleButton value="semaine" aria-label="semaine">
            Semaine
          </ToggleButton>
          <ToggleButton value="mois" aria-label="mois">
            Mois
          </ToggleButton>
          <ToggleButton value="annee" aria-label="annee">
            Année
          </ToggleButton>
          <ToggleButton value="annee_fiscale" aria-label="annee_fiscale">
            Année Fiscale
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

             {/* Résumé de la période */}
       {periodStats.length > 0 && (
         <Box sx={{ mb: 3 }}>
           <Box sx={{
             display: 'grid',
             gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
             gap: 2
           }}>
             <Card>
               <CardContent>
                 <Typography variant="h6" color="text.secondary">
                   Périodes analysées
                 </Typography>
                 <Typography variant="h4">
                   {periodStats.length}
                 </Typography>
               </CardContent>
             </Card>
             <Card>
               <CardContent>
                 <Typography variant="h6" color="text.secondary">
                   Total Ventes
                 </Typography>
                 <Typography variant="h4">
                   {periodStats.reduce((sum: number, p: PeriodStat) => sum + p.nombreVentes, 0)}
                 </Typography>
               </CardContent>
             </Card>
             <Card>
               <CardContent>
                 <Typography variant="h6" color="text.secondary">
                   Total Quantité
                 </Typography>
                 <Typography variant="h4">
                   {periodStats.reduce((sum: number, p: PeriodStat) => sum + p.quantite, 0)}
                 </Typography>
               </CardContent>
             </Card>
             <Card>
               <CardContent>
                 <Typography variant="h6" color="text.secondary">
                   Total Montant
                 </Typography>
                 <Typography variant="h4">
                   {formatPrice(periodStats.reduce((sum: number, p: PeriodStat) => sum + p.montant, 0))}
                 </Typography>
               </CardContent>
             </Card>
           </Box>
         </Box>
       )}

             {/* Tendances */}
       {trends && (
         <Box sx={{ mb: 3 }}>
           <Typography variant="h6" gutterBottom>
             Tendances (vs période précédente)
           </Typography>
           <Box sx={{
             display: 'grid',
             gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
             gap: 2
           }}>
             <Card>
               <CardContent>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   {trends.montant.trend === 'up' ? (
                     <TrendingUpIcon color="success" />
                   ) : (
                     <TrendingDownIcon color="error" />
                   )}
                   <Typography variant="h6">
                     Montant: {trends.montant.change > 0 ? '+' : ''}{trends.montant.change.toFixed(1)}%
                   </Typography>
                 </Box>
               </CardContent>
             </Card>
             <Card>
               <CardContent>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   {trends.quantite.trend === 'up' ? (
                     <TrendingUpIcon color="success" />
                   ) : (
                     <TrendingDownIcon color="error" />
                   )}
                   <Typography variant="h6">
                     Quantité: {trends.quantite.change > 0 ? '+' : ''}{trends.quantite.change.toFixed(1)}%
                   </Typography>
                 </Box>
               </CardContent>
             </Card>
           </Box>
         </Box>
       )}

      {/* Tableau détaillé */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Période</TableCell>
              <TableCell>Nombre de Ventes</TableCell>
              <TableCell>Quantité</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>% du CA Total</TableCell>
            </TableRow>
          </TableHead>
                     <TableBody>
             {periodStats.map((stat: PeriodStat, index: number) => (
               <TableRow key={index} hover>
                 <TableCell>
                   <Typography variant="body2" fontWeight="bold">
                     {stat.periode}
                   </Typography>
                 </TableCell>
                 <TableCell>{stat.nombreVentes}</TableCell>
                 <TableCell>{stat.quantite}</TableCell>
                 <TableCell>{formatPrice(stat.montant)}</TableCell>
                 <TableCell>
                   {((stat.montant / statistiques.totalMontant) * 100).toFixed(1)}%
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TimeBasedStats;
