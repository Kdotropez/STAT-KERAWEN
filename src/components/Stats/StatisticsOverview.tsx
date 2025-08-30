import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Chip
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Store as StoreIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
  Undo as UndoIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import TimeBasedStats from './TimeBasedStats';

interface StatistiquesVentes {
  totalVentes: number;
  totalMontant: number;
  periodeDebut: string;
  periodeFin: string;
  ventesParProduit: any[];
  ventesParBoutique: any[];
  ventesParCategorie: any[];
  ventesParJour: any[];
  topProduits: any[];
  compositionsDecomposees: {
    nombreCompositions: number;
    composantsAjoutes: number;
    montantCompositions: number;
  };
  retours: Array<{
    produit: string;
    id: string;
    quantite: number;
    montant: number;
    date: string;
  }>;
  dateCalcul: string;
  version: string;
}

interface StatisticsOverviewProps {
  statistiques: StatistiquesVentes;
  onNavigateToSection: (section: string) => void;
}

const StatisticsOverview: React.FC<StatisticsOverviewProps> = ({ statistiques, onNavigateToSection }) => {
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

  const getTopCategories = () => {
    return statistiques.ventesParCategorie
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 3);
  };

  const getTopProducts = () => {
    return statistiques.ventesParProduit
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 5);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête avec résumé général */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          📊 Aperçu des Statistiques
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3 
        }}>
          <Box textAlign="center">
            <Typography variant="h3" fontWeight="bold">
              {statistiques.totalVentes}
            </Typography>
            <Typography variant="body1">Lignes de vente</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h3" fontWeight="bold">
              {formatPrice(statistiques.totalMontant)}
            </Typography>
            <Typography variant="body1">Chiffre d'affaires</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h3" fontWeight="bold">
              {statistiques.compositionsDecomposees.nombreCompositions}
            </Typography>
            <Typography variant="body1">Compositions vendues</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h3" fontWeight="bold">
              {statistiques.compositionsDecomposees.composantsAjoutes}
            </Typography>
            <Typography variant="body1">Composants décomposés</Typography>
          </Box>
        </Box>
        <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
          Période : {formatDate(statistiques.periodeDebut)} - {formatDate(statistiques.periodeFin)}
        </Typography>
      </Paper>

      {/* Sections de navigation */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
        gap: 3 
      }}>
        {/* Top Produits */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon color="primary" />
                Top 5 des Produits
              </Typography>
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => onNavigateToSection('produits')}
              >
                Voir détails
              </Button>
            </Box>
            <Box sx={{ mb: 2 }}>
              {getTopProducts().map((produit, index) => (
                <Box key={produit.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {index + 1}. {produit.nom}
                  </Typography>
                  <Chip 
                    label={`${produit.quantite} unités`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Top Catégories */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon color="secondary" />
                Top 3 des Catégories
              </Typography>
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => onNavigateToSection('categories')}
              >
                Voir détails
              </Button>
            </Box>
            <Box sx={{ mb: 2 }}>
              {getTopCategories().map((categorie, index) => (
                <Box key={categorie.categorie} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {index + 1}. {categorie.categorie}
                  </Typography>
                  <Chip 
                    label={`${categorie.quantite} unités`} 
                    size="small" 
                    color="secondary" 
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Ventes par Boutique */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StoreIcon color="info" />
                Ventes par Boutique
              </Typography>
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => onNavigateToSection('boutiques')}
              >
                Voir détails
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {statistiques.ventesParBoutique.length} boutiques
            </Typography>
            <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
              {formatPrice(statistiques.ventesParBoutique.reduce((total, b) => total + b.montant, 0))}
            </Typography>
          </CardContent>
        </Card>

        {/* Évolution par Jour */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon color="success" />
                Évolution par Jour
              </Typography>
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => onNavigateToSection('evolution')}
              >
                Voir détails
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {statistiques.ventesParJour.length} jours de vente
            </Typography>
            <Typography variant="h6" color="success.main" sx={{ mt: 1 }}>
              {formatPrice(statistiques.ventesParJour.reduce((total, j) => total + j.montant, 0))}
            </Typography>
          </CardContent>
        </Card>

        {/* Statistiques Temporelles */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon color="warning" />
                Statistiques Temporelles
              </Typography>
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => onNavigateToSection('temporelles')}
              >
                Voir détails
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Jour, Semaine, Mois, Année, Année Fiscale
            </Typography>
            <Typography variant="h6" color="warning.main" sx={{ mt: 1 }}>
              Analyses avancées
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="warning"
                size="small"
                startIcon={<SearchIcon />}
                onClick={() => onNavigateToSection('operations')}
                fullWidth
              >
                Opérations par Jour
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Retours et Remboursements */}
        {statistiques.retours.length > 0 && (
          <Card sx={{ height: '100%', gridColumn: { xs: '1', md: '1 / -1' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UndoIcon color="error" />
                  Retours et Remboursements
                </Typography>
                <Chip 
                  label={`${statistiques.retours.length} retours`} 
                  color="error" 
                  size="small"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                {statistiques.retours.slice(0, 5).map((retour, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {retour.produit}
                    </Typography>
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      {formatPrice(retour.montant)}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Typography variant="body2" color="error.main" fontWeight="bold">
                Total retours : {formatPrice(statistiques.retours.reduce((total, r) => total + r.montant, 0))}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Boutons d'action rapide */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          🚀 Actions Rapides
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<InventoryIcon />}
            onClick={() => onNavigateToSection('produits')}
          >
            Tous les Produits
          </Button>
          <Button
            variant="contained"
            startIcon={<CategoryIcon />}
            onClick={() => onNavigateToSection('categories')}
          >
            Toutes les Catégories
          </Button>
          <Button
            variant="contained"
            startIcon={<StoreIcon />}
            onClick={() => onNavigateToSection('boutiques')}
          >
            Toutes les Boutiques
          </Button>
          <Button
            variant="contained"
            startIcon={<CalendarIcon />}
            onClick={() => onNavigateToSection('evolution')}
          >
            Évolution Complète
          </Button>
          <Button
            variant="contained"
            startIcon={<CalendarIcon />}
            onClick={() => onNavigateToSection('temporelles')}
          >
            Statistiques Temporelles
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default StatisticsOverview;
