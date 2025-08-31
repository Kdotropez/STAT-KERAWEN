import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Search as SearchIcon
} from '@mui/icons-material';

interface Composant {
  id: string;
  nom: string;
  quantite: number;
  categorie: string;
  prix_vente_ttc: number;
}

interface Composition {
  id: string;
  nom: string;
  categorie: string;
  prix_vente_ttc: number;
  type: string;
  nombre_composants: number;
  composants: Composant[];
}

interface CompositionEditorProps {
  onCompositionUpdated?: () => void;
}

const CompositionEditor: React.FC<CompositionEditorProps> = ({ onCompositionUpdated }) => {
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [selectedComposition, setSelectedComposition] = useState<Composition | null>(null);
  const [editingComposition, setEditingComposition] = useState<Composition | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddComponentDialog, setShowAddComponentDialog] = useState(false);
  const [showNewCompositionDialog, setShowNewCompositionDialog] = useState(false);
  const [newComponent, setNewComponent] = useState<Partial<Composant>>({
    id: '',
    nom: '',
    quantite: 1,
    categorie: '',
    prix_vente_ttc: 0
  });
  const [newComposition, setNewComposition] = useState<Partial<Composition>>({
    id: '',
    nom: '',
    categorie: 'COMPOSITION VASQUE',
    prix_vente_ttc: 0,
    composants: []
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [showComponentSuggestions, setShowComponentSuggestions] = useState(false);
  const [componentSuggestions, setComponentSuggestions] = useState<any[]>([]);

  // Charger les compositions
  useEffect(() => {
    loadCompositions();
  }, []);

  const loadCompositions = async () => {
    try {
      const response = await fetch('/produits-unifies-avec-prix.json');
      const data = await response.json();
      
      // Vérifier que data.produits existe et est un tableau
      if (!data.produits || !Array.isArray(data.produits)) {
        console.error('Format de données invalide:', data);
        setMessage({ type: 'error', text: 'Format de données invalide' });
        return;
      }

      // Filtrer les compositions et vérifier les propriétés
      const compositionsList = data.produits.filter((p: any) => 
        p && p.type === 'composition' && p.id && p.nom
      );
      
      // Filtrer les produits valides pour les suggestions
      const validProducts = data.produits.filter((p: any) => 
        p && p.id && p.nom
      );

      setCompositions(compositionsList);
      setAllProducts(validProducts); // Charger seulement les produits valides
      
      console.log(`📋 ${compositionsList.length} compositions chargées`);
      console.log(`📦 ${validProducts.length} produits valides pour les suggestions`);
    } catch (error) {
      console.error('Erreur lors du chargement des compositions:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des compositions' });
    }
  };

  // Filtrer les compositions
  const filteredCompositions = compositions.filter(comp =>
    comp.id.includes(searchTerm) || 
    comp.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sélectionner une composition
  const handleSelectComposition = (composition: Composition) => {
    setSelectedComposition(composition);
    setEditingComposition({ ...composition });
  };

  // Modifier les propriétés de la composition
  const handleCompositionChange = (field: keyof Composition, value: any) => {
    if (editingComposition) {
      setEditingComposition({
        ...editingComposition,
        [field]: value
      });
    }
  };

  // Ajouter un composant
  const handleAddComponent = () => {
    if (editingComposition && newComponent.id && newComponent.nom) {
      const component: Composant = {
        id: newComponent.id,
        nom: newComponent.nom,
        quantite: newComponent.quantite || 1,
        categorie: newComponent.categorie || '',
        prix_vente_ttc: newComponent.prix_vente_ttc || 0
      };

      setEditingComposition({
        ...editingComposition,
        composants: [...editingComposition.composants, component],
        nombre_composants: editingComposition.composants.length + 1
      });

      setNewComponent({ id: '', nom: '', quantite: 1, categorie: '', prix_vente_ttc: 0 });
      setShowAddComponentDialog(false);
    }
  };

  // Supprimer un composant
  const handleRemoveComponent = (index: number) => {
    if (editingComposition) {
      const newComposants = editingComposition.composants.filter((_, i) => i !== index);
      setEditingComposition({
        ...editingComposition,
        composants: newComposants,
        nombre_composants: newComposants.length
      });
    }
  };

  // Modifier un composant
  const handleComponentChange = (index: number, field: keyof Composant, value: any) => {
    if (editingComposition) {
      const newComposants = [...editingComposition.composants];
      newComposants[index] = {
        ...newComposants[index],
        [field]: value
      };
      setEditingComposition({
        ...editingComposition,
        composants: newComposants
      });
    }
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!editingComposition) return;

    try {
      console.log('🔄 Début de la sauvegarde...');
      
      // Charger le fichier complet
      const response = await fetch('/produits-unifies-avec-prix.json');
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📦 Fichier chargé: ${data.produits?.length || 0} produits`);

      // Mettre à jour la composition
      const updatedProduits = data.produits.map((produit: any) =>
        produit.id === editingComposition.id ? editingComposition : produit
      );

      console.log(`🔄 Composition ${editingComposition.id} mise à jour`);

      // Sauvegarder
      const saveResponse = await fetch('http://localhost:3000/api/save-compositions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ produits: updatedProduits })
      });

      console.log(`📤 Réponse du serveur: ${saveResponse.status} ${saveResponse.statusText}`);

      if (saveResponse.ok) {
        const result = await saveResponse.json();
        console.log('✅ Sauvegarde réussie:', result);
        setMessage({ type: 'success', text: 'Composition mise à jour avec succès' });
        setSelectedComposition(editingComposition);
        setEditingComposition(null);
        loadCompositions();
        onCompositionUpdated?.();
      } else {
        const errorData = await saveResponse.json().catch(() => ({}));
        console.error('❌ Erreur serveur:', errorData);
        throw new Error(`Erreur serveur: ${saveResponse.status} - ${errorData.error || saveResponse.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setMessage({ 
        type: 'error', 
        text: `Erreur lors de la sauvegarde: ${errorMessage}` 
      });
    }
  };

  // Annuler les modifications
  const handleCancel = () => {
    setEditingComposition(null);
    setMessage(null);
  };

  // Créer une nouvelle composition
  const handleCreateNewComposition = () => {
    setShowNewCompositionDialog(true);
  };

  // Sauvegarder une nouvelle composition
  const handleSaveNewComposition = async () => {
    if (!newComposition.id || !newComposition.nom) {
      setMessage({ type: 'error', text: 'ID et nom sont obligatoires' });
      return;
    }

    // Vérifier que l'ID n'existe pas déjà
    const existingComposition = compositions.find(comp => comp.id === newComposition.id);
    if (existingComposition) {
      setMessage({ type: 'error', text: 'Une composition avec cet ID existe déjà' });
      return;
    }

    try {
      console.log('🔄 Création d\'une nouvelle composition...');
      
      // Charger le fichier complet
      const response = await fetch('/produits-unifies-avec-prix.json');
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📦 Fichier chargé: ${data.produits?.length || 0} produits`);

      // Créer la nouvelle composition
      const compositionToAdd: Composition = {
        id: newComposition.id!,
        nom: newComposition.nom!,
        categorie: newComposition.categorie || 'COMPOSITION VASQUE',
        prix_vente_ttc: newComposition.prix_vente_ttc || 0,
        type: 'composition',
        nombre_composants: newComposition.composants?.length || 0,
        composants: newComposition.composants || []
      };

      console.log(`🆕 Nouvelle composition: ${compositionToAdd.id} - ${compositionToAdd.nom}`);

      // Ajouter la nouvelle composition
      const updatedProduits = [...data.produits, compositionToAdd];

      // Sauvegarder
      const saveResponse = await fetch('http://localhost:3000/api/save-compositions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ produits: updatedProduits })
      });

      console.log(`📤 Réponse du serveur: ${saveResponse.status} ${saveResponse.statusText}`);

      if (saveResponse.ok) {
        const result = await saveResponse.json();
        console.log('✅ Création réussie:', result);
        setMessage({ type: 'success', text: 'Nouvelle composition créée avec succès' });
        setShowNewCompositionDialog(false);
        setNewComposition({
          id: '',
          nom: '',
          categorie: 'COMPOSITION VASQUE',
          prix_vente_ttc: 0,
          composants: []
        });
        loadCompositions();
        onCompositionUpdated?.();
      } else {
        const errorData = await saveResponse.json().catch(() => ({}));
        console.error('❌ Erreur serveur:', errorData);
        throw new Error(`Erreur serveur: ${saveResponse.status} - ${errorData.error || saveResponse.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setMessage({ 
        type: 'error', 
        text: `Erreur lors de la création de la composition: ${errorMessage}` 
      });
    }
  };

  // Ajouter un composant à la nouvelle composition
  const handleAddComponentToNew = () => {
    if (newComponent.id && newComponent.nom) {
      const component: Composant = {
        id: newComponent.id,
        nom: newComponent.nom,
        quantite: newComponent.quantite || 1,
        categorie: newComponent.categorie || '',
        prix_vente_ttc: newComponent.prix_vente_ttc || 0
      };

      setNewComposition({
        ...newComposition,
        composants: [...(newComposition.composants || []), component]
      });

      setNewComponent({ id: '', nom: '', quantite: 1, categorie: '', prix_vente_ttc: 0 });
    }
  };

  // Supprimer un composant de la nouvelle composition
  const handleRemoveComponentFromNew = (index: number) => {
    const newComposants = newComposition.composants?.filter((_, i) => i !== index) || [];
    setNewComposition({
      ...newComposition,
      composants: newComposants
    });
  };

  // Rechercher des composants par nom (priorité) ou ID
  const handleComponentSearch = (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setShowComponentSuggestions(false);
      setComponentSuggestions([]);
      return;
    }

    // Recherche prioritaire par nom, puis par ID avec vérifications de sécurité
    const suggestions = allProducts.filter(product => {
      // Vérifier que le produit et ses propriétés existent
      if (!product || !product.nom || !product.id) {
        return false;
      }
      
      return (
        product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.includes(searchTerm)
      );
    }).slice(0, 10); // Limiter à 10 suggestions

    setComponentSuggestions(suggestions);
    setShowComponentSuggestions(suggestions.length > 0);
  };

  // Sélectionner un composant depuis les suggestions
  const handleSelectComponentSuggestion = (product: any) => {
    // Vérifier que le produit et ses propriétés existent
    if (!product || !product.id || !product.nom) {
      console.error('Produit invalide sélectionné:', product);
      return;
    }

    setNewComponent({
      id: product.id,
      nom: product.nom,
      quantite: 1,
      categorie: product.categorie || '',
      prix_vente_ttc: 0
    });
    setShowComponentSuggestions(false);
    setComponentSuggestions([]);
  };



  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Éditeur de Compositions
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Liste des compositions */}
        <Box sx={{ flex: '0 0 400px' }}>
          <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
               <Typography variant="h6">
                 Compositions disponibles
               </Typography>
               <Button
                 startIcon={<AddIcon />}
                 variant="contained"
                 color="primary"
                 onClick={handleCreateNewComposition}
               >
                 Nouvelle composition
               </Button>
             </Box>
            
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Rechercher par ID ou nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />

            <List>
              {filteredCompositions.map((composition) => (
                <ListItem
                  key={composition.id}
                  onClick={() => handleSelectComposition(composition)}
                  sx={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedComposition?.id === composition.id ? 'action.selected' : 'transparent'
                  }}
                >
                                     <ListItemText
                     primary={`${composition.id} - ${composition.nom}`}
                     secondary={`${composition.nombre_composants} composants`}
                   />
                  <Chip 
                    label={composition.categorie} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        {/* Éditeur de composition */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
            {selectedComposition ? (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {editingComposition ? 'Modifier la composition' : 'Détails de la composition'}
                  </Typography>
                  {!editingComposition && (
                    <Button
                      startIcon={<EditIcon />}
                      variant="contained"
                      onClick={() => setEditingComposition({ ...selectedComposition })}
                    >
                      Modifier
                    </Button>
                  )}
                </Box>

                {editingComposition ? (
                  <Box>
                    {/* Propriétés de la composition */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <TextField
                          fullWidth
                          label="ID"
                          value={editingComposition.id}
                          disabled
                          sx={{ mb: 2 }}
                        />
                      </Box>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <TextField
                          fullWidth
                          label="Nom"
                          value={editingComposition.nom}
                          onChange={(e) => handleCompositionChange('nom', e.target.value)}
                          sx={{ mb: 2 }}
                        />
                      </Box>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <TextField
                          fullWidth
                          label="Catégorie"
                          value={editingComposition.categorie}
                          onChange={(e) => handleCompositionChange('categorie', e.target.value)}
                          sx={{ mb: 2 }}
                        />
                      </Box>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <TextField
                          fullWidth
                          label="Prix de vente TTC"
                          type="number"
                          value={editingComposition.prix_vente_ttc}
                          onChange={(e) => handleCompositionChange('prix_vente_ttc', parseFloat(e.target.value) || 0)}
                          sx={{ mb: 2 }}
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Liste des composants */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Composants ({editingComposition.composants.length})
                      </Typography>
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        onClick={() => setShowAddComponentDialog(true)}
                      >
                        Ajouter un composant
                      </Button>
                    </Box>

                    <List>
                      {editingComposition.composants.map((composant, index) => (
                        <ListItem key={index} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <TextField
                                  size="small"
                                  label="ID"
                                  value={composant.id}
                                  onChange={(e) => handleComponentChange(index, 'id', e.target.value)}
                                  sx={{ width: 100 }}
                                />
                                <TextField
                                  size="small"
                                  label="Nom"
                                  value={composant.nom}
                                  onChange={(e) => handleComponentChange(index, 'nom', e.target.value)}
                                  sx={{ flexGrow: 1 }}
                                />
                                <TextField
                                  size="small"
                                  label="Quantité"
                                  type="number"
                                  value={composant.quantite}
                                  onChange={(e) => handleComponentChange(index, 'quantite', parseInt(e.target.value) || 1)}
                                  sx={{ width: 80 }}
                                />
                                <TextField
                                  size="small"
                                  label="Prix TTC"
                                  type="number"
                                  value={composant.prix_vente_ttc}
                                  onChange={(e) => handleComponentChange(index, 'prix_vente_ttc', parseFloat(e.target.value) || 0)}
                                  sx={{ width: 100 }}
                                />
                              </Box>
                            }
                            secondary={composant.categorie}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveComponent(index)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>

                    {/* Boutons d'action */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                      <Button
                        startIcon={<SaveIcon />}
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                      >
                        Sauvegarder
                      </Button>
                      <Button
                        startIcon={<CancelIcon />}
                        variant="outlined"
                        onClick={handleCancel}
                      >
                        Annuler
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>ID:</strong> {selectedComposition.id}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Nom:</strong> {selectedComposition.nom}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Catégorie:</strong> {selectedComposition.categorie}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Prix de vente TTC:</strong> {selectedComposition.prix_vente_ttc}€
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Nombre de composants:</strong> {selectedComposition.nombre_composants}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Composants:
                    </Typography>
                    <List>
                      {selectedComposition.composants.map((composant, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`${composant.nom} (ID: ${composant.id})`}
                            secondary={`Quantité: ${composant.quantite} | Prix: ${composant.prix_vente_ttc}€ | Catégorie: ${composant.categorie}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  Sélectionnez une composition pour la modifier
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

             {/* Dialog pour ajouter un composant */}
       <Dialog open={showAddComponentDialog} onClose={() => setShowAddComponentDialog(false)}>
         <DialogTitle>Ajouter un composant</DialogTitle>
         <DialogContent>
           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
             <Box sx={{ position: 'relative' }}>
                               <TextField
                  fullWidth
                  label="Rechercher un composant"
                  value={newComponent.id}
                  onChange={(e) => {
                    setNewComponent({ ...newComponent, id: e.target.value });
                    handleComponentSearch(e.target.value);
                  }}
                  placeholder="Tapez le nom du composant (ex: VASQUE, BK, etc.)..."
                />
               {showComponentSuggestions && (
                 <Paper 
                   sx={{ 
                     position: 'absolute', 
                     top: '100%', 
                     left: 0, 
                     right: 0, 
                     zIndex: 1000,
                     maxHeight: 200,
                     overflow: 'auto',
                     boxShadow: 3
                   }}
                 >
                   <List dense>
                     {componentSuggestions.map((product, index) => (
                       <ListItem 
                         key={index}
                         onClick={() => handleSelectComponentSuggestion(product)}
                         sx={{ py: 0.5, cursor: 'pointer' }}
                       >
                         <ListItemText
                           primary={`${product.id} - ${product.nom}`}
                           secondary={product.categorie}
                           primaryTypographyProps={{ fontSize: '0.875rem' }}
                           secondaryTypographyProps={{ fontSize: '0.75rem' }}
                         />
                       </ListItem>
                     ))}
                   </List>
                 </Paper>
               )}
             </Box>
            <TextField
              fullWidth
              label="Nom du composant"
              value={newComponent.nom}
              onChange={(e) => setNewComponent({ ...newComponent, nom: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Quantité"
                type="number"
                value={newComponent.quantite}
                onChange={(e) => setNewComponent({ ...newComponent, quantite: parseInt(e.target.value) || 1 })}
              />
              <TextField
                fullWidth
                label="Prix TTC"
                type="number"
                value={newComponent.prix_vente_ttc}
                onChange={(e) => setNewComponent({ ...newComponent, prix_vente_ttc: parseFloat(e.target.value) || 0 })}
              />
            </Box>
            <TextField
              fullWidth
              label="Catégorie"
              value={newComponent.categorie}
              onChange={(e) => setNewComponent({ ...newComponent, categorie: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddComponentDialog(false)}>Annuler</Button>
          <Button onClick={handleAddComponent} variant="contained">
            Ajouter
          </Button>
                 </DialogActions>
       </Dialog>

       {/* Dialog pour créer une nouvelle composition */}
       <Dialog 
         open={showNewCompositionDialog} 
         onClose={() => setShowNewCompositionDialog(false)}
         maxWidth="md"
         fullWidth
       >
         <DialogTitle>Créer une nouvelle composition</DialogTitle>
         <DialogContent>
           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
             {/* Propriétés de la composition */}
             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
               <Box sx={{ flex: '1 1 200px' }}>
                 <TextField
                   fullWidth
                   label="ID de la composition"
                   value={newComposition.id}
                   onChange={(e) => setNewComposition({ ...newComposition, id: e.target.value })}
                   required
                 />
               </Box>
               <Box sx={{ flex: '1 1 200px' }}>
                 <TextField
                   fullWidth
                   label="Nom de la composition"
                   value={newComposition.nom}
                   onChange={(e) => setNewComposition({ ...newComposition, nom: e.target.value })}
                   required
                 />
               </Box>
               <Box sx={{ flex: '1 1 200px' }}>
                 <TextField
                   fullWidth
                   label="Catégorie"
                   value={newComposition.categorie}
                   onChange={(e) => setNewComposition({ ...newComposition, categorie: e.target.value })}
                 />
               </Box>
               <Box sx={{ flex: '1 1 200px' }}>
                 <TextField
                   fullWidth
                   label="Prix de vente TTC"
                   type="number"
                   value={newComposition.prix_vente_ttc}
                   onChange={(e) => setNewComposition({ ...newComposition, prix_vente_ttc: parseFloat(e.target.value) || 0 })}
                 />
               </Box>
             </Box>

             <Divider sx={{ my: 2 }} />

             {/* Ajout de composants */}
             <Typography variant="h6" gutterBottom>
               Composants ({newComposition.composants?.length || 0})
             </Typography>
             
                           <Box sx={{ display: 'flex', gap: 2, mb: 2, position: 'relative' }}>
                                 <Box sx={{ position: 'relative', width: 200 }}>
                   <TextField
                     size="small"
                     label="Rechercher un composant"
                     value={newComponent.id}
                     onChange={(e) => {
                       setNewComponent({ ...newComponent, id: e.target.value });
                       handleComponentSearch(e.target.value);
                     }}
                     sx={{ width: '100%' }}
                     placeholder="Tapez le nom du composant..."
                   />
                  {showComponentSuggestions && (
                    <Paper 
                      sx={{ 
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        right: 0, 
                        zIndex: 1000,
                        maxHeight: 200,
                        overflow: 'auto',
                        boxShadow: 3
                      }}
                    >
                      <List dense>
                        {componentSuggestions.map((product, index) => (
                          <ListItem 
                            key={index}
                            onClick={() => handleSelectComponentSuggestion(product)}
                            sx={{ py: 0.5, cursor: 'pointer' }}
                          >
                            <ListItemText
                              primary={`${product.id} - ${product.nom}`}
                              secondary={product.categorie}
                              primaryTypographyProps={{ fontSize: '0.875rem' }}
                              secondaryTypographyProps={{ fontSize: '0.75rem' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>
                <TextField
                  size="small"
                  label="Nom du composant"
                  value={newComponent.nom}
                  onChange={(e) => setNewComponent({ ...newComponent, nom: e.target.value })}
                  sx={{ flexGrow: 1 }}
                />
               <TextField
                 size="small"
                 label="Quantité"
                 type="number"
                 value={newComponent.quantite}
                 onChange={(e) => setNewComponent({ ...newComponent, quantite: parseInt(e.target.value) || 1 })}
                 sx={{ width: 80 }}
               />
               <TextField
                 size="small"
                 label="Catégorie"
                 value={newComponent.categorie}
                 onChange={(e) => setNewComponent({ ...newComponent, categorie: e.target.value })}
                 sx={{ width: 120 }}
               />
               <Button
                 size="small"
                 variant="outlined"
                 onClick={handleAddComponentToNew}
                 disabled={!newComponent.id || !newComponent.nom}
               >
                 Ajouter
               </Button>
             </Box>

             {/* Liste des composants ajoutés */}
             {newComposition.composants && newComposition.composants.length > 0 && (
               <List sx={{ border: '1px solid #e0e0e0', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                 {newComposition.composants.map((composant, index) => (
                   <ListItem key={index} sx={{ py: 1 }}>
                     <ListItemText
                       primary={`${composant.nom} (ID: ${composant.id})`}
                       secondary={`Quantité: ${composant.quantite} | Catégorie: ${composant.categorie}`}
                     />
                     <ListItemSecondaryAction>
                       <IconButton
                         edge="end"
                         onClick={() => handleRemoveComponentFromNew(index)}
                         color="error"
                         size="small"
                       >
                         <DeleteIcon />
                       </IconButton>
                     </ListItemSecondaryAction>
                   </ListItem>
                 ))}
               </List>
             )}
           </Box>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setShowNewCompositionDialog(false)}>
             Annuler
           </Button>
           <Button 
             onClick={handleSaveNewComposition} 
             variant="contained"
             disabled={!newComposition.id || !newComposition.nom}
           >
             Créer la composition
           </Button>
         </DialogActions>
       </Dialog>
     </Box>
   );
 };

export default CompositionEditor;
