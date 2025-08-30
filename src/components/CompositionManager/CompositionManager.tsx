import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import CompositionService, { Composition, Composant, CompositionEdition } from '../../services/CompositionService';

interface CompositionManagerProps {
  compositionService: CompositionService;
  onTestDecomposition?: (ventes: any[]) => void;
}

const CompositionManager: React.FC<CompositionManagerProps> = ({ compositionService, onTestDecomposition }) => {
  const [compositions, setCompositions] = useState<CompositionEdition[]>([]);
  const [nouvelleComposition, setNouvelleComposition] = useState<Partial<CompositionEdition>>({
    type: 'pack',
    id: '',
    nom: '',
    isModified: true,
    nombreComposants: 0,
    composants: []
  });
  const [nouveauComposant, setNouveauComposant] = useState<Partial<Composant>>({
    id: '',
    nom: '',
    quantite: 1
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [editingComposition, setEditingComposition] = useState<CompositionEdition | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    console.log('🔧 CompositionManager: compositionService changed:', compositionService);
    if (compositionService) {
      // Attendre un peu que le service soit complètement initialisé
      setTimeout(() => {
        chargerCompositions();
      }, 100);
    } else {
      setCompositions([]);
    }
  }, [compositionService]);

  const chargerCompositions = () => {
    if (!compositionService) {
      console.warn('❌ CompositionService non disponible');
      setCompositions([]);
      return;
    }
    
    try {
      const comps = compositionService.getCompositionsPourEdition();
      console.log('📊 Compositions chargées:', comps?.length || 0);
      setCompositions(comps || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des compositions:', error);
      setCompositions([]);
    }
  };

  const ajouterComposant = () => {
    if (!nouveauComposant.id || !nouveauComposant.nom) {
      setMessage({ type: 'error', text: 'Veuillez remplir l\'ID et le nom du composant' });
      return;
    }

    const composant: Composant = {
      id: nouveauComposant.id,
      nom: nouveauComposant.nom,
      quantite: nouveauComposant.quantite || 1
    };

    setNouvelleComposition(prev => ({
      ...prev,
      composants: [...(prev.composants || []), composant],
      nombreComposants: (prev.composants?.length || 0) + 1
    } as Partial<CompositionEdition>));

    setNouveauComposant({ id: '', nom: '', quantite: 1 });
  };

  const supprimerComposant = (index: number) => {
    setNouvelleComposition(prev => ({
      ...prev,
      composants: prev.composants?.filter((_, i) => i !== index),
      nombreComposants: (prev.composants?.length || 1) - 1
    }));
  };

  const sauvegarderComposition = async () => {
    if (!nouvelleComposition.id || !nouvelleComposition.nom || !nouvelleComposition.composants?.length) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }

    const composition: CompositionEdition = {
      type: nouvelleComposition.type || 'pack',
      id: nouvelleComposition.id,
      nom: nouvelleComposition.nom,
      isModified: true,
      nombreComposants: nouvelleComposition.composants.length,
      composants: nouvelleComposition.composants
    };

    const success = await compositionService.ajouterComposition(composition);
    
    if (success) {
      setMessage({ type: 'success', text: `Composition "${composition.nom}" ajoutée avec succès !` });
      // Réinitialiser complètement le formulaire
      setNouvelleComposition({
        type: 'pack',
        id: '',
        nom: '',
        isModified: true,
        nombreComposants: 0,
        composants: []
      });
      // S'assurer qu'on n'est plus en mode édition
      setIsEditing(false);
      setEditingComposition(null);
      chargerCompositions();
    } else {
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout de la composition' });
    }
  };

  const modifierComposition = (composition: CompositionEdition) => {
    console.log('🔧 modifierComposition appelé avec:', composition);
    setEditingComposition(composition);
    setNouvelleComposition({
      type: composition.type,
      id: composition.id,
      nom: composition.nom,
      isModified: true,
      nombreComposants: composition.composants.length,
      composants: [...composition.composants]
    });
    setIsEditing(true);
  };

  const supprimerComposition = async (composition: CompositionEdition) => {
    console.log('🔧 supprimerComposition appelé avec:', composition);
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la composition "${composition.nom}" ?`)) {
      const success = await compositionService.supprimerComposition(composition.id);
      if (success) {
        setMessage({ type: 'success', text: `Composition "${composition.nom}" supprimée avec succès !` });
        // Si on était en train de modifier la composition supprimée, sortir du mode édition
        if (editingComposition && editingComposition.id === composition.id) {
          annulerModification();
        }
        chargerCompositions();
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la suppression de la composition' });
      }
    }
  };

  const annulerModification = () => {
    setEditingComposition(null);
    setIsEditing(false);
    setNouvelleComposition({
      type: 'pack',
      id: '',
      nom: '',
      isModified: true,
      nombreComposants: 0,
      composants: []
    });
  };

  const sauvegarderModification = async () => {
    if (!editingComposition || !nouvelleComposition.id || !nouvelleComposition.nom || !nouvelleComposition.composants?.length) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }

    // Vérifier que la composition à modifier existe encore
    const compositionExiste = compositionService.getCompositions().find(c => c.id === editingComposition.id);
    if (!compositionExiste) {
      setMessage({ type: 'error', text: 'La composition à modifier n\'existe plus. Veuillez rafraîchir la page.' });
      annulerModification();
      return;
    }

    const compositionModifiee: CompositionEdition = {
      type: nouvelleComposition.type || 'pack',
      id: nouvelleComposition.id,
      nom: nouvelleComposition.nom,
      isModified: true,
      nombreComposants: nouvelleComposition.composants.length,
      composants: nouvelleComposition.composants
    };

    const success = await compositionService.modifierComposition(editingComposition.id, compositionModifiee);
    
    if (success) {
      setMessage({ type: 'success', text: `Composition "${compositionModifiee.nom}" modifiée avec succès !` });
      annulerModification();
      chargerCompositions();
    } else {
      setMessage({ type: 'error', text: 'Erreur lors de la modification de la composition' });
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mb: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            🧩 Gestion des Compositions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onTestDecomposition && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<PlayArrowIcon />}
                onClick={() => {
                  const comps = compositionService.getCompositions();
                  console.log('🧪 Test de décomposition avec', comps.length, 'compositions disponibles');
                  if (comps.length > 0) {
                    setMessage({ type: 'success', text: `${comps.length} compositions chargées et prêtes pour la décomposition automatique !` });
                  } else {
                    setMessage({ type: 'error', text: 'Aucune composition disponible. Ajoutez d\'abord des compositions.' });
                  }
                }}
              >
                Tester Décomposition
              </Button>
            )}
            
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={async () => {
                try {
                  await compositionService.exporterCompositions();
                  setMessage({ type: 'success', text: 'Fichier de compositions exporté avec succès !' });
                } catch (error) {
                  setMessage({ type: 'error', text: 'Erreur lors de l\'export des compositions' });
                }
              }}
            >
              Exporter JSON
            </Button>
          </Box>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {/* Afficher un avertissement si on est en mode édition mais la composition n'existe plus */}
        {isEditing && editingComposition && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Mode édition actif :</strong> Vous modifiez "{editingComposition.nom}". 
              <Button 
                size="small" 
                color="inherit" 
                onClick={annulerModification}
                sx={{ ml: 1 }}
              >
                Annuler et revenir à l'ajout
              </Button>
            </Typography>
          </Alert>
        )}

        {/* Formulaire d'ajout/modification de composition */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {isEditing ? `✏️ Modifier la composition "${editingComposition?.nom}"` : '➕ Ajouter une nouvelle composition'}
          </Typography>
         
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' }, 
            gap: 2, 
            mb: 3 
          }}>
            <TextField
              fullWidth
              label="ID de la composition"
              value={nouvelleComposition.id}
              onChange={(e) => setNouvelleComposition(prev => ({ ...prev, id: e.target.value }))}
              placeholder="Ex: 9999"
            />
            <TextField
              fullWidth
              label="Nom de la composition"
              value={nouvelleComposition.nom}
              onChange={(e) => setNouvelleComposition(prev => ({ ...prev, nom: e.target.value }))}
              placeholder="Ex: CARTON ICE TROPEZ"
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={nouvelleComposition.type}
                onChange={(e) => setNouvelleComposition(prev => ({ ...prev, type: e.target.value }))}
                label="Type"
              >
                <MenuItem value="pack">Pack</MenuItem>
                <MenuItem value="vasque">Vasque</MenuItem>
                <MenuItem value="trio">Trio</MenuItem>
                <MenuItem value="autre">Autre</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Ajout de composants */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Composants de la composition
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, 
              gap: 2, 
              mb: 2 
            }}>
              <TextField
                fullWidth
                label="ID du composant"
                value={nouveauComposant.id}
                onChange={(e) => setNouveauComposant(prev => ({ ...prev, id: e.target.value }))}
                placeholder="Ex: 1234"
              />
              <TextField
                fullWidth
                label="Nom du composant"
                value={nouveauComposant.nom}
                onChange={(e) => setNouveauComposant(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="Ex: ICE TROPEZ PECHE"
              />
              <TextField
                fullWidth
                type="number"
                label="Quantité"
                value={nouveauComposant.quantite}
                onChange={(e) => setNouveauComposant(prev => ({ ...prev, quantite: parseInt(e.target.value) || 1 }))}
              />
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={ajouterComposant}
                sx={{ height: 56 }}
              >
                Ajouter
              </Button>
            </Box>

            {/* Liste des composants ajoutés */}
            {nouvelleComposition.composants && nouvelleComposition.composants.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Composants ajoutés ({nouvelleComposition.composants.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {nouvelleComposition.composants.map((composant, index) => (
                    <Chip
                      key={index}
                      label={`${composant.nom} (ID: ${composant.id}) x${composant.quantite}`}
                      onDelete={() => supprimerComposant(index)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={isEditing ? sauvegarderModification : sauvegarderComposition}
              disabled={!nouvelleComposition.id || !nouvelleComposition.nom || !nouvelleComposition.composants?.length}
            >
              {isEditing ? 'Sauvegarder les modifications' : 'Sauvegarder la composition'}
            </Button>
            
            {isEditing && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={annulerModification}
              >
                Annuler
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Liste des compositions existantes */}
        <Box>
          <Typography variant="h6" gutterBottom>
            📋 Compositions existantes ({(compositions || []).length})
          </Typography>
         
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Composants</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(compositions || []).map((composition, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip label={composition.id} size="small" color="primary" />
                    </TableCell>
                    <TableCell>{composition.nom}</TableCell>
                    <TableCell>
                      <Chip label={composition.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(composition.composants || []).map((comp, compIndex) => (
                          <Chip
                            key={compIndex}
                            label={`${comp.nom} x${comp.quantite}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <div style={{ 
                        padding: '4px',
                        minWidth: '120px'
                      }}>
                        <button
                          onClick={() => {
                            console.log('🔧 Bouton Modifier cliqué pour:', composition);
                            modifierComposition(composition);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            margin: '2px',
                            display: 'inline-block',
                            width: '100%'
                          }}
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            console.log('🔧 Bouton Supprimer cliqué pour:', composition);
                            supprimerComposition(composition);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#d32f2f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            margin: '2px',
                            display: 'inline-block',
                            width: '100%'
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default CompositionManager;
