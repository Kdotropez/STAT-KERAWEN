import React, { useState, useEffect } from 'react';
import StatisticsOverview from './StatisticsOverview';
import ProductDetails from './ProductDetails';
import CategoryDetails from './CategoryDetails';
import StoreDetails from './StoreDetails';
import EvolutionDetails from './EvolutionDetails';
import TimeBasedStats from './TimeBasedStats';
import DailyOperationsDetails from './DailyOperationsDetails';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { StatistiquesVentes, StatisticsService } from '../../services/StatisticsService';
import { VenteLigne } from '../../types';

interface StatisticsDashboardProps {
  ventes?: VenteLigne[];
}

const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ ventes = [] }) => {
  const [statisticsService] = useState(() => new StatisticsService());
  const [ventesOriginales, setVentesOriginales] = useState<VenteLigne[]>([]);
  const [statistiques, setStatistiques] = useState<StatistiquesVentes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<'overview' | 'produits' | 'categories' | 'boutiques' | 'evolution' | 'temporelles' | 'operations'>('overview');

  const calculerStatistiques = async () => {
    setLoading(true);
    setError(null);

    try {
      // Si des ventes sont passées en props, les sauvegarder d'abord
      if (ventes.length > 0) {
        await statisticsService.sauvegarderVentes(ventes);
        setVentesOriginales(ventes); // Garder les ventes originales pour l'analyse
      }

      // Calculer les statistiques
      const stats = await statisticsService.calculerStatistiques();
      setStatistiques(stats);
      console.log('📊 Statistiques calculées:', stats);
      
    } catch (error) {
      console.error('❌ Erreur lors du calcul des statistiques:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const viderVentes = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer toutes les ventes ?')) {
      localStorage.removeItem('ventes-importees');
      setStatistiques(null);
      setVentesOriginales([]);
      console.log('🗑️ Toutes les ventes ont été supprimées');
    }
  };

  const exporterStatistiques = () => {
    if (!statistiques) return;

    const nomFichier = `statistiques-${new Date().toISOString().split('T')[0]}.json`;
    const contenu = JSON.stringify(statistiques, null, 2);
    
    const blob = new Blob([contenu], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nomFichier;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(url);
    
    console.log(`📁 Statistiques exportées: ${nomFichier}`);
  };

  // Charger les statistiques au montage du composant
  useEffect(() => {
    calculerStatistiques();
  }, [ventes]);

  const handleNavigateToSection = (section: string) => {
    setCurrentSection(section as any);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Calcul des statistiques en cours...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!statistiques || statistiques.totalVentes === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Aucune donnée de vente disponible
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Importez des fichiers de vente pour voir les statistiques
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête avec actions et navigation */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            📊 Tableau de Bord des Ventes
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {currentSection !== 'overview' && (
              <Button
                variant="outlined"
                onClick={() => setCurrentSection('overview')}
                startIcon={<ArrowBackIcon />}
              >
                Retour à l'aperçu
              </Button>
            )}
            <Tooltip title="Recalculer les statistiques">
              <IconButton onClick={calculerStatistiques} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Exporter les statistiques">
              <IconButton onClick={exporterStatistiques} color="success">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer toutes les ventes">
              <IconButton onClick={viderVentes} color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Contenu principal selon la section */}
      {currentSection === 'overview' ? (
        <StatisticsOverview 
          statistiques={statistiques} 
          onNavigateToSection={handleNavigateToSection}
        />
      ) : (
        <Box>
          {/* Section Produits */}
          {currentSection === 'produits' && (
            <ProductDetails statistiques={statistiques} />
          )}
          
          {/* Section Catégories */}
          {currentSection === 'categories' && (
            <CategoryDetails statistiques={statistiques} />
          )}
          
          {/* Section Boutiques */}
          {currentSection === 'boutiques' && (
            <StoreDetails statistiques={statistiques} />
          )}
          
          {/* Section Évolution */}
          {currentSection === 'evolution' && (
            <EvolutionDetails statistiques={statistiques} />
          )}
          
          {/* Section Statistiques Temporelles */}
          {currentSection === 'temporelles' && (
            <TimeBasedStats statistiques={statistiques} />
          )}
          
          {/* Section Opérations Détaillées par Jour */}
          {currentSection === 'operations' && (
            <DailyOperationsDetails 
              statistiques={statistiques} 
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default StatisticsDashboard;
