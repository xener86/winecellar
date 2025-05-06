// app/spirits/components/RecipeBuilder.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AddIcon from '@mui/icons-material/Add';
import { 
  Cocktail, 
  CocktailCategory, 
  GlassType, 
  PreparationMethod,
  CocktailIngredient
} from '@/utils/types/cocktail.types';
import { Spirit } from '@/utils/types/spirit.types';
import IngredientSelector from './IngredientSelector';

interface RecipeBuilderProps {
  availableSpirits: Spirit[];
  onSave: (recipe: Cocktail) => Promise<void>;
  apiKey?: string; // Pour les suggestions IA
  initialData?: Partial<Cocktail>;
  loading?: boolean;
}

const RecipeBuilder: React.FC<RecipeBuilderProps> = ({
  availableSpirits,
  onSave,
  apiKey,
  initialData,
  loading = false
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // État local pour la recette
  const [recipe, setRecipe] = useState<Partial<Cocktail>>(initialData || {
    name: '',
    ingredients: [],
    preparation: '',
    isCustom: true,
    category: 'modern',
    glassType: 'highball',
    preparationMethod: 'built',
    difficulty: 'medium',
    garnish: null,
    notes: null,
    tags: [],
    rating: null
  });
  
  // États pour le formulaire
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Définir le type de spiritueux principal sélectionné
  const [selectedSpiritType, setSelectedSpiritType] = useState<string>('');
  
  // Mettre à jour le formulaire si initialData change
  useEffect(() => {
    if (initialData) {
      setRecipe(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);
  
  // Gérer les changements de champs simples
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setRecipe(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gérer les changements de selects
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    setRecipe(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gérer les changements d'ingrédients
  const handleIngredientsChange = (ingredients: CocktailIngredient[]) => {
    setRecipe(prev => ({
      ...prev,
      ingredients
    }));
  };
  
  // Valider si la recette est complète
  const isValidRecipe = (): boolean => {
    return !!(
      recipe.name &&
      recipe.ingredients &&
      recipe.ingredients.length > 0 &&
      recipe.preparation
    );
  };
  
  // Générer un ID unique pour la recette
  const generateRecipeId = (): string => {
    return `cocktail_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };
  
  // Sauvegarder la recette
  const handleSave = async () => {
    if (!isValidRecipe()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setError(null);
    
    try {
      const now = new Date().toISOString();
      
      const cocktailData = {
        id: recipe.id || generateRecipeId(),
        name: recipe.name || '',
        category: recipe.category || 'modern',
        glassType: recipe.glassType || 'highball',
        ingredients: recipe.ingredients || [],
        garnish: recipe.garnish,
        preparation: recipe.preparation || '',
        preparationMethod: recipe.preparationMethod || 'built',
        image: recipe.image,
        isCustom: true,
        isFavorite: recipe.isFavorite || false,
        notes: recipe.notes,
        tags: recipe.tags || [],
        rating: recipe.rating,
        difficulty: recipe.difficulty || 'medium',
        userId: '', // Sera défini côté serveur
        createdAt: recipe.createdAt || now,
        updatedAt: now
      } as Cocktail;
      
      await onSave(cocktailData);
      setSuccess('Recette sauvegardée avec succès');
      
      // Réinitialiser le formulaire après 2 secondes
      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch (error) {
      setError('Erreur lors de la sauvegarde de la recette');
      console.error('Erreur sauvegarde recette:', error);
    }
  };
  
  // Suggérer une recette basée sur les spiritueux disponibles
  const suggestRecipe = async () => {
    if (!apiKey) {
      setError('Clé API non configurée. Veuillez la configurer dans les paramètres.');
      return;
    }
    
    setSuggestLoading(true);
    setError(null);
    
    try {
      // Préparation des données pour l'IA
      const availableSpiritTypes = availableSpirits.map(s => s.type);
      const uniqueTypes = [...new Set(availableSpiritTypes)];
      
      const mainSpirit = selectedSpiritType || (uniqueTypes.length > 0 ? uniqueTypes[0] : null);
      
      if (!mainSpirit) {
        setError('Veuillez sélectionner un type de spiritueux ou ajouter des spiritueux à votre collection');
        setSuggestLoading(false);
        return;
      }
      
      // Requête à l'API pour générer une recette
      const response = await fetch('/api/cocktails/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mainSpirit,
          availableSpirits: availableSpirits.map(s => ({
            id: s.id,
            name: s.name,
            type: s.type
          })),
          apiKey,
          existing: recipe // Envoyer la recette existante pour l'améliorer
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Mettre à jour la recette avec les suggestions
      setRecipe(prev => ({
        ...prev,
        ...data,
        isCustom: true // S'assurer que c'est marqué comme personnalisé
      }));
      
    } catch (error) {
      console.error('Erreur suggestion recette:', error);
      setError('Erreur lors de la génération de la suggestion');
    } finally {
      setSuggestLoading(false);
    }
  };
  
  // Générer une recette aléatoire basée sur les spiritueux disponibles
  const generateRandomRecipe = () => {
    setIsGenerating(true);
    
    try {
      // Liste de noms créatifs pour les cocktails
      const cocktailNames = [
        "Sunset Breeze", "Midnight Whisper", "Azure Dream", "Golden Hour", 
        "Crimson Tide", "Emerald Mist", "Diamond Fizz", "Velvet Night",
        "Ruby Fusion", "Sapphire Solstice", "Amber Glow", "Violet Haze"
      ];
      
      // Catégories de cocktails
      const categories: CocktailCategory[] = [
        'classic', 'modern', 'tiki', 'sour', 'highball', 'fizz', 
        'martini', 'other'
      ];
      
      // Types de verres
      const glassTypes: GlassType[] = [
        'highball', 'lowball', 'martini', 'coupe', 'flute', 'hurricane', 
        'margarita', 'collins'
      ];
      
      // Méthodes de préparation
      const methods: PreparationMethod[] = [
        'shaken', 'stirred', 'built', 'blended', 'layered', 'muddled'
      ];
      
      // Garnitures
      const garnishes = [
        "Zeste d'orange", "Tranche de citron", "Tranche de lime", "Cerise", 
        "Olive", "Brin de menthe", "Bâton de cannelle", "Tranche d'ananas"
      ];
      
      // Définir un spiritueux principal aléatoire
      let mainSpirit: Spirit | null = null;
      if (availableSpirits.length > 0) {
        mainSpirit = availableSpirits[Math.floor(Math.random() * availableSpirits.length)];
      }
      
      // Créer des ingrédients aléatoires
      const randomIngredients: CocktailIngredient[] = [];
      
      // Ajouter le spiritueux principal s'il existe
      if (mainSpirit) {
        randomIngredients.push({
          id: `ing_${Date.now()}_1`,
          name: mainSpirit.name,
          amount: Math.ceil(Math.random() * 6) * 0.5, // 0.5 à 3 oz
          unit: 'oz',
          isOptional: false,
          spiritId: mainSpirit.id
        });
      }
      
      // Ajouter quelques ingrédients génériques
      const genericIngredients = [
        "Jus de citron", "Jus de lime", "Jus d'orange", "Jus d'ananas",
        "Sirop simple", "Sirop d'orgeat", "Sirop d'érable", "Liqueur de café",
        "Vermouth sec", "Vermouth doux", "Angostura", "Eau gazeuse",
        "Tonic", "Ginger beer", "Soda", "Crème de coco"
      ];
      
      // Ajouter 2-4 ingrédients génériques
      const numGeneric = Math.floor(Math.random() * 3) + 2; // 2-4
      for (let i = 0; i < numGeneric; i++) {
        const ing = genericIngredients[Math.floor(Math.random() * genericIngredients.length)];
        randomIngredients.push({
          id: `ing_${Date.now()}_${i+2}`,
          name: ing,
          amount: Math.ceil(Math.random() * 4) * 0.25, // 0.25 à 1 oz
          unit: ['oz', 'ml', 'dash'][Math.floor(Math.random() * 3)], // oz, ml ou dash
          isOptional: Math.random() > 0.8 // 20% de chance d'être optionnel
        });
      }
      
      // Générer une instruction de préparation aléatoire
      const randomPreparation = `
        1. ${randomIngredients.length > 0 ? `Ajouter ${randomIngredients[0].name} dans ${glassTypes[Math.floor(Math.random() * glassTypes.length)]}.` : 'Préparer le verre.'}
        2. ${['Ajouter de la glace.', 'Remplir de glaçons.', 'Ajouter quelques glaçons.'][Math.floor(Math.random() * 3)]}
        3. ${randomIngredients.length > 1 ? `Ajouter ${randomIngredients.slice(1).map(i => i.name).join(', ')}.` : 'Ajouter les autres ingrédients.'}
        4. ${['Mélanger doucement.', 'Agiter vigoureusement.', 'Remuer avec une cuillère.'][Math.floor(Math.random() * 3)]}
        5. ${['Servir frais.', 'Servir immédiatement.', 'Servir et déguster.'][Math.floor(Math.random() * 3)]}
      `.trim();
      
      // Créer la recette aléatoire
      const randomRecipe: Partial<Cocktail> = {
        name: cocktailNames[Math.floor(Math.random() * cocktailNames.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        glassType: glassTypes[Math.floor(Math.random() * glassTypes.length)],
        preparationMethod: methods[Math.floor(Math.random() * methods.length)],
        ingredients: randomIngredients,
        garnish: Math.random() > 0.3 ? garnishes[Math.floor(Math.random() * garnishes.length)] : null, // 70% de chance d'avoir une garniture
        preparation: randomPreparation,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
        isCustom: true,
        isFavorite: false,
        tags: [],
        notes: null,
        rating: null
      };
      
      // Mettre à jour la recette
      setRecipe(randomRecipe);
      
    } catch (error) {
      console.error('Erreur génération recette aléatoire:', error);
      setError('Erreur lors de la génération de la recette aléatoire');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Box>
      {/* En-tête avec options */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant="h6">
          Créateur de Recette
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ShuffleIcon />}
            onClick={generateRandomRecipe}
            disabled={isGenerating || availableSpirits.length === 0}
            sx={{ borderRadius: 2 }}
          >
            Recette aléatoire
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            color="secondary"
            startIcon={suggestLoading ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
            onClick={suggestRecipe}
            disabled={suggestLoading || !apiKey}
            sx={{ borderRadius: 2 }}
          >
            Suggestion IA
          </Button>
        </Box>
      </Box>
      
      {/* Notifications */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      {/* Champs principaux */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.2) : alpha(theme.palette.background.paper, 0.8)
        }}
      >
        <Grid container spacing={2}>
          <Grid component="div" sx={{ width: { xs: '100%', sm: '60%' } }}>
            <TextField
              fullWidth
              label="Nom du cocktail"
              name="name"
              value={recipe.name || ''}
              onChange={handleChange}
              placeholder="Ex: Mojito, Margarita, etc."
              margin="normal"
            />
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '100%', sm: '40%' } }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Catégorie</InputLabel>
              <Select
                name="category"
                value={recipe.category || 'modern'}
                onChange={handleSelectChange}
                label="Catégorie"
              >
                <MenuItem value="classic">Classique</MenuItem>
                <MenuItem value="modern">Moderne</MenuItem>
                <MenuItem value="tiki">Tiki</MenuItem>
                <MenuItem value="sour">Sour</MenuItem>
                <MenuItem value="highball">Highball</MenuItem>
                <MenuItem value="fizz">Fizz</MenuItem>
                <MenuItem value="martini">Martini</MenuItem>
                <MenuItem value="other">Autre</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '50%', sm: '30%' } }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type de verre</InputLabel>
              <Select
                name="glassType"
                value={recipe.glassType || 'highball'}
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
                <MenuItem value="collins">Collins</MenuItem>
                <MenuItem value="other">Autre</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '50%', sm: '30%' } }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Méthode</InputLabel>
              <Select
                name="preparationMethod"
                value={recipe.preparationMethod || 'built'}
                onChange={handleSelectChange}
                label="Méthode"
              >
                <MenuItem value="shaken">Shaker</MenuItem>
                <MenuItem value="stirred">Mélanger</MenuItem>
                <MenuItem value="built">Construire</MenuItem>
                <MenuItem value="blended">Mixer</MenuItem>
                <MenuItem value="layered">Superposer</MenuItem>
                <MenuItem value="muddled">Piler</MenuItem>
                <MenuItem value="other">Autre</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '100%', sm: '40%' } }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Difficulté</InputLabel>
              <Select
                name="difficulty"
                value={recipe.difficulty || 'medium'}
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
              value={recipe.garnish || ''}
              onChange={handleChange}
              placeholder="Ex: Zeste d'orange, Tranche de citron, etc."
              margin="normal"
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Sélecteur d'ingrédients */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.2) : alpha(theme.palette.background.paper, 0.8)
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          Ingrédients
        </Typography>
        
        {apiKey && (
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Spiritueux principal</InputLabel>
              <Select
                value={selectedSpiritType}
                onChange={(e) => setSelectedSpiritType(e.target.value as string)}
                label="Spiritueux principal"
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="whisky">Whisky</MenuItem>
                <MenuItem value="rum">Rhum</MenuItem>
                <MenuItem value="gin">Gin</MenuItem>
                <MenuItem value="vodka">Vodka</MenuItem>
                <MenuItem value="tequila">Tequila</MenuItem>
                <MenuItem value="brandy">Brandy</MenuItem>
                <MenuItem value="liqueur">Liqueur</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
        
        <IngredientSelector
          selectedIngredients={recipe.ingredients || []}
          availableSpirits={availableSpirits}
          onChange={handleIngredientsChange}
        />
      </Paper>
      
      {/* Instructions de préparation */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.2) : alpha(theme.palette.background.paper, 0.8)
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          Préparation
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={5}
          label="Instructions de préparation"
          name="preparation"
          value={recipe.preparation || ''}
          onChange={handleChange}
          placeholder="Décrivez étape par étape comment préparer ce cocktail..."
          margin="normal"
        />
        
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Notes additionnelles (optionnel)"
          name="notes"
          value={recipe.notes || ''}
          onChange={handleChange}
          placeholder="Astuces, variantes, histoire du cocktail..."
          margin="normal"
        />
      </Paper>
      
      {/* Bouton de sauvegarde */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={!isValidRecipe() || loading}
          sx={{ borderRadius: 2 }}
        >
          Enregistrer la recette
        </Button>
      </Box>
    </Box>
  );
};

export default RecipeBuilder;