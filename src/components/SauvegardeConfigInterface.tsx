import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Folder as FolderIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { SauvegardeConfig } from '../services/MonthlyMergeService';

interface SauvegardeConfigInterfaceProps {
  config: SauvegardeConfig;
  onConfigChange: (config: SauvegardeConfig) => void;
}

export const SauvegardeConfigInterface: React.FC<SauvegardeConfigInterfaceProps> = ({
  config,
  onConfigChange
}) => {
  const [localConfig, setLocalConfig] = useState<SauvegardeConfig>(config);
  const [isModified, setIsModified] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
    setIsModified(false);
  }, [config]);

  const handleConfigChange = (field: keyof SauvegardeConfig, value: any) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    setIsModified(true);
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    setIsModified(false);
  };

  const handleReset = () => {
    setLocalConfig(config);
    setIsModified(false);
  };

  const generatePreview = () => {
    const date = new Date().toISOString().split('T')[0];
    const mois = '2024-01';
    
    let cheminMois = localConfig.dossierBase;
    if (localConfig.organiserParAnnee) {
      cheminMois += '/2024';
    }
    if (localConfig.organiserParMois) {
      cheminMois += '/01-Janvier';
    }
    
    const nomFichierMois = `ventes-${mois}-${date}.json`;
    const nomFichierFusionne = `ventes-cumulatives-${date}.json`;
    
    return {
      mois: `${cheminMois}/${nomFichierMois}`,
      fusionne: `${localConfig.dossierBase}/2024/01-Janvier/${nomFichierFusionne}`
    };
  };

  const preview = generatePreview();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon color="primary" />
        Configuration de Sauvegarde
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            📁 Dossier de Base
          </Typography>
          
          <TextField
            fullWidth
            label="Nom du dossier principal"
            value={localConfig.dossierBase}
            onChange={(e) => handleConfigChange('dossierBase', e.target.value)}
            helperText="Ex: Ventes-Mensuelles, Mes-Ventes, etc."
            sx={{ mb: 2 }}
          />

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Les fichiers seront sauvegardés dans votre dossier de téléchargement avec cette structure.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            🗂️ Organisation des Fichiers
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.organiserParAnnee}
                    onChange={(e) => handleConfigChange('organiserParAnnee', e.target.checked)}
                  />
                }
                label="Organiser par année"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Créer un dossier par année (2024, 2025, etc.)
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.organiserParMois}
                    onChange={(e) => handleConfigChange('organiserParMois', e.target.checked)}
                  />
                }
                label="Organiser par mois"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Créer un dossier par mois (01-Janvier, 02-Février, etc.)
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            📋 Aperçu de la Structure
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<FolderIcon />}
            onClick={() => setShowPreview(!showPreview)}
            sx={{ mb: 2 }}
          >
            {showPreview ? 'Masquer' : 'Afficher'} l'aperçu
          </Button>
          
          {showPreview && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Structure des fichiers générés :
              </Typography>
              
              <Box sx={{ backgroundColor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
                <Typography variant="body2" component="div">
                  📁 {preview.mois.split('/')[0]}/
                  {localConfig.organiserParAnnee && (
                    <>
                      <br />&nbsp;&nbsp;📁 {preview.mois.split('/')[1]}/
                    </>
                  )}
                  {localConfig.organiserParMois && (
                    <>
                      <br />&nbsp;&nbsp;&nbsp;&nbsp;📁 {preview.mois.split('/').slice(-2)[0]}/
                    </>
                  )}
                  <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;📄 {preview.mois.split('/').pop()}
                  <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;📄 {preview.fusionne.split('/').pop()}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={preview.mois} 
                  size="small" 
                  variant="outlined" 
                  color="primary"
                />
                <Chip 
                  label={preview.fusionne.split('/').pop()} 
                  size="small" 
                  variant="outlined" 
                  color="secondary"
                />
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            💾 Actions
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!isModified}
            >
              Sauvegarder la Configuration
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
              disabled={!isModified}
            >
              Réinitialiser
            </Button>
          </Box>
          
          {isModified && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Des modifications ont été apportées. N'oubliez pas de sauvegarder la configuration.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
