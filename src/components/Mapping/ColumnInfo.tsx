import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

interface ColumnInfoProps {
  headers: string[];
}

const ColumnInfo: React.FC<ColumnInfoProps> = ({ headers }) => {
  // Définition de l'importance des colonnes selon les spécifications
  const colonnesImportance: { [key: string]: { importance: string; description: string } } = {
    // Colonnes TRÈS IMPORTANTES
    'date': { importance: 'critique', description: 'Date de vente - permet le tri chronologique' },
    'date et heure': { importance: 'critique', description: 'Date et heure de vente - tri chronologique précis' },
    'boutique': { importance: 'critique', description: 'Lieu de vente - statistiques par boutique' },
    'id': { importance: 'critique', description: 'Identifiant produit - lien avec compositions.json' },
    'qté': { importance: 'critique', description: 'Quantité vendue - calculs statistiques' },
    'montant ttc': { importance: 'critique', description: 'Montant total TTC - calculs financiers' },
    
    // Colonnes IMPORTANTES
    'heure': { importance: 'important', description: 'Heure de vente - analyse temporelle' },
    'caissier': { importance: 'important', description: 'Nom de la vendeuse - performance commerciale' },
    'commande': { importance: 'important', description: 'Numéro de commande - traçabilité' },
    'retour': { importance: 'important', description: 'Vente retour - exclusion des statistiques' },
    'prix unitaire': { importance: 'important', description: 'Prix de vente unitaire TTC' },
    'prix de vente ttc unitaire': { importance: 'important', description: 'Prix de vente unitaire TTC' },
    'prix d\'achat': { importance: 'important', description: 'Prix d\'achat HT - calcul des marges' },
    'tva': { importance: 'important', description: 'TVA de la vente - analyse fiscale' },
    'categorie': { importance: 'important', description: 'Catégorie de l\'article - statistiques par catégorie' },
    'cat defaut': { importance: 'important', description: 'Catégorie par défaut de l\'article' },
    'paiement': { importance: 'important', description: 'Méthode de règlement - analyse des moyens de paiement' },
    'fournisseur': { importance: 'important', description: 'Fournisseur - statistiques par fournisseur' },
    'fabricant': { importance: 'important', description: 'Fabricant - statistiques par fabricant' },
    
    // Colonnes FACULTATIVES
    'op': { importance: 'facultatif', description: 'Opération - information optionnelle' },
    'activite': { importance: 'facultatif', description: 'Activité - information optionnelle' },
    'remise ttc': { importance: 'facultatif', description: 'Remise TTC - information optionnelle' },
    
    // Colonnes INUTILES
    'caisse': { importance: 'inutile', description: 'Numéro de caisse - non utilisé' },
    'client': { importance: 'inutile', description: 'Client - non utilisé' },
    'groupe': { importance: 'inutile', description: 'Groupe - non utilisé' },
    'ean': { importance: 'inutile', description: 'Code EAN - non utilisé' },
    'mesure': { importance: 'inutile', description: 'Mesure - non utilisé' },
    'livreur': { importance: 'inutile', description: 'Livreur - non utilisé' },
    'reference': { importance: 'inutile', description: 'Référence - non utilisé' },
    'cat.racine': { importance: 'inutile', description: 'Catégorie racine - non utilisé' },
    'pays': { importance: 'inutile', description: 'Pays - non utilisé' },
    'mode': { importance: 'inutile', description: 'Mode - non utilisé' },
    'tag': { importance: 'inutile', description: 'Tag - non utilisé' },
    'note': { importance: 'inutile', description: 'Note - non utilisé' }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'critique':
        return <CheckCircleIcon color="success" />;
      case 'important':
        return <InfoIcon color="primary" />;
      case 'facultatif':
        return <WarningIcon color="warning" />;
      case 'inutile':
        return <CancelIcon color="error" />;
      default:
        return <InfoIcon color="action" />;
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critique':
        return 'success';
      case 'important':
        return 'primary';
      case 'facultatif':
        return 'warning';
      case 'inutile':
        return 'error';
      default:
        return 'default';
    }
  };

  const getImportanceText = (importance: string) => {
    switch (importance) {
      case 'critique':
        return 'CRITIQUE';
      case 'important':
        return 'IMPORTANT';
      case 'facultatif':
        return 'FACULTATIF';
      case 'inutile':
        return 'INUTILE';
      default:
        return 'INCONNU';
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', mb: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 Guide des colonnes détectées ({headers.length} colonnes)
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Ce guide explique l'importance de chaque colonne selon vos spécifications.
          </Typography>
        </Box>

        <List>
          {headers.map((header, index) => {
            const info = colonnesImportance[header.toLowerCase()] || 
                        { importance: 'inconnu', description: 'Colonne non documentée' };
            
            return (
              <React.Fragment key={header}>
                <ListItem>
                  <ListItemIcon>
                    {getImportanceIcon(info.importance)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {header}
                        </Typography>
                        <Chip
                          label={getImportanceText(info.importance)}
                          color={getImportanceColor(info.importance) as any}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={info.description}
                  />
                </ListItem>
                {index < headers.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            🎯 Colonnes essentielles pour le traitement :
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Date</strong>, <strong>ID</strong>, <strong>Qté</strong>, <strong>Montant TTC</strong> - 
            Ces colonnes sont obligatoires pour traiter les ventes et décomposer les compositions.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ColumnInfo;
