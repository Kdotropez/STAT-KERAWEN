import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  BugReport as BugReportIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

interface ExcelDebugData {
  headers: string[];
  firstRows: any[][];
  totalRows: number;
  sheetNames: string[];
}

const ExcelDebugViewer: React.FC = () => {
  const [debugData, setDebugData] = useState<ExcelDebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyseDebug = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Début de l\'analyse debug...');
      
      // Essayer d'abord le fichier Excel
      try {
        const response = await fetch('/id produits pour mappage.xls');
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          console.log('📊 Fichier Excel chargé, taille:', arrayBuffer.byteLength, 'bytes');
          
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          console.log('📋 Sheets disponibles:', workbook.SheetNames);
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Obtenir les données brutes
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          console.log('📊 Données brutes:', jsonData.slice(0, 5));
          
          const headers = jsonData[0] as string[];
          const firstRows = jsonData.slice(1, 6) as any[][];
          const totalRows = jsonData.length;
          
          const debugInfo: ExcelDebugData = {
            headers,
            firstRows,
            totalRows,
            sheetNames: workbook.SheetNames
          };
          
          setDebugData(debugInfo);
          console.log('✅ Analyse debug Excel terminée');
          return;
        }
      } catch (excelError) {
        console.log('⚠️ Erreur avec le fichier Excel, essai avec le fichier JSON de test...');
      }

      // Si le fichier Excel échoue, utiliser le fichier JSON de test
      console.log('🔄 Utilisation du fichier JSON de test...');
      const testResponse = await fetch('/test-excel-data.json');
      if (!testResponse.ok) {
        throw new Error(`Erreur HTTP: ${testResponse.status} ${testResponse.statusText}`);
      }
      
      const testData = await testResponse.json();
      console.log('📊 Fichier JSON de test chargé:', testData);
      
      const headers = testData.headers;
      const data = testData.data;
      const firstRows = data.slice(0, 5);
      const totalRows = data.length;
      
      const debugInfo: ExcelDebugData = {
        headers,
        firstRows,
        totalRows,
        sheetNames: ['Test Data']
      };
      
      setDebugData(debugInfo);
      console.log('✅ Analyse debug JSON terminée');
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'analyse debug:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugReportIcon />
          Debug - Structure du Fichier Excel
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Analyse détaillée de la structure du fichier Excel pour identifier les colonnes.
        </Typography>

        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleAnalyseDebug}
          disabled={loading}
        >
          Analyser la structure du fichier
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {debugData && (
        <>
          {/* Informations générales */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informations Générales
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={`${debugData.sheetNames.length} feuille(s)`} color="primary" />
              <Chip label={`${debugData.totalRows} lignes totales`} color="secondary" />
              <Chip label={`${debugData.headers.length} colonnes`} color="info" />
            </Box>
            
            <Typography variant="subtitle2" gutterBottom>
              Feuilles disponibles:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {debugData.sheetNames.map((sheet, index) => (
                <Chip key={index} label={sheet} variant="outlined" size="small" />
              ))}
            </Box>
          </Paper>

          {/* Headers */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Headers (Colonnes) Détectés
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Index</TableCell>
                    <TableCell>Nom de la colonne</TableCell>
                    <TableCell>Type détecté</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {debugData.headers.map((header, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Chip label={index} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {header || '(vide)'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={typeof header} 
                          size="small" 
                          color={header ? "success" : "error"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Premières lignes */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Premières Lignes de Données (5 premières)
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ligne</TableCell>
                    {debugData.headers.map((header, index) => (
                      <TableCell key={index}>
                        <Typography variant="caption" fontFamily="monospace">
                          {header || `Col ${index}`}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {debugData.firstRows.map((row, rowIndex) => (
                    <TableRow key={rowIndex} hover>
                      <TableCell>
                        <Chip label={rowIndex + 1} size="small" />
                      </TableCell>
                      {debugData.headers.map((header, colIndex) => (
                        <TableCell key={colIndex}>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                            {row[colIndex] !== undefined ? String(row[colIndex]) : ''}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ExcelDebugViewer;
