import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Chip,
  Divider,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  AutoFixHigh as AutoFixIcon
} from '@mui/icons-material';
import { MappingColonnes } from '../../types';

interface ColumnMappingProps {
  headers: string[];
  onMappingComplete: (mapping: MappingColonnes) => void;
  onAutoImportAndDecompose: (mapping: MappingColonnes) => void;
  onSaveMapping: (mapping: MappingColonnes, name: string) => void;
  savedMappings?: Array<{ name: string; mapping: MappingColonnes }>;
}

// Options de mapping disponibles
const MAPPING_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'heure', label: 'Heure' },
  { value: 'boutique', label: 'Boutique' },
  { value: 'id', label: 'ID' },
  { value: 'produit', label: 'Produit' },
  { value: 'declinaison', label: 'Déclinaison' },
  { value: 'qte', label: 'Qté' },
  { value: 'prix_ttc', label: 'Prix TTC' },
  { value: 'prix_achat', label: 'Prix d\'achat' },
  { value: 'montant_ttc', label: 'Montant TTC' },
  { value: 'tva', label: 'TVA' },
  { value: 'remise_ttc', label: 'Remise TTC' },
  { value: 'caissier', label: 'Caissier' },
  { value: 'commande', label: 'Commande' },
  { value: 'numeroOperation', label: 'Numéro Opération (#Op)' },
  { value: 'retour', label: 'Retour' },
  { value: 'fournisseur', label: 'Fournisseur' },
  { value: 'fabricant', label: 'Fabricant' },
  { value: 'categorie', label: 'Catégorie' },
  { value: 'paiement', label: 'Paiement' },
  { value: 'client', label: 'Client' },
  { value: 'ean', label: 'EAN' },
  { value: 'reference', label: 'Référence' },
  { value: 'autre', label: 'Autre' }
];

const ColumnMapping: React.FC<ColumnMappingProps> = ({
  headers,
  onMappingComplete,
  onAutoImportAndDecompose,
  onSaveMapping,
  savedMappings = []
}) => {
  const [mapping, setMapping] = useState<MappingColonnes>({});
  const [mappingName, setMappingName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Auto-mapping basé sur les noms de colonnes et index pour structure standard
  useEffect(() => {
    const autoMapping: MappingColonnes = {};
    
    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase();
      
      // Mapping automatique basé sur l'index et le nom pour la structure standard
      if (index === 1 || headerLower.includes('date')) {
        autoMapping[header] = 'date';
      } else if (index === 4 || headerLower.includes('boutique')) {
        autoMapping[header] = 'boutique';
      } else if (index === 11 || headerLower.includes('id')) {
        autoMapping[header] = 'id';
        console.log(`Colonne L (index 11) détectée comme ID: ${header}`);
      } else if (index === 12 || headerLower.includes('produit') || headerLower.includes('nom') || headerLower.includes('article')) {
        autoMapping[header] = 'produit';
        console.log(`Colonne M (index 12) détectée comme Produit: ${header}`);
      } else if (index === 13 || headerLower.includes('déclinaison')) {
        autoMapping[header] = 'declinaison';
      } else if (index === 18 || headerLower.includes('qté') || headerLower.includes('quantité')) {
        autoMapping[header] = 'qte';
      } else if (index === 17 || headerLower.includes('prix unitaire')) {
        autoMapping[header] = 'prix_ttc';
      } else if (index === 20 || headerLower.includes('montant')) {
        autoMapping[header] = 'montant_ttc';
      } else if (index === 23 || headerLower.includes('prix d\'achat')) {
        autoMapping[header] = 'prix_achat';
      } else if (index === 21 || headerLower.includes('tva')) {
        autoMapping[header] = 'tva';
      } else if (index === 22 || headerLower.includes('remise')) {
        autoMapping[header] = 'remise_ttc';
      } else if (index === 6 || headerLower.includes('caissier')) {
        autoMapping[header] = 'caissier';
      } else if (index === 15 || headerLower.includes('fournisseur')) {
        autoMapping[header] = 'fournisseur';
      } else if (index === 16 || headerLower.includes('fabricant')) {
        autoMapping[header] = 'fabricant';
      } else if (index === 26 || headerLower.includes('catégorie')) {
        autoMapping[header] = 'categorie';
      } else if (index === 29 || headerLower.includes('paiement')) {
        autoMapping[header] = 'paiement';
      } else if (index === 2 || headerLower.includes('heure')) {
        autoMapping[header] = 'heure';
      } else if (index === 0 || headerLower.includes('#op') || headerLower.includes('op') || headerLower.includes('operation')) {
        autoMapping[header] = 'numeroOperation';
        console.log(`Colonne A (index 0) détectée comme Numéro Opération: ${header}`);
      } else if (index === 7 || headerLower.includes('commande')) {
        autoMapping[header] = 'commande';
      } else if (index === 8 || headerLower.includes('retour')) {
        autoMapping[header] = 'retour';
      } else if (index === 9 || headerLower.includes('client')) {
        autoMapping[header] = 'client';
      } else if (index === 14 || headerLower.includes('ean')) {
        autoMapping[header] = 'ean';
      } else if (index === 25 || headerLower.includes('référence')) {
        autoMapping[header] = 'reference';
      }
      
      // Détection supplémentaire pour la colonne Produit si pas encore mappée
      if (!autoMapping[header] && (headerLower.includes('produit') || headerLower.includes('nom') || headerLower.includes('article') || headerLower.includes('libellé') || headerLower.includes('libelle'))) {
        autoMapping[header] = 'produit';
        console.log(`Colonne Produit détectée par nom: ${header}`);
      }
    });

    setMapping(autoMapping);
    console.log('✅ Mapping automatique appliqué:', autoMapping);
    console.log('📋 En-têtes détectés:', headers.map((header, index) => `${index}: ${header}`));
  }, [headers]);

  const handleMappingChange = (field: string, value: string) => {
    setMapping((prev: MappingColonnes) => ({ ...prev, [field]: value }));
    validateMapping({ ...mapping, [field]: value });
  };

  const validateMapping = (currentMapping: MappingColonnes) => {
    const newErrors: string[] = [];
    
    // Vérifier les champs obligatoires
    const requiredFields = ['date', 'boutique', 'id', 'qte'];
    const mappedValues = Object.values(currentMapping);
    
    requiredFields.forEach(field => {
      if (!mappedValues.includes(field)) {
        newErrors.push(`Le champ "${field}" est obligatoire`);
      }
    });
    
    setErrors(newErrors);
  };

  const handleAutoMapping = () => {
    const autoMapping: MappingColonnes = {};
    
    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase();
      
      // Mapping automatique basé sur l'index et le nom
      if (index === 0) autoMapping[header] = 'date';
      if (index === 4) autoMapping[header] = 'boutique';
      if (index === 11) autoMapping[header] = 'id';
      if (index === 12) autoMapping[header] = 'produit';
      if (index === 18) autoMapping[header] = 'qte';
      if (index === 20) autoMapping[header] = 'prix_ttc';
      if (index === 23) autoMapping[header] = 'prix_achat';
      
      // Mapping par nom de colonne
      if (headerLower.includes('date')) autoMapping[header] = 'date';
      if (headerLower.includes('boutique')) autoMapping[header] = 'boutique';
      if (headerLower.includes('id')) autoMapping[header] = 'id';
      if (headerLower.includes('produit') || headerLower.includes('nom') || headerLower.includes('article') || headerLower.includes('libellé') || headerLower.includes('libelle')) {
        autoMapping[header] = 'produit';
        console.log(`Colonne Produit détectée par nom dans handleAutoMapping: ${header}`);
      }
      if (headerLower.includes('qté') || headerLower.includes('qte')) autoMapping[header] = 'qte';
      if (headerLower.includes('prix') && headerLower.includes('ttc')) autoMapping[header] = 'prix_ttc';
      if (headerLower.includes('prix') && headerLower.includes('achat')) autoMapping[header] = 'prix_achat';
    });
    
    setMapping(autoMapping);
    validateMapping(autoMapping);
  };

  const handleApplyMapping = () => {
    if (errors.length === 0) {
      onMappingComplete(mapping);
    }
  };

  const handleAutoImportAndDecompose = () => {
    console.log('🔧 handleAutoImportAndDecompose appelé');
    console.log('🔧 Erreurs:', errors);
    console.log('🔧 Mapping:', mapping);
    if (errors.length === 0) {
      console.log('✅ Appel de onAutoImportAndDecompose avec le mapping');
      onAutoImportAndDecompose(mapping);
    } else {
      console.log('❌ Erreurs présentes, import bloqué');
    }
  };

  const handleSaveMapping = () => {
    if (mappingName.trim()) {
      onSaveMapping(mapping, mappingName);
      setMappingName('');
    }
  };

  const handleLoadMapping = (savedMapping: MappingColonnes) => {
    setMapping(savedMapping);
    validateMapping(savedMapping);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mb: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔧 Mapping des colonnes
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Définissez comment chaque colonne de votre fichier Excel correspond aux champs de l'application.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <Typography variant="subtitle2">
            Actions rapides:
          </Typography>
          <Tooltip title="Mapping automatique">
            <IconButton onClick={handleAutoMapping}>
              <AutoFixIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Réinitialiser">
            <IconButton onClick={() => setMapping({})}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          {headers.map(header => (
            <Box key={header}>
              <FormControl fullWidth>
                <InputLabel>
                  {header}
                </InputLabel>
                <Select
                  value={mapping[header] || ''}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                  label={header}
                >
                  <MenuItem value="">
                    <em>Aucune colonne sélectionnée</em>
                  </MenuItem>
                  {MAPPING_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Nom de la configuration"
            value={mappingName}
            onChange={(e) => setMappingName(e.target.value)}
            placeholder="Ex: Configuration standard"
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleSaveMapping}
            disabled={!mappingName.trim()}
          >
            Sauvegarder
          </Button>
        </Box>

        {savedMappings.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Configurations sauvegardées:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {savedMappings.map((saved, index) => (
                <Chip
                  key={index}
                  label={saved.name}
                  onClick={() => handleLoadMapping(saved.mapping)}
                  variant="outlined"
                  clickable
                />
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleApplyMapping}
            disabled={errors.length > 0}
            size="large"
            sx={{ mr: 2 }}
          >
            Appliquer le mapping ({Object.keys(mapping).length}/{headers.length} colonnes)
          </Button>
          
          <Button
            variant="contained"
            color="success"
            onClick={handleAutoImportAndDecompose}
            disabled={errors.length > 0}
            size="large"
          >
            🚀 Importer et décomposer automatiquement
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ColumnMapping;
