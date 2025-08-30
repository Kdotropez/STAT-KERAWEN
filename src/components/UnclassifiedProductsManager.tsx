import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  AutoFixHigh as AutoFixIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import UnclassifiedProductsManager, { 
  UnclassifiedProduct, 
  ClassificationRule 
} from '../services/UnclassifiedProductsManager';
import { VenteLigne } from '../types';

interface UnclassifiedProductsManagerProps {
  ventes: VenteLigne[];
  onProductsClassified?: (ventesModifiees: VenteLigne[]) => void;
}

const UnclassifiedProductsManagerComponent: React.FC<UnclassifiedProductsManagerProps> = ({
  ventes,
  onProductsClassified
}) => {
  const [manager] = useState(() => new UnclassifiedProductsManager());
  const [unclassifiedProducts, setUnclassifiedProducts] = useState<UnclassifiedProduct[]>([]);
  const [classificationRules, setClassificationRules] = useState<ClassificationRule[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [openRuleDialog, setOpenRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<ClassificationRule | null>(null);
  const [newRule, setNewRule] = useState<Partial<ClassificationRule>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Catégories disponibles
  const availableCategories = [
    'VERRE',
    'ASSIETTE', 
    'VASQUE ET SEAU',
    'ICE TROPEZ',
    'EMBALLAGE',
    'COMPOSITION VASQUE',
    'TRIO PACK',
    'SERVICES ET FRAIS',
    'À classer'
  ];

  useEffect(() => {
    analyzeProducts();
    loadRules();
  }, [ventes]);

  const analyzeProducts = () => {
    const products = manager.analyzeUnclassifiedProducts(ventes);
    setUnclassifiedProducts(products);
    setStats(manager.getUnclassifiedStats());
  };

  const loadRules = () => {
    setClassificationRules(manager.getClassificationRules());
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setNewRule({});
    setOpenRuleDialog(true);
  };

  const handleEditRule = (rule: ClassificationRule, index: number) => {
    setEditingRule(rule);
    setNewRule(rule);
    setOpenRuleDialog(true);
  };

  const handleDeleteRule = (index: number) => {
    manager.removeClassificationRule(index);
    loadRules();
  };

  const handleSaveRule = () => {
    if (newRule.nomPattern && newRule.categorie) {
      if (editingRule) {
        // Modifier la règle existante
        const index = classificationRules.findIndex(r => r === editingRule);
        if (index >= 0) {
          manager.removeClassificationRule(index);
        }
      }
      
      manager.addClassificationRule(newRule as ClassificationRule);
      loadRules();
      setOpenRuleDialog(false);
      setNewRule({});
      setEditingRule(null);
    }
  };

  const handleApplyRules = () => {
    const ventesModifiees = manager.applyClassificationRules(ventes);
    if (onProductsClassified) {
      onProductsClassified(ventesModifiees);
    }
    analyzeProducts(); // Re-analyser après application
  };

  const handleGenerateAutoRules = () => {
    const autoRules = manager.generateAutoRules();
    autoRules.forEach(rule => manager.addClassificationRule(rule));
    loadRules();
  };

  const handleExportRules = () => {
    const exportData = manager.exportUnclassifiedProducts();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regles-classification-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportRules = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          manager.importClassificationRules(content);
          loadRules();
        } catch (error) {
          console.error('Erreur lors de l\'import:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateInput: string | Date): string => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('fr-FR');
  };

  if (unclassifiedProducts.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          ✅ Aucun produit sans ID détecté
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tous les produits ont des identifiants valides
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* En-tête avec statistiques */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Gestion des Produits sans ID
        </Typography>
        
        {stats && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2, 
            mb: 3 
          }}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {stats.nombreProduits}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Produits sans ID
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h4" color="secondary">
                  {stats.totalQuantite}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quantité totale
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h4" color="success.main">
                  {formatPrice(stats.totalMontant)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Montant total
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h4" color="info.main">
                  {classificationRules.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Règles actives
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddRule}
          >
            Ajouter une règle
          </Button>
          <Button
            variant="outlined"
            startIcon={<AutoFixIcon />}
            onClick={handleGenerateAutoRules}
          >
            Générer règles auto
          </Button>
          <Button
            variant="outlined"
            startIcon={<CheckCircleIcon />}
            onClick={handleApplyRules}
            color="success"
          >
            Appliquer les règles
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportRules}
          >
            Exporter règles
          </Button>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
          >
            Importer règles
            <input
              type="file"
              hidden
              accept=".json"
              onChange={handleImportRules}
            />
          </Button>
        </Box>
      </Paper>

      {/* Règles de classification */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📋 Règles de Classification
        </Typography>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Motif</TableCell>
                <TableCell>Catégorie</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classificationRules.map((rule, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {rule.nomPattern}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={rule.categorie} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {rule.id ? (
                      <Chip label={rule.id} size="small" color="secondary" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Auto-généré
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {rule.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Modifier">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditRule(rule, index)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteRule(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Produits non classés */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📦 Produits sans ID ({unclassifiedProducts.length})
        </Typography>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nom du Produit</TableCell>
                <TableCell>Quantité</TableCell>
                <TableCell>Montant</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Boutique</TableCell>
                <TableCell>Catégorie Suggérée</TableCell>
                <TableCell>ID Proposé</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unclassifiedProducts.map((produit, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {produit.nom}
                    </Typography>
                  </TableCell>
                  <TableCell>{produit.quantite}</TableCell>
                  <TableCell>{formatPrice(produit.montant)}</TableCell>
                  <TableCell>{formatDate(produit.date)}</TableCell>
                  <TableCell>{produit.boutique}</TableCell>
                  <TableCell>
                    <Chip 
                      label={produit.categorieSuggeree || 'À classer'} 
                      size="small" 
                      color={produit.categorieSuggeree === 'À classer' ? 'error' : 'primary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {produit.idPropose}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog pour ajouter/modifier une règle */}
      <Dialog open={openRuleDialog} onClose={() => setOpenRuleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRule ? 'Modifier la règle' : 'Ajouter une règle'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Motif de recherche"
              value={newRule.nomPattern || ''}
              onChange={(e) => setNewRule({ ...newRule, nomPattern: e.target.value })}
              placeholder="Ex: verre, assiette, vasque..."
              helperText="Motif à rechercher dans le nom du produit"
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={newRule.categorie || ''}
                onChange={(e) => setNewRule({ ...newRule, categorie: e.target.value })}
                label="Catégorie"
              >
                {availableCategories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="ID (optionnel)"
              value={newRule.id || ''}
              onChange={(e) => setNewRule({ ...newRule, id: e.target.value })}
              placeholder="Laissez vide pour auto-génération"
              helperText="ID spécifique à assigner (optionnel)"
              fullWidth
            />
            
            <TextField
              label="Description"
              value={newRule.description || ''}
              onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              placeholder="Description de la règle"
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRuleDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSaveRule} 
            variant="contained"
            disabled={!newRule.nomPattern || !newRule.categorie}
          >
            {editingRule ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UnclassifiedProductsManagerComponent;
