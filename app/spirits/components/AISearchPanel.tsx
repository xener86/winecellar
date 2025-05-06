// app/spirits/components/AISearchPanel.tsx

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  Alert,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import { Spirit } from '@/utils/types/spirit.types';
import SpiritAIService from '@/services/SpiritAIService';

interface AISearchPanelProps {
  onSpiritFound: (spirit: Partial<Spirit>) => void;
  apiKey?: string;
  language?: 'fr' | 'en';
  provider?: 'openai' | 'mistral';
}

const AISearchPanel: React.FC<AISearchPanelProps> = ({
  onSpiritFound,
  apiKey = '',
  language = 'fr',
  provider = 'openai'
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<Partial<Spirit> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  // Obtenir la couleur associée au type de spiritueux
  const getSpiritTypeColor = (type?: string): string => {
    if (!type) return '#aaaaaa';
    
    const colorMap: Record<string, string> = {
      'whisky': '#cd7f32',
      'rum': '#8b4513',
      'gin': '#add8e6',
      'vodka': '#f5f5f5',
      'tequila': '#ffdb58',
      'brandy': '#964b00',
      'liqueur': '#ff69b4',
      'other': '#aaaaaa'
    };
    
    return colorMap[type] || '#aaaaaa';
  };

  // Traduire le type de spiritueux en français
  const getSpiritTypeLabel = (type?: string): string => {
    if (!type) return 'Autre';
    
    const typeMap: Record<string, string> = {
      'whisky': 'Whisky',
      'rum': 'Rhum',
      'gin': 'Gin',
      'vodka': 'Vodka',
      'tequila': 'Tequila',
      'brandy': 'Brandy',
      'liqueur': 'Liqueur',
      'other': 'Autre'
    };
    
    return typeMap[type] || 'Autre';
  };

  // Fonction pour effectuer la recherche
  const handleSearch = async () => {
    if (!searchTerm.trim() || !apiKey) return;
    
    setIsSearching(true);
    setError(null);
    setResult(null);
    
    try {
      const aiService = new SpiritAIService({
        apiKey,
        apiProvider: provider,
        language
      });
      
      const spiritInfo = await aiService.getSpiritInfo(searchTerm);
      
      if (!spiritInfo || !spiritInfo.name) {
        throw new Error("Aucune information n'a pu être trouvée pour ce spiritueux");
      }
      
      setResult(spiritInfo);
    } catch (error) {
      console.error('Erreur lors de la recherche IA:', error);
      setError(error instanceof Error ? error.message : "Une erreur est survenue lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Box>
      <Typography variant="body2" paragraph>
        Entrez le nom d&apos;un spiritueux pour obtenir automatiquement ses caractéristiques via l&apos;IA.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          label="Nom du spiritueux"
          placeholder="Ex: Glenfiddich 18 ans"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          disabled={isSearching || !apiKey}
        />
        
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={!searchTerm.trim() || isSearching || !apiKey}
          startIcon={isSearching ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
          sx={{ minWidth: 120 }}
        >
          Rechercher
        </Button>
      </Box>
      
      {!apiKey && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Clé API non configurée. Veuillez configurer votre clé API dans les paramètres.
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {result && (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            borderRadius: 2,
            borderColor: alpha(getSpiritTypeColor(result.type), 0.5),
            bgcolor: alpha(getSpiritTypeColor(result.type), isDarkMode ? 0.1 : 0.05),
            transition: 'all 0.3s ease'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocalBarIcon 
                sx={{ 
                  color: getSpiritTypeColor(result.type), 
                  fontSize: 32, 
                  mr: 1.5 
                }}
              />
              <Typography variant="h6">
                {result.name} {result.age && `${result.age} ans`}
              </Typography>
            </Box>
            
            <Chip 
              label={getSpiritTypeLabel(result.type)} 
              sx={{ 
                bgcolor: alpha(getSpiritTypeColor(result.type), isDarkMode ? 0.3 : 0.2),
                fontWeight: 'medium'
              }}
            />
          </Box>
          
          <Grid container spacing={2}>
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <Typography variant="body2" color="text.secondary">
                Type
              </Typography>
              <Typography variant="body1">
                {getSpiritTypeLabel(result.type)} {result.subType && `(${result.subType})`}
              </Typography>
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <Typography variant="body2" color="text.secondary">
                Degré d&apos;alcool
              </Typography>
              <Typography variant="body1">
                {result.abv ? `${result.abv}%` : 'Non spécifié'}
              </Typography>
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <Typography variant="body2" color="text.secondary">
                Origine
              </Typography>
              <Typography variant="body1">
                {result.origin?.country && result.origin.country} 
                {result.origin?.region && `, ${result.origin.region}`}
              </Typography>
            </Grid>
            
            <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
              <Typography variant="body2" color="text.secondary">
                Distillerie
              </Typography>
              <Typography variant="body1">
                {result.origin?.distillery || 'Non spécifié'}
              </Typography>
            </Grid>
            
            {result.vintage && (
              <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
                <Typography variant="body2" color="text.secondary">
                  Millésime
                </Typography>
                <Typography variant="body1">
                  {result.vintage}
                </Typography>
              </Grid>
            )}
            
            {result.details?.color && (
              <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
                <Typography variant="body2" color="text.secondary">
                  Couleur
                </Typography>
                <Typography variant="body1">
                  {result.details.color}
                </Typography>
              </Grid>
            )}
          </Grid>
          
          {result.details?.tastingNotes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Notes de dégustation
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {result.details.tastingNotes.map((note, index) => (
                  <Chip 
                    key={index} 
                    label={note} 
                    size="small" 
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {result.details?.ingredients && result.details.ingredients.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Ingrédients principaux
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {result.details.ingredients.map((ingredient, index) => (
                  <Chip 
                    key={index} 
                    label={ingredient} 
                    size="small" 
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {previewExpanded && result.details?.finish && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Finition / Vieillissement
              </Typography>
              <Typography variant="body1">
                {result.details.finish}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Button 
              size="small" 
              color="inherit" 
              onClick={() => setPreviewExpanded(!previewExpanded)}
            >
              {previewExpanded ? 'Voir moins' : 'Voir plus'}
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              size="small" 
              onClick={() => {
                setResult(null);
                setSearchTerm('');
              }}
              color="inherit"
            >
              Annuler
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => onSpiritFound(result)}
            >
              Utiliser ces informations
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AISearchPanel;