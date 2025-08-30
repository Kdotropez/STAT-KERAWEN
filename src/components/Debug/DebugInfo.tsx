import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import { ProcessedFile } from '../Upload/FileUpload';

interface DebugInfoProps {
  processedFiles: ProcessedFile[];
  mapping: { [key: string]: string | undefined };
}

const DebugInfo: React.FC<DebugInfoProps> = ({ processedFiles, mapping }) => {
  if (processedFiles.length === 0) {
    return null;
  }

  const file = processedFiles[0];
  const headers = file.headers;
  const data = file.data;

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', mb: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Debug - Informations de traitement
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            📊 Fichier traité
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nom: {file.file.name} | Lignes: {data.length} | Colonnes: {headers.length}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            📋 En-têtes détectés
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {headers.map((header, index) => (
              <Chip 
                key={index} 
                label={`${index}: ${header}`} 
                size="small" 
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            🔗 Mapping configuré
          </Typography>
          <List dense>
            {Object.entries(mapping).map(([source, target], index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${source} → ${target || 'Non mappé'}`}
                  secondary={`Index: ${headers.findIndex(h => h === source)}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            📝 Premières lignes de données
          </Typography>
          <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
            {data.slice(1, 4).map((ligne, index) => (
              <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Ligne {index + 1}:
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {ligne.map((cell, cellIndex) => `${headers[cellIndex]}: ${cell}`).join(' | ')}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Alert severity="info">
          <Typography variant="body2">
            <strong>Champs essentiels requis :</strong> date, id, qté, montant ttc
          </Typography>
          <Typography variant="body2">
            <strong>Mapping actuel :</strong> {Object.keys(mapping).length} colonnes mappées
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default DebugInfo;
