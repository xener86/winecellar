// app/spirits/components/CocktailForm.tsx

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
  Divider,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Rating
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import { 
  Cocktail, 
  CocktailCategory, 
  GlassType, 
  PreparationMethod,
  CocktailIngredient
} from '@/utils/types/cocktail.types';
import { Spirit } from '@/utils/types/spirit.types';
import IngredientSelector from './IngredientSelector';

// Props pour le formulaire de cocktail
interface CocktailFormProps {
  initialData?: Partial<Cocktail>;
  availableSpirits: Spirit[];
  onSubmit: (data: Cocktail) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

// Données par défaut pour un nouveau cocktail
const defaultCocktail: Partial<Cocktail> = {
  name: '',
  category: 'modern' as CocktailCategory,
  glassType: 'highball' as GlassType,
  ingredients: [],
  garnish: null,
  preparation: '',
  preparationMethod: 'built' as PreparationMethod,
  image: null,
  isCustom: true,
  isFavorite: false,
  notes: null,
  tags: [],
  rating: null,
  difficulty: 'medium'
};

// Fonction pour générer un ID unique pour un nouveau cocktail
const generateCocktailId = (): string => {
  return `cocktail_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

const CocktailForm: React.FC<CocktailFormProps> = ({
  initialData,
  availableSpirits,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // État du formulaire
  const [formData, setFormData] = useState<Partial<Cocktail>>(initialData || defaultCocktail);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [newTag, setNewTag] = useState('');
  
  // Mettre à jour le formulaire si initialData change
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...defaultCocktail,
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);
  
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
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;
    
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
  
  // Gérer les changements d'ingrédients
  const handleIngredientsChange = (ingredients: CocktailIngredient[]) => {
    setFormData(prev => ({
      ...prev,
      ingredients
    }));
    
    // Effacer l'erreur si des ingrédients sont ajoutés
    if (ingredients.length > 0 && errors['ingredients']) {
      setErrors(prev => ({
        ...prev,
        ingredients: ''
      }));
    }
  };
  
  // Gérer le changement de note
  const handleRatingChange = (_event: React.ChangeEvent<{}>, value: number | null) => {
    setFormData(prev => ({
      ...prev,
      rating: value
    }));
  };
  
  // Ajouter un tag
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      tags: [...(prev.tags || []), newTag.trim()]
    }));
    
    setNewTag('');
  };
  
  // Supprimer un tag
  const handleDeleteTag = (tagToDelete: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToDelete)
    }));
  };
  
  // Valider le formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Champs obligatoires
    if (!formData.name?.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }
    
    if (!formData.ingredients || formData.ingredients.length === 0) {
      newErrors.ingredients = 'Au moins un ingrédient est obligatoire';
    }
    
    if (!formData.preparation?.trim()) {
      newErrors.preparation = 'Les instructions de préparation sont obligatoires';
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
      // Construction de l'objet Cocktail complet
      const now = new Date().toISOString();
      
      const cocktailData = {
        id: formData.id || generateCocktailId(),
        name: formData.name || '',
        category: formData.category || 'modern',
        glassType: formData.glassType || 'highball',
        ingredients: formData.ingredients || [],
        garnish: formData.garnish,
        preparation: formData.preparation || '',
        preparationMethod: formData.preparationMethod || 'built',
        image: formData.image,
        isCustom: true,
        isFavorite: formData.isFavorite || false,
        notes: formData.notes,
        tags: formData.tags || [],
        rating: formData.rating,
        difficulty: formData.difficulty || 'medium',
        userId: '', // Sera défini côté serveur
        createdAt: formData.createdAt || now,
        updatedAt: now
      } as Cocktail;
      
      await onSubmit(cocktailData);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Définir les étapes du formulaire
  const steps = [
    { label: 'Informations de base', icon: <LocalBarIcon /> },
    { label: 'Ingrédients', icon: <LocalBarIcon /> },
    { label: 'Préparation', icon: <LocalBarIcon /> }
  ];
  
  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Navigation entre les étapes */}
      <Box sx={{ display: 'flex', mb: 4 }}>
        {steps.map((step, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              '&:not(:last-child)::after': {
                content: '""',
                position: 'absolute',
                top: '20px',
                right: '-50%',
                width: '100%',
                height: 2,
                backgroundColor: index < activeStep ? theme.palette.primary.main : theme.palette.divider
              }
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: index <= activeStep ? theme.palette.primary.main : 'transparent',
                border: `2px solid ${index <= activeStep ? theme.palette.primary.main : theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: index <= activeStep ? 'white' : 'text.secondary',
                mb: 1,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setActiveStep(index)}
            >
              {step.icon}
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: index <= activeStep ? 'text.primary' : 'text.secondary',
                fontWeight: index === activeStep ? 'medium' : 'normal'
              }}
            >
              {step.label}
            </Typography>
          </Box>
        ))}
      </Box>
      
      {/* Étape 1: Informations de base */}
      {activeStep === 0 && (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Informations de base
          </Typography>
          
          <Grid container spacing={3}>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                required
                label="Nom du cocktail"
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
              >
                <InputLabel>Catégorie</InputLabel>
                <Select
                  name="category"
                  value={formData.category || 'modern'}
                  onChange={handleSelectChange}
                  label="Catégorie"
                >
                  <MenuItem value="classic">Classique</MenuItem>
                  <MenuItem value="modern">Moderne</MenuItem>
                  <MenuItem value="tiki">Tiki</MenuItem>
                  <MenuItem value="sour">Sour</MenuItem>
                  <MenuItem value="highball">Highball</MenuItem>
                  <MenuItem value="fizz">Fizz</MenuItem>
                  <MenuItem value="frozen">Glacé</MenuItem>
                  <MenuItem value="hot">Chaud</MenuItem>
                  <MenuItem value="punch">Punch</MenuItem>
                  <MenuItem value="martini">Martini</MenuItem>
                  <MenuItem value="other">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <FormControl 
                fullWidth 
                required 
                margin="normal"
              >
                <InputLabel>Type de verre</InputLabel>
                <Select
                  name="glassType"
                  value={formData.glassType || 'highball'}
                  onChange={handleSelectChange}
                  label="Type de verre"
                >
                  <MenuItem value="highball">Highball</MenuItem>
                  <MenuItem value="lowball">Tumbler</MenuItem>
                  <MenuItem value="martini">Martini</MenuItem>
                  <MenuItem value="coupe">Coupe</MenuItem>
                  <MenuItem value="flute">Flûte</MenuItem>
                  <MenuItem value="hurricane">Hurricane</MenuItem>
                  <MenuItem value="margarita">Margarita</MenuItem>
                  <MenuItem value="mug">Mug</MenuItem>
                  <MenuItem value="shot">Shot</MenuItem>
                  <MenuItem value="collins">Collins</MenuItem>
                  <MenuItem value="wine">Verre à vin</MenuItem>
                  <MenuItem value="other">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <FormControl 
                fullWidth 
                required 
                margin="normal"
              >
                <InputLabel>Difficulté</InputLabel>
                <Select
                  name="difficulty"
                  value={formData.difficulty || 'medium'}
                  onChange={handleSelectChange}
                  label="Difficulté"
                >
                  <MenuItem value="easy">Facile</MenuItem>
                  <MenuItem value="medium">Moyenne</MenuItem>
                  <MenuItem value="hard">Difficile</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <TextField
                fullWidth
                label="Garniture (optionnel)"
                name="garnish"
                value={formData.garnish || ''}
                onChange={handleChange}
                margin="normal"
                placeholder="Ex: Zeste d'orange, Cerise, Olive, etc."
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <TextField
                fullWidth
                label="URL de l'image (optionnel)"
                name="image"
                value={formData.image || ''}
                onChange={handleChange}
                margin="normal"
                placeholder="https://exemple.com/image.jpg"
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Note personnelle
              </Typography>
              <Rating
                name="rating"
                value={formData.rating || 0}
                onChange={handleRatingChange}
                size="large"
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setActiveStep(1)}
            >
              Suivant: Ingrédients
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Étape 2: Ingrédients */}
      {activeStep === 1 && (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Ingrédients
          </Typography>
          
          {errors.ingredients && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.ingredients}
            </Alert>
          )}
          
          <IngredientSelector
            selectedIngredients={formData.ingredients || []}
            availableSpirits={availableSpirits}
            onChange={handleIngredientsChange}
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(0)}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setActiveStep(2)}
            >
              Suivant: Préparation
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Étape 3: Préparation */}
      {activeStep === 2 && (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Préparation
          </Typography>
          
          <Grid container spacing={3}>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <FormControl 
                fullWidth 
                required 
                margin="normal"
              >
                <InputLabel>Méthode de préparation</InputLabel>
                <Select
                  name="preparationMethod"
                  value={formData.preparationMethod || 'built'}
                  onChange={handleSelectChange}
                  label="Méthode de préparation"
                >
                  <MenuItem value="shaken">Shaker</MenuItem>
                  <MenuItem value="stirred">Mélanger à la cuillère</MenuItem>
                  <MenuItem value="built">Construire dans le verre</MenuItem>
                  <MenuItem value="blended">Mixer</MenuItem>
                  <MenuItem value="layered">Superposer</MenuItem>
                  <MenuItem value="muddled">Piler</MenuItem>
                  <MenuItem value="hot-build">Construire à chaud</MenuItem>
                  <MenuItem value="other">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <TextField
                fullWidth
                required
                label="Instructions de préparation"
                name="preparation"
                value={formData.preparation || ''}
                onChange={handleChange}
                error={!!errors.preparation}
                helperText={errors.preparation}
                margin="normal"
                multiline
                rows={5}
                placeholder="Décrivez étape par étape comment préparer ce cocktail..."
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <TextField
                fullWidth
                label="Notes additionnelles (optionnel)"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={3}
                placeholder="Astuces, variantes, histoire du cocktail..."
              />
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '100%' } }}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Tags
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Ajouter un tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Ex: Rafraîchissant, Apéritif, Digestif..."
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
                {formData.tags?.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(1)}
            >
              Retour
            </Button>
            
            <Box>
              {onCancel && (
                <Button 
                  variant="outlined" 
                  onClick={onCancel}
                  disabled={isSubmitting || loading}
                  sx={{ mr: 1 }}
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
        </Paper>
      )}
    </Box>
  );
};

export default CocktailForm;