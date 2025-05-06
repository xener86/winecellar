// app/spirits/storage/components/AddStorageModal.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormHelperText,
  CircularProgress,
  Alert,
  Box,
  Typography,
  useTheme,
  SelectChangeEvent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { SpiritStorageLocation } from '@/utils/types/spirit.types';
import { supabase } from '@/utils/supabase';

interface AddStorageModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: SpiritStorageLocation; // Pour l'édition
}

const AddStorageModal: React.FC<AddStorageModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialData
}) => {
  const theme = useTheme();
  
  // Données du formulaire
  const [formData, setFormData] = useState<Partial<SpiritStorageLocation>>({
    name: '',
    type: 'cabinet',
    layout: 'grid',
    rowCount: 3,
    columnCount: 3,
    description: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Mettre à jour le formulaire avec les données initiales
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData
      });
    } else {
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        type: 'cabinet',
        layout: 'grid',
        rowCount: 3,
        columnCount: 3,
        description: null
      });
    }
  }, [initialData, open]);
  
  // Gérer les changements de champs simples
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur si le champ est rempli
    if (value && errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Gérer les changements de selects
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gérer les changements de nombres
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = value === '' ? null : Number(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: numberValue
    }));
  };
  
  // Valider le formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Vérifier le nom
    if (!formData.name?.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }
    
    // Vérifier les dimensions pour la disposition en grille
    if (formData.layout === 'grid') {
      if (!formData.rowCount || formData.rowCount <= 0) {
        newErrors.rowCount = 'Le nombre de rangées doit être supérieur à 0';
      }
      
      if (!formData.columnCount || formData.columnCount <= 0) {
        newErrors.columnCount = 'Le nombre de colonnes doit être supérieur à 0';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      const now = new Date().toISOString();
      
      if (initialData) {
        // Mise à jour d'un emplacement existant
        const { error } = await supabase
          .from('spirit_storage_locations')
          .update({
            name: formData.name,
            type: formData.type,
            layout: formData.layout,
            rowCount: formData.layout === 'grid' ? formData.rowCount : null,
            columnCount: formData.layout === 'grid' ? formData.columnCount : null,
            description: formData.description,
            updatedAt: now
          })
          .eq('id', initialData.id);
        
        if (error) throw error;
      } else {
        // Création d'un nouvel emplacement
        const { error } = await supabase
          .from('spirit_storage_locations')
          .insert({
            name: formData.name,
            type: formData.type,
            layout: formData.layout,
            rowCount: formData.layout === 'grid' ? formData.rowCount : null,
            columnCount: formData.layout === 'grid' ? formData.columnCount : null,
            description: formData.description,
            userId: user.id,
            createdAt: now,
            updatedAt: now
          });
        
        if (error) throw error;
      }
      
      onSuccess();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {initialData ? 'Modifier un emplacement' : 'Ajouter un emplacement de stockage'}
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2}>
          <Grid component="div" sx={{ width: '100%' }}>
            <TextField
              required
              fullWidth
              label="Nom de l'emplacement"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              margin="normal"
            />
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
            <FormControl 
              fullWidth 
              margin="normal"
            >
              <InputLabel>Type d&apos;emplacement</InputLabel>
              <Select
                name="type"
                value={formData.type || 'cabinet'}
                onChange={handleSelectChange}
                label="Type d'emplacement"
              >
                <MenuItem value="bar">Bar</MenuItem>
                <MenuItem value="cabinet">Armoire</MenuItem>
                <MenuItem value="display">Vitrine</MenuItem>
                <MenuItem value="cellar">Cave</MenuItem>
                <MenuItem value="other">Autre</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
            <FormControl 
              fullWidth 
              margin="normal"
            >
              <InputLabel>Disposition</InputLabel>
              <Select
                name="layout"
                value={formData.layout || 'grid'}
                onChange={handleSelectChange}
                label="Disposition"
              >
                <MenuItem value="grid">Grille</MenuItem>
                <MenuItem value="shelf">Étagère</MenuItem>
                <MenuItem value="custom">Personnalisée</MenuItem>
              </Select>
              <FormHelperText>
                La disposition détermine comment les bouteilles sont organisées
              </FormHelperText>
            </FormControl>
          </Grid>
          
          {formData.layout === 'grid' && (
            <>
              <Grid component="div" sx={{ width: { xs: '50%' } }}>
                <TextField
                  fullWidth
                  required
                  label="Nombre de rangées"
                  name="rowCount"
                  type="number"
                  value={formData.rowCount === null ? '' : formData.rowCount}
                  onChange={handleNumberChange}
                  error={!!errors.rowCount}
                  helperText={errors.rowCount}
                  margin="normal"
                  inputProps={{ min: 1, max: 20 }}
                />
              </Grid>
              
              <Grid component="div" sx={{ width: { xs: '50%' } }}>
                <TextField
                  fullWidth
                  required
                  label="Nombre de colonnes"
                  name="columnCount"
                  type="number"
                  value={formData.columnCount === null ? '' : formData.columnCount}
                  onChange={handleNumberChange}
                  error={!!errors.columnCount}
                  helperText={errors.columnCount}
                  margin="normal"
                  inputProps={{ min: 1, max: 20 }}
                />
              </Grid>
            </>
          )}
          
          <Grid component="div" sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Description (optionnelle)"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
        
        {formData.layout === 'grid' && formData.rowCount && formData.columnCount && (
          <Box sx={{ mt: 3, border: `1px dashed ${theme.palette.divider}`, p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Aperçu de la grille
            </Typography>
            
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${formData.columnCount}, 1fr)`,
                gap: 1,
                mt: 1
              }}
            >
              {Array.from({ length: formData.rowCount || 0 }).map((_, rowIndex) =>
                Array.from({ length: formData.columnCount || 0 }).map((_, colIndex) => (
                  <Box
                    key={`${rowIndex}-${colIndex}`}
                    sx={{
                      height: 40,
                      bgcolor: theme.palette.action.hover,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: 'text.secondary'
                    }}
                  >
                    {rowIndex+1}.{colIndex+1}
                  </Box>
                ))
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Annuler
        </Button>
        
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {initialData ? 'Mettre à jour' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStorageModal;