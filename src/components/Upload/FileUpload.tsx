import React, { useState, useCallback, useMemo } from 'react';
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
  ListItemSecondaryAction,
  IconButton,
  Chip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { ExcelService } from '../../services/fileHandling/excelService';

interface FileUploadProps {
  onFilesProcessed: (files: ProcessedFile[]) => void;
  onMappingRequired: (file: File, headers: string[]) => void;
}

export interface ProcessedFile {
  file: File;
  data: any[][];
  headers: string[];
  status: 'pending' | 'processed' | 'error';
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesProcessed, onMappingRequired }) => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const excelService = useMemo(() => new ExcelService(), []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFiles = useCallback(async (fileList: File[]) => {
    setIsProcessing(true);
    const newFiles: ProcessedFile[] = [];

    for (const file of fileList) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls')) {
        
        try {
          const data = await excelService.lireFichierExcel(file);
          const headers = data[0]?.map(header => String(header || '')) || [];
          
          newFiles.push({
            file,
            data,
            headers,
            status: 'processed'
          });
        } catch (error) {
          newFiles.push({
            file,
            data: [],
            headers: [],
            status: 'error',
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
        }
      } else {
        newFiles.push({
          file,
          data: [],
          headers: [],
          status: 'error',
          error: 'Format de fichier non supporté. Utilisez des fichiers Excel (.xlsx, .xls)'
        });
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
    setIsProcessing(false);

    // Notifier le parent des fichiers traités
    const processedFiles = newFiles.filter(f => f.status === 'processed');
    if (processedFiles.length > 0) {
      onFilesProcessed(processedFiles);
    }
  }, [excelService, onFilesProcessed]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  }, [processFiles]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    await processFiles(selectedFiles);
  }, [processFiles]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: ProcessedFile['status']) => {
    switch (status) {
      case 'processed':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <CircularProgress size={20} />;
    }
  };

  const getStatusColor = (status: ProcessedFile['status']) => {
    switch (status) {
      case 'processed':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      <Paper
        elevation={isDragOver ? 8 : 2}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragOver ? 'primary.main' : 'grey.300',
          backgroundColor: isDragOver ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          textAlign: 'center'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Glissez-déposez vos fichiers Excel ici
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          ou cliquez pour sélectionner des fichiers
        </Typography>
        
        <Button
          variant="contained"
          component="span"
          sx={{ mt: 2 }}
          disabled={isProcessing}
        >
          {isProcessing ? 'Traitement...' : 'Sélectionner des fichiers'}
        </Button>
      </Paper>

      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Fichiers traités ({files.length})
          </Typography>
          
          <List>
            {files.map((file, index) => (
              <ListItem
                key={`${file.file.name}-${index}`}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: 'background.paper'
                }}
              >
                <ListItemText
                  primary={file.file.name}
                  secondary={
                    <Box>
                      <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.875rem' }}>
                        Taille: {(file.file.size / 1024).toFixed(1)} KB
                      </Box>
                      {file.status === 'processed' && (
                        <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.875rem' }}>
                          Colonnes détectées: {file.headers.length}
                        </Box>
                      )}
                      {file.status === 'error' && file.error && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {file.error}
                        </Alert>
                      )}
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(file.status)}
                    <Chip
                      label={file.status === 'processed' ? 'Traité' : 
                             file.status === 'error' ? 'Erreur' : 'En cours'}
                      color={getStatusColor(file.status) as any}
                      size="small"
                    />
                    <IconButton
                      edge="end"
                      onClick={() => removeFile(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
