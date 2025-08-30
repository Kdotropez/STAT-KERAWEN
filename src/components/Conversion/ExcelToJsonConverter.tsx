import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  DataObject as DataObjectIcon
} from '@mui/icons-material';
import ExcelToJsonService, { JsonVenteData, ValidationResult } from '../../services/ExcelToJsonService';

interface ExcelToJsonConverterProps {
  onJsonDataReady?: (jsonData: JsonVenteData) => void;
}

const ExcelToJsonConverter: React.FC<ExcelToJsonConverterProps> = ({ onJsonDataReady }) => {
  const [isConverting, setIsConverting] = useState(false);
  const [jsonData, setJsonData] = useState<JsonVenteData | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const excelToJsonService = new ExcelToJsonService();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setJsonData(null);
      setValidation(null);
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setError(null);

    try {
      console.log('🔄 Début de la conversion...');
      
      // Convertir Excel → JSON
      const result = await excelToJsonService.convertExcelToJson(selectedFile);
      
      setJsonData(result);
      
      // Créer un objet de validation pour l'affichage
      const validationResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        data: result.data,
        headers: result.headers
      };
      
      setValidation(validationResult);
      
      // Notifier le parent si callback fourni
      if (onJsonDataReady) {
        onJsonDataReady(result);
      }
      
      console.log('✅ Conversion terminée avec succès');
      
    } catch (err) {
      console.error('❌ Erreur lors de la conversion:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsConverting(false);
    }
  }, [selectedFile, onJsonDataReady]);

  const handleDownloadJson = useCallback(async () => {
    if (!jsonData || !selectedFile) return;
    
    try {
      await excelToJsonService.saveJsonData(jsonData, selectedFile.name);
    } catch (err) {
      setError('Erreur lors de la sauvegarde du fichier JSON');
    }
  }, [jsonData, selectedFile]);

  const getValidationIcon = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <DataObjectIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Conversion Excel → JSON
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Convertissez vos fichiers Excel de vente en JSON pour un traitement plus fiable et cohérent.
      </Typography>

      {/* Sélection de fichier */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Étape 1: Sélectionner le fichier Excel
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={isConverting}
          >
            Choisir un fichier Excel
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
            />
          </Button>
          
          {selectedFile && (
            <Chip 
              label={selectedFile.name} 
              color="primary" 
              variant="outlined"
            />
          )}
        </Box>

        {selectedFile && (
          <Button
            variant="contained"
            onClick={handleConvert}
            disabled={isConverting}
            startIcon={isConverting ? <CircularProgress size={20} /> : <DataObjectIcon />}
            sx={{ mt: 2 }}
          >
            {isConverting ? 'Conversion en cours...' : 'Convertir en JSON'}
          </Button>
        )}
      </Paper>

      {/* Messages d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Résultats de la conversion */}
      {jsonData && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ✅ Conversion réussie
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Chip 
              icon={getValidationIcon('success')}
              label={`${jsonData.metadata.validRows} lignes valides`}
              color="success"
            />
            <Chip 
              icon={getValidationIcon('warning')}
              label={`${jsonData.metadata.invalidRows} lignes avec problèmes`}
              color="warning"
            />
            <Chip 
              label={`${jsonData.headers.length} colonnes détectées`}
              variant="outlined"
            />
          </Box>

          {/* Métadonnées */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Détails de la conversion</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Période de données"
                    secondary={`Du ${jsonData.metadata.dateRange.start} au ${jsonData.metadata.dateRange.end}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Colonnes détectées"
                    secondary={jsonData.headers.join(', ')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Statistiques"
                    secondary={`Total: ${jsonData.metadata.totalRows} lignes | Valides: ${jsonData.metadata.validRows} | Problèmes: ${jsonData.metadata.invalidRows}`}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Bouton de téléchargement */}
          <Button
            variant="contained"
            onClick={handleDownloadJson}
            startIcon={<DownloadIcon />}
            sx={{ mt: 2 }}
          >
            Télécharger le fichier JSON
          </Button>
        </Paper>
      )}

      {/* Aperçu des données */}
      {jsonData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Aperçu des données converties
          </Typography>
          
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <pre style={{ 
              fontSize: '12px', 
              backgroundColor: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '4px',
              margin: 0
            }}>
              {JSON.stringify(jsonData.data.slice(0, 5), null, 2)}
            </pre>
            {jsonData.data.length > 5 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                ... et {jsonData.data.length - 5} autres lignes
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ExcelToJsonConverter;


