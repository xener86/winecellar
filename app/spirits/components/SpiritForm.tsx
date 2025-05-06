// app/spirits/components/SpiritForm.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  Chip,
  Paper,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Switch,
  FormControlLabel,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Spirit, SpiritType, FillLevel } from '@/utils/types/spirit.types';
import AISearchPanel from './AISearchPanel';

interface SpiritFormProps {
  initialData?: Partial<Spirit>;
  onSubmit: (data: Spirit) => Promise<void>;
  apiKey?: string;
  onCancel?: () => void;
  loading?: boolean;
}

const defaultSpirit: Partial<Spirit> = {
  name: '',
  type: 'other' as SpiritType,
  subType: null,
  abv: 40, // Valeur par défaut commune
  volume: 700, // 70cl est standard
  origin: {
    country: '',
    region: null,
    distillery: null
  },
  age: null,
  vintage: null,
  details: {
    color: null,
    finish: null,
    tastingNotes: null,
    ingredients: null
  },
  acquisition: {
    date: new Date().toISOString().split('T')[0], // Date du jour
    price: null,
    store: null
  },
  storage: {
    locationId: null,
    position: {
      id: null,
      row: null,
      column: null
    },
    fillLevel: 'full' as FillLevel
  },
  bottleImage: null,
  notes: null,
  customTags: null
};

const SpiritForm: React.FC<SpiritFormProps> = ({
  initialData,
  onSubmit,
  apiKey = '',
  onCancel,
  loading = false
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState<Partial<Spirit>>(initialData || defaultSpirit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [useAI, setUseAI] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mettre à jour le formulaire si initialData change
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...defaultSpirit,
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  // Gérer les changements de champs simples
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Gestion des propriétés imbriquées
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof Partial<Spirit>],
          [child]: value
        }
      }));
    } else {
      // Champs simples
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Effacer l'erreur si le champ est rempli
    if (value && errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Gérer les changements de selects
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    if (name.includes('.')) {
      // Gestion des propriétés imbriquées
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof Partial<Spirit>],
          [child]: value
        }
      }));
    } else {
      // Champs simples
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Effacer l'erreur si le champ est rempli
    if (value && errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Gérer les changements de champs numériques
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = value === '' ? null : Number(value);
    
    if (name.includes('.')) {
      // Gestion des propriétés imbriquées
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof Partial<Spirit>],
          [child]: numberValue
        }
      }));
    } else {
      // Champs simples
      setFormData(prev => ({
        ...prev,
        [name]: numberValue
      }));
    }
    
    // Effacer l'erreur si le champ est rempli
    if (value && errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Ajouter un tag personnalisé
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      customTags: [...(prev.customTags || []), newTag.trim()]
    }));
    
    setNewTag('');
  };

  // Supprimer un tag
  const handleDeleteTag = (tagToDelete: string) => {
    setFormData(prev => ({
      ...prev,
      customTags: (prev.customTags || []).filter(tag => tag !== tagToDelete)
    }));
  };

  // Ajouter une note de dégustation
  const handleAddTastingNote = (note: string) => {
    if (!note.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        tastingNotes: [...(prev.details?.tastingNotes || []), note.trim()]
      }
    }));
  };

  // Supprimer une note de dégustation
  const handleDeleteTastingNote = (noteToDelete: string) => {
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        tastingNotes: (prev.details?.tastingNotes || []).filter(note => note !== noteToDelete)
      }
    }));
  };

  // Recevoir les données de l'IA
  const handleAIResult = (spiritData: Partial<Spirit>) => {
    setFormData(prev => ({
      ...prev,
      ...spiritData
    }));
    
    setUseAI(false);
  };

  // Valider le formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Champs obligatoires
    if (!formData.name?.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }
    
    if (!formData.type) {
      newErrors.type = 'Le type est obligatoire';
    }
    
    if (!formData.abv || formData.abv <= 0) {
      newErrors.abv = 'Le degré d\'alcool est obligatoire';
    }
    
    if (!formData.origin?.country?.trim()) {
      newErrors['origin.country'] = 'Le pays d\'origine est obligatoire';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Construction de l'objet Spirit complet
      const spiritData = {
        ...defaultSpirit,
        ...formData,
        // Assurer que les champs obligatoires sont définis
        name: formData.name || '',
        type: formData.type || 'other',
        abv: formData.abv || 0,
        origin: {
          country: formData.origin?.country || '',
          region: formData.origin?.region || null,
          distillery: formData.origin?.distillery || null
        },
        acquisition: {
          date: formData.acquisition?.date || new Date().toISOString().split('T')[0],
          price: formData.acquisition?.price || null,
          store: formData.acquisition?.store || null
        },
        storage: {
          locationId: formData.storage?.locationId || null,
          position: formData.storage?.position || { id: null, row: null, column: null },
          fillLevel: formData.storage?.fillLevel || 'full'
        }
      } as Spirit;
      
      await onSubmit(spiritData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si mode IA activé, afficher seulement le panneau de recherche IA
  if (useAI) {
    return (
      <Box>
        <AISearchPanel 
          onSpiritFound={handleAIResult} 
          apiKey={apiKey} 
        />
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="text" 
            onClick={() => setUseAI(false)}
          >
            Revenir au formulaire
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => setUseAI(true)}
          disabled={!apiKey}
        >
          Utiliser l&apos;IA pour compléter
        </Button>
        
        {!apiKey && (
          <FormHelperText error>
            Clé API non configurée dans les paramètres
          </FormHelperText>
        )}
      </Box>
      
      <Tabs 
        value={activeTab} 
        onChange={(_e, newValue) => setActiveTab(newValue)} 
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Informations générales" />
        <Tab label="Détails & Notes" />
        <Tab label="Acquisition & Stockage" />
      </Tabs>
      
      {/* Onglet 1: Informations générales */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3}>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                required
                label="Nom"
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
                required 
                margin="normal"
                error={!!errors.type}
              >
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type || ''}
                  onChange={handleSelectChange}
                  label="Type"
                >
                  <MenuItem value="whisky">Whisky</MenuItem>
                  <MenuItem value="rum">Rhum</MenuItem>
                  <MenuItem value="gin">Gin</MenuItem>
                  <MenuItem value="vodka">Vodka</MenuItem>
                  <MenuItem value="tequila">Tequila</MenuItem>
                  <MenuItem value="brandy">Brandy</MenuItem>
                  <MenuItem value="liqueur">Liqueur</MenuItem>
                  <MenuItem value="other">Autre</MenuItem>
                </Select>
                {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Sous-type"
                name="subType"
                value={formData.subType || ''}
                onChange={handleChange}
                margin="normal"
                helperText="Ex: Single Malt, VSOP, Añejo, etc."
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                required
                label="Degré d'alcool"
                name="abv"
                type="number"
                value={formData.abv === null ? '' : formData.abv}
                onChange={handleNumberChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{
                  min: 0,
                  max: 100,
                  step: 0.1
                }}
                error={!!errors.abv}
                helperText={errors.abv}
                margin="normal"
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Volume"
                name="volume"
                type="number"
                value={formData.volume === null ? '' : formData.volume}
                onChange={handleNumberChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">ml</InputAdornment>,
                }}
                inputProps={{
                  min: 0,
                  step: 50
                }}
                margin="normal"
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Âge"
                name="age"
                type="number"
                value={formData.age === null ? '' : formData.age}
                onChange={handleNumberChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">ans</InputAdornment>,
                }}
                inputProps={{
                  min: 0,
                  step: 1
                }}
                margin="normal"
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Millésime"
                name="vintage"
                type="number"
                value={formData.vintage === null ? '' : formData.vintage}
                onChange={handleNumberChange}
                inputProps={{
                  min: 1800,
                  max: new Date().getFullYear(),
                  step: 1
                }}
                margin="normal"
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Origine
              </Typography>
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                required
                label="Pays"
                name="origin.country"
                value={formData.origin?.country || ''}
                onChange={handleChange}
                error={!!errors['origin.country']}
                helperText={errors['origin.country']}
                margin="normal"
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Région"
                name="origin.region"
                value={formData.origin?.region || ''}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <TextField
                fullWidth
                label="Distillerie"
                name="origin.distillery"
                value={formData.origin?.distillery || ''}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Onglet 2: Détails & Notes */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={3}>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Couleur"
                name="details.color"
                value={formData.details?.color || ''}
                onChange={handleChange}
                margin="normal"
                helperText="Ex: Ambré, Or, Caramel foncé, etc."
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Finition / Vieillissement"
                name="details.finish"
                value={formData.details?.finish || ''}
                onChange={handleChange}
                margin="normal"
                helperText="Ex: Fût de Sherry, Double maturation, etc."
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Notes de dégustation
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Ajouter une note de dégustation"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                
                <Button 
                  variant="outlined" 
                  onClick={() => handleAddTastingNote(newTag)}
                  disabled={!newTag.trim()}
                >
                  Ajouter
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.details?.tastingNotes?.map((note, index) => (
                  <Chip
                    key={index}
                    label={note}
                    onDelete={() => handleDeleteTastingNote(note)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Tags personnalisés
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Ajouter un tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                
                <Button 
                  variant="outlined" 
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  Ajouter
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.customTags?.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <TextField
                fullWidth
                label="Notes personnelles"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                multiline
                rows={4}
                margin="normal"
              />
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Onglet 3: Acquisition & Stockage */}
      {activeTab === 2 && (
        <Box>
          <Grid container spacing={3}>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Date d'acquisition"
                name="acquisition.date"
                type="date"
                value={formData.acquisition?.date || new Date().toISOString().split('T')[0]}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                margin="normal"
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Prix"
                name="acquisition.price"
                type="number"
                value={formData.acquisition?.price === null ? '' : formData.acquisition?.price}
                onChange={handleNumberChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                }}
                inputProps={{
                  min: 0,
                  step: 0.01
                }}
                margin="normal"
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <TextField
                fullWidth
                label="Lieu d'achat"
                name="acquisition.store"
                value={formData.acquisition?.store || ''}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Niveau de la bouteille
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Niveau de remplissage</InputLabel>
                <Select
                  name="storage.fillLevel"
                  value={formData.storage?.fillLevel || 'full'}
                  onChange={handleSelectChange}
                  label="Niveau de remplissage"
                >
                  <MenuItem value="full">Pleine (100%)</MenuItem>
                  <MenuItem value="threeFourths">Trois quarts (75%)</MenuItem>
                  <MenuItem value="half">Moitié (50%)</MenuItem>
                  <MenuItem value="oneFourth">Un quart (25%)</MenuItem>
                  <MenuItem value="empty">Vide (0%)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <TextField
                fullWidth
                label="URL de l'image"
                name="bottleImage"
                value={formData.bottleImage || ''}
                onChange={handleChange}
                margin="normal"
                helperText="Lien vers une image de la bouteille"
              />
            </Grid>
          </Grid>
        </Box>
      )}
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        {onCancel && (
          <Button 
            variant="outlined" 
            onClick={onCancel}
            disabled={isSubmitting || loading}
          >
            Annuler
          </Button>
        )}
        
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          startIcon={isSubmitting || loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          disabled={isSubmitting || loading}
        >
          Enregistrer
        </Button>
      </Box>
    </Box>
  );
};

export default SpiritForm;