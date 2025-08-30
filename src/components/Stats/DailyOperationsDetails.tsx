import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, ButtonGroup, Card, CardContent, IconButton, Tooltip, Chip, Alert, TextField, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemButton
} from '@mui/material';
import {
  Download as DownloadIcon, Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon, CalendarViewDay as DayIcon, CalendarViewWeek as WeekIcon,
  CalendarViewMonth as MonthIcon, FilterList as FilterIcon
} from '@mui/icons-material';
import { StatistiquesVentes } from '../../services/StatisticsService';
import { StatisticsService } from '../../services/StatisticsService';
import { VenteLigne } from '../../types';

interface DailyOperationsDetailsProps {
  statistiques: StatistiquesVentes;
}

type GroupementType = 'jour' | 'semaine' | 'mois' | 'operation';

interface GroupeVentes {
  periode: string;
  ventes: VenteLigne[];
  totalMontant: number;
  totalQuantite: number;
  nombreOperations: number;
  boutiques: string[];
  numeroOperation?: string; // Pour le groupement par opération
}

export const DailyOperationsDetails: React.FC<DailyOperationsDetailsProps> = ({
  statistiques
}) => {
  const [groupement, setGroupement] = useState<GroupementType>('operation');
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const [ventes, setVentes] = useState<VenteLigne[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreOperation, setFiltreOperation] = useState<string>('');
  
  // Nouveaux états pour la fonctionnalité demandée
  const [showOperationsDialog, setShowOperationsDialog] = useState<{ [key: string]: boolean }>({});
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [showOperationDetails, setShowOperationDetails] = useState(false);
  
  // Nouveaux états pour le sélecteur de date
  const [dateFiltre, setDateFiltre] = useState<string>('');
  const [vueSimplifiee, setVueSimplifiee] = useState<boolean>(false);

  // Charger les ventes depuis le StatisticsService
  useEffect(() => {
    const chargerVentes = async () => {
      try {
        const statisticsService = new StatisticsService();
        const ventesChargees = await statisticsService.chargerVentes();
        setVentes(ventesChargees);
        console.log('🔍 DailyOperationsDetails - Ventes chargées:', ventesChargees.length);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des ventes:', error);
      } finally {
        setLoading(false);
      }
    };

    chargerVentes();
  }, []);

  // Debug: afficher le nombre de ventes reçues
  console.log('🔍 DailyOperationsDetails - Nombre de ventes reçues:', ventes.length);
  console.log('🔍 DailyOperationsDetails - Première vente:', ventes[0]);

  // Extraire tous les numéros d'opération uniques
  const numerosOperations = useMemo(() => {
    const ops = new Set<string>();
    ventes.forEach(vente => {
      if (vente.numeroOperation) {
        ops.add(vente.numeroOperation);
      }
    });
    
    // Debug pour voir les numéros d'opération
    console.log('🔍 Debug - Numéros d\'opération trouvés:', Array.from(ops));
    console.log('🔍 Debug - Première vente:', ventes[0]);
    console.log('🔍 Debug - Propriétés de la première vente:', Object.keys(ventes[0] || {}));
    
    return Array.from(ops).sort();
  }, [ventes]);

  // Filtrer les ventes par numéro d'opération et/ou date si des filtres sont appliqués
  const ventesFiltrees = useMemo(() => {
    let ventesFiltrees = ventes;
    
    // Filtre par numéro d'opération
    if (filtreOperation) {
      ventesFiltrees = ventesFiltrees.filter(vente => vente.numeroOperation === filtreOperation);
    }
    
    // Filtre par date
    if (dateFiltre) {
      const dateFiltreObj = new Date(dateFiltre);
      const dateFiltreStr = dateFiltreObj.toISOString().split('T')[0];
      
      ventesFiltrees = ventesFiltrees.filter(vente => {
        const dateVente = new Date(vente.date);
        const dateVenteStr = dateVente.toISOString().split('T')[0];
        return dateVenteStr === dateFiltreStr;
      });
    }
    
    return ventesFiltrees;
  }, [ventes, filtreOperation, dateFiltre]);

  // Grouper les ventes selon le type de groupement
  const groupesVentes = useMemo(() => {
    const groupes = new Map<string, VenteLigne[]>();
    
    ventesFiltrees.forEach(vente => {
      let periode: string;
      
      if (groupement === 'operation') {
        // Grouper par numéro d'opération
        periode = vente.numeroOperation || 'Sans numéro';
      } else {
        const date = new Date(vente.date);
        
        switch (groupement) {
          case 'jour':
            periode = date.toLocaleDateString('fr-FR');
            break;
          case 'semaine':
            const semaine = getWeekNumber(date);
            periode = `Semaine ${semaine} (${date.getFullYear()})`;
            break;
          case 'mois':
            periode = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            break;
          default:
            periode = date.toLocaleDateString('fr-FR');
        }
      }
      
      if (!groupes.has(periode)) {
        groupes.set(periode, []);
      }
      groupes.get(periode)!.push(vente);
    });

    const resultat: GroupeVentes[] = [];
    
    groupes.forEach((ventesGroupe, periode) => {
      const totalMontant = ventesGroupe.reduce((sum, v) => sum + (v.montantTTC || 0), 0);
      const totalQuantite = ventesGroupe.reduce((sum, v) => sum + (v.quantite || 0), 0);
      const boutiques = Array.from(new Set(ventesGroupe.map(v => v.boutique)));
      
      resultat.push({
        periode,
        ventes: ventesGroupe,
        totalMontant,
        totalQuantite,
        nombreOperations: ventesGroupe.length,
        boutiques,
        numeroOperation: groupement === 'operation' ? periode : undefined
      });
    });

    return resultat.sort((a, b) => {
      if (groupement === 'operation') {
        // Trier par numéro d'opération (traitement numérique)
        const numA = parseInt(a.periode) || 0;
        const numB = parseInt(b.periode) || 0;
        return numA - numB;
      } else if (groupement === 'jour') {
        return new Date(a.ventes[0]?.date || 0).getTime() - new Date(b.ventes[0]?.date || 0).getTime();
      }
      // Pour les autres cas (semaine, mois, année), utiliser localeCompare seulement si periode est une string
      if (typeof a.periode === 'string' && typeof b.periode === 'string') {
        return a.periode.localeCompare(b.periode);
      }
      return 0;
    });
  }, [ventesFiltrees, groupement]);

  // Calculer les totaux globaux
  const totaux = useMemo(() => {
    return groupesVentes.reduce((acc, groupe) => ({
      montant: acc.montant + groupe.totalMontant,
      quantite: acc.quantite + groupe.totalQuantite,
      operations: acc.operations + groupe.nombreOperations
    }), { montant: 0, quantite: 0, operations: 0 });
  }, [groupesVentes]);

  const toggleDetails = (periode: string) => {
    setShowDetails(prev => ({
      ...prev,
      [periode]: !prev[periode]
    }));
  };

  // Nouvelles fonctions pour la fonctionnalité demandée
  const toggleOperationsDialog = (periode: string) => {
    setShowOperationsDialog(prev => ({
      ...prev,
      [periode]: !prev[periode]
    }));
  };

  const handleOperationClick = (numeroOperation: string) => {
    setSelectedOperation(numeroOperation);
    setShowOperationDetails(true);
    setShowOperationsDialog(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}));
  };

  const closeOperationDetails = () => {
    setShowOperationDetails(false);
    setSelectedOperation(null);
  };

  // Obtenir les numéros d'opérations pour une période donnée
  const getOperationsForPeriod = (periode: string) => {
    const groupe = groupesVentes.find(g => g.periode === periode);
    if (!groupe) return [];
    
    const operations = new Set<string>();
    groupe.ventes.forEach(vente => {
      if (vente.numeroOperation) {
        operations.add(vente.numeroOperation);
      }
    });
    return Array.from(operations).sort();
  };

  // Obtenir les ventes pour un numéro d'opération spécifique
  const getVentesForOperation = (numeroOperation: string) => {
    return ventes.filter(vente => vente.numeroOperation === numeroOperation);
  };

  const exporterOperations = () => {
    const data = groupesVentes.map(groupe => ({
      periode: groupe.periode,
      numeroOperation: groupe.numeroOperation,
      totalMontant: groupe.totalMontant,
      totalQuantite: groupe.totalQuantite,
      nombreOperations: groupe.nombreOperations,
      boutiques: groupe.boutiques.join(', '),
      ventes: groupe.ventes.map(v => ({
        nom: v.nom,
        boutique: v.boutique,
        quantite: v.quantite,
        montantTTC: v.montantTTC,
        date: new Date(v.date).toLocaleString('fr-FR'),
        numeroOperation: v.numeroOperation
      }))
    }));

    const nomFichier = `operations-${groupement}-${new Date().toISOString().split('T')[0]}.json`;
    const contenu = JSON.stringify(data, null, 2);
    
    const blob = new Blob([contenu], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nomFichier;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(url);
  };

  // Fonction pour obtenir le numéro de semaine
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Chargement des données...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête avec titre et actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            📊 Toutes les Opérations - Vue Détaillée
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Exporter les données">
              <IconButton onClick={exporterOperations} color="primary">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
          Visualisez toutes vos opérations groupées par période pour identifier l'écart de 26,40€
        </Typography>

        {/* Debug info */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Debug :</strong> {ventes.length} ventes reçues | {groupesVentes.length} groupes créés | {numerosOperations.length} numéros d'opération uniques
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Premiers numéros d'opération :</strong> {numerosOperations.slice(0, 10).join(', ')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Propriétés de la première vente :</strong> {ventes[0] ? Object.keys(ventes[0]).join(', ') : 'Aucune vente'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Numéro d'opération de la première vente :</strong> {ventes[0]?.numeroOperation || 'Non défini'}
          </Typography>
        </Alert>

        {/* Filtres */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 2, mb: 2 }}>
          {/* Filtre par numéro d'opération */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FilterIcon color="action" />
            <Typography variant="subtitle1">Filtrer par #Op :</Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Numéro d'opération</InputLabel>
              <Select
                value={filtreOperation}
                label="Numéro d'opération"
                onChange={(e) => setFiltreOperation(e.target.value)}
              >
                <MenuItem value="">
                  <em>Toutes les opérations</em>
                </MenuItem>
                {numerosOperations.map(numOp => (
                  <MenuItem key={numOp} value={numOp}>
                    #{numOp}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {filtreOperation && (
              <Button 
                size="small" 
                onClick={() => setFiltreOperation('')}
                variant="outlined"
              >
                Effacer
              </Button>
            )}
          </Box>

          {/* Filtre par date */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1">Filtrer par date :</Typography>
            <TextField
              type="date"
              size="small"
              value={dateFiltre}
              onChange={(e) => setDateFiltre(e.target.value)}
              sx={{ minWidth: 150 }}
            />
            {dateFiltre && (
              <Button 
                size="small" 
                onClick={() => setDateFiltre('')}
                variant="outlined"
              >
                Effacer
              </Button>
            )}
          </Box>

          {/* Bouton vue simplifiée */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant={vueSimplifiee ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setVueSimplifiee(!vueSimplifiee)}
              startIcon={<VisibilityIcon />}
            >
              {vueSimplifiee ? 'Vue Détaillée' : 'Vue Simplifiée'}
            </Button>
          </Box>
        </Box>

        {/* Sélecteur de groupement */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1">Groupement :</Typography>
          <ButtonGroup variant="outlined" size="small">
            <Button
              startIcon={<DayIcon />}
              variant={groupement === 'jour' ? 'contained' : 'outlined'}
              onClick={() => setGroupement('jour')}
            >
              Par Jour
            </Button>
            <Button
              startIcon={<WeekIcon />}
              variant={groupement === 'semaine' ? 'contained' : 'outlined'}
              onClick={() => setGroupement('semaine')}
            >
              Par Semaine
            </Button>
            <Button
              startIcon={<MonthIcon />}
              variant={groupement === 'mois' ? 'contained' : 'outlined'}
              onClick={() => setGroupement('mois')}
            >
              Par Mois
            </Button>
            <Button
              variant={groupement === 'operation' ? 'contained' : 'outlined'}
              onClick={() => setGroupement('operation')}
            >
              Par #Op
            </Button>
          </ButtonGroup>
        </Box>
      </Paper>

      {/* Résumé des totaux */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📈 Totaux Globaux ({groupesVentes.length} {groupement === 'jour' ? 'jours' : groupement === 'semaine' ? 'semaines' : groupement === 'mois' ? 'mois' : 'opérations'})
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Montant
              </Typography>
              <Typography variant="h4" color="primary">
                {totaux.montant.toFixed(2)} €
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Quantité
              </Typography>
              <Typography variant="h4" color="secondary">
                {totaux.quantite.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Nombre d'Opérations
              </Typography>
              <Typography variant="h4" color="success.main">
                {totaux.operations.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Paper>

      {/* Tableau des opérations */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📋 {vueSimplifiee ? 'Tableau de Bord Simplifié' : 'Détail des Opérations'}
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  {groupement === 'operation' ? 'Numéro #Op' : 'Période'}
                </TableCell>
                <TableCell>Boutiques</TableCell>
                <TableCell align="right">Montant Total</TableCell>
                <TableCell align="right">Quantité</TableCell>
                <TableCell align="right">Articles</TableCell>
                {groupement === 'operation' && !vueSimplifiee && (
                  <TableCell>Articles de l'opération</TableCell>
                )}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupesVentes.map((groupe) => (
                <React.Fragment key={groupe.periode}>
                  <TableRow hover>
                    <TableCell>
                      <Typography 
                        variant="subtitle2" 
                        fontWeight="bold" 
                        color="primary"
                        sx={{ 
                          cursor: vueSimplifiee && groupement === 'operation' ? 'pointer' : 'default',
                          '&:hover': vueSimplifiee && groupement === 'operation' ? { textDecoration: 'underline' } : {}
                        }}
                        onClick={() => {
                          if (vueSimplifiee && groupement === 'operation') {
                            setSelectedOperation(groupe.periode);
                            setShowOperationDetails(true);
                          }
                        }}
                      >
                        {groupement === 'operation' ? `#${groupe.periode}` : groupe.periode}
                      </Typography>
                      {groupement === 'operation' && groupe.ventes[0] && (
                        <Typography variant="caption" color="textSecondary">
                          {new Date(groupe.ventes[0].date).toLocaleDateString('fr-FR')} - {groupe.ventes.length} articles
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {groupe.boutiques.map(boutique => (
                          <Chip 
                            key={boutique} 
                            label={boutique} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle1" color="primary">
                        {groupe.totalMontant.toFixed(2)} €
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {groupe.totalQuantite.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {groupe.ventes.length.toLocaleString()}
                    </TableCell>
                    {groupement === 'operation' && !vueSimplifiee && (
                      <TableCell>
                        <Box sx={{ maxHeight: 100, overflowY: 'auto' }}>
                          {groupe.ventes.slice(0, 5).map((vente, index) => (
                            <Typography key={index} variant="caption" display="block">
                              • {vente.nom} (x{vente.quantite}) - {vente.montantTTC.toFixed(2)}€
                            </Typography>
                          ))}
                          {groupe.ventes.length > 5 && (
                            <Typography variant="caption" color="textSecondary">
                              ... et {groupe.ventes.length - 5} autres articles
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {vueSimplifiee && groupement === 'operation' ? (
                          <Tooltip title="Cliquer sur le numéro d'opération pour voir les détails">
                            <Typography variant="caption" color="textSecondary">
                              Cliquez sur #
                            </Typography>
                          </Tooltip>
                        ) : (
                          <>
                            {/* Icône pour voir tous les détails */}
                            <Tooltip title={showDetails[groupe.periode] ? "Masquer les détails" : "Voir tous les détails"}>
                              <IconButton 
                                onClick={() => toggleDetails(groupe.periode)}
                                size="small"
                                color="primary"
                              >
                                {showDetails[groupe.periode] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                  
                  {/* Détails des ventes pour cette période */}
                  {showDetails[groupe.periode] && !vueSimplifiee && (
                    <TableRow>
                      <TableCell colSpan={groupement === 'operation' ? 7 : 6} sx={{ p: 0 }}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Détails des {groupe.ventes.length} opérations de {groupement === 'operation' ? `#${groupe.periode}` : groupe.periode}
                          </Typography>
                          
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Produit</TableCell>
                                <TableCell>Boutique</TableCell>
                                <TableCell align="right">Quantité</TableCell>
                                <TableCell align="right">Montant TTC</TableCell>
                                <TableCell>Heure</TableCell>
                                {groupement !== 'operation' && <TableCell>#Op</TableCell>}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {groupe.ventes.map((vente, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    {new Date(vente.date).toLocaleDateString('fr-FR')}
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {vente.produit}
                                    </Typography>
                                    {vente.id && (
                                      <Typography variant="caption" color="textSecondary">
                                        ID: {vente.id}
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>{vente.boutique}</TableCell>
                                  <TableCell align="right">{vente.quantite}</TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" color="primary">
                                      {vente.montantTTC.toFixed(2)} €
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    {new Date(vente.date).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </TableCell>
                                  {groupement !== 'operation' && (
                                    <TableCell>
                                      {vente.numeroOperation ? `#${vente.numeroOperation}` : '-'}
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {groupesVentes.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              Aucune opération trouvée
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Dialog pour afficher les numéros d'opérations */}
      {Object.keys(showOperationsDialog).map(periode => (
        showOperationsDialog[periode] && (
          <Dialog 
            key={periode}
            open={showOperationsDialog[periode]} 
            onClose={() => toggleOperationsDialog(periode)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              📋 Numéros d'opérations pour {periode}
            </DialogTitle>
            <DialogContent>
              <List>
                {getOperationsForPeriod(periode).map(numOp => (
                  <ListItem key={numOp} disablePadding>
                    <ListItemButton onClick={() => handleOperationClick(numOp)}>
                      <ListItemText 
                        primary={`#${numOp}`}
                        secondary={`Cliquez pour voir le détail de cette opération`}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              {getOperationsForPeriod(periode).length === 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
                  Aucun numéro d'opération trouvé pour cette période
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => toggleOperationsDialog(periode)}>
                Fermer
              </Button>
            </DialogActions>
          </Dialog>
        )
      ))}

      {/* Dialog pour afficher le détail d'une opération spécifique */}
      <Dialog 
        open={showOperationDetails} 
        onClose={closeOperationDetails}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          🔍 Détail de l'opération #{selectedOperation}
        </DialogTitle>
        <DialogContent>
          {selectedOperation && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                {getVentesForOperation(selectedOperation).length} articles dans cette opération
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Heure</TableCell>
                      <TableCell>Produit</TableCell>
                      <TableCell>Boutique</TableCell>
                      <TableCell align="right">Quantité</TableCell>
                      <TableCell align="right">Prix unitaire</TableCell>
                      <TableCell align="right">Montant TTC</TableCell>
                      <TableCell>Client</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getVentesForOperation(selectedOperation).map((vente, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(vente.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          {new Date(vente.date).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {vente.produit}
                          </Typography>
                          {vente.id && (
                            <Typography variant="caption" color="textSecondary">
                              ID: {vente.id}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{vente.boutique}</TableCell>
                        <TableCell align="right">{vente.quantite}</TableCell>
                        <TableCell align="right">
                          {vente.prix_ttc ? `${vente.prix_ttc.toFixed(2)} €` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="primary">
                            {vente.montantTTC.toFixed(2)} €
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {vente.client || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Résumé de l'opération */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📊 Résumé de l'opération #{selectedOperation}
                </Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Typography variant="body2">
                    <strong>Total montant:</strong> {getVentesForOperation(selectedOperation).reduce((sum, v) => sum + (v.montantTTC || 0), 0).toFixed(2)} €
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total quantité:</strong> {getVentesForOperation(selectedOperation).reduce((sum, v) => sum + (v.quantite || 0), 0)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Articles:</strong> {getVentesForOperation(selectedOperation).length}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeOperationDetails}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DailyOperationsDetails;
