// app/storage/components/dialogs/SearchDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, CircularProgress,
  List, ListItem, ListItemText, Chip, IconButton,
  InputAdornment, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { alpha, useTheme } from '@mui/material/styles';
import { supabase } from '@/utils/supabase';
import { Wine, Bottle } from '@/utils/types';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  onWineSelect?: (wine: Wine) => void;
  onBottleSelect?: (bottle: Bottle) => void;
  mode?: 'wine' | 'bottle';
}

const SearchDialog: React.FC<SearchDialogProps> = ({
  open,
  onClose,
  onWineSelect,
  onBottleSelect,
  mode = 'wine'
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Wine[]>([]);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  
  // Charger les résultats quand le dialogue s'ouvre
  useEffect(() => {
    if (open && searchTerm) {
      performSearch();
    }
  }, [open, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Fonction pour exécuter la recherche
  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([]);
      setBottles([]);
      return;
    }
    
    setLoading(true);
    
    try {
      if (mode === 'wine') {
        // Recherche de vins
        const { data, error } = await supabase
          .from('wine')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,domain.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%,appellation.ilike.%${searchTerm}%`)
          .order('name');
        
        if (error) throw error;
        setResults(data || []);
      } else {
        // Recherche de bouteilles (avec détails du vin)
        const { data, error } = await supabase
          .from('bottle')
          .select(`
            *,
            wine:wine_id (*)
          `)
          .eq('status', 'in_stock')
          .order('acquisition_date', { ascending: false });
        
        if (error) throw error;
        
        // Filtrer les bouteilles en fonction du terme de recherche
        const term = searchTerm.toLowerCase();
        const filteredBottles = (data || []).filter(bottle => {
          // S'assurer que wine est un objet valide et non un tableau
          if (!bottle.wine || typeof bottle.wine !== 'object' || Array.isArray(bottle.wine)) {
            return false;
          }
          
          // Type assertion pour aider TypeScript
          const wineObject = bottle.wine as Wine;
          
          return (
            (wineObject.name && wineObject.name.toLowerCase().includes(term)) ||
            (wineObject.domain && wineObject.domain.toLowerCase().includes(term)) ||
            (wineObject.region && wineObject.region.toLowerCase().includes(term)) ||
            (wineObject.appellation && wineObject.appellation.toLowerCase().includes(term)) ||
            (wineObject.vintage && wineObject.vintage.toString().includes(term))
          );
        });
        
        setBottles(filteredBottles);
      }
    } catch (error: unknown) {
      console.error('Erreur de recherche:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour obtenir la couleur de fond pour une bouteille de vin
  const getWineColorCode = (color: string | null | undefined): string => {
    switch (color) {
      case 'red': return 'rgba(139, 0, 0, 0.9)';
      case 'white': return 'rgba(245, 245, 220, 0.9)';
      case 'rose': return 'rgba(255, 182, 193, 0.9)';
      case 'sparkling': return 'rgba(176, 196, 222, 0.9)';
      case 'fortified': return 'rgba(139, 69, 19, 0.9)';
      default: return 'rgba(120, 120, 120, 0.7)';
    }
  };
  
  // Fonction pour obtenir la couleur du texte adaptée au fond
  const getTextColorForBackground = (color: string | null | undefined): string => {
    switch (color) {
      case 'red':
      case 'fortified':
        return 'white';
      default:
        return 'black';
    }
  };
  
  // Helper pour convertir le wine en type Wine de manière sûre
  const safeWine = (wine: unknown): Wine => {
    if (wine && typeof wine === 'object' && !Array.isArray(wine)) {
      return wine as Wine;
    }
    return {
      id: '',
      name: '',
      color: 'red', // Valeur par défaut valide (au lieu de chaîne vide)
      vintage: null,
      domain: null,
      region: null,
      appellation: null,
      alcohol_percentage: null
    };
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          bgcolor: isDarkMode ? '#1A1A1A' : 'white'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {mode === 'wine' ? 'Rechercher un vin' : 'Rechercher une bouteille'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder={mode === 'wine' ? "Nom, domaine, région..." : "Rechercher dans le stock..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <IconButton onClick={performSearch} edge="end">
                      <SearchIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </Box>
        
        {mode === 'wine' ? (
          // Affichage des résultats pour les vins
          results.length > 0 ? (
            <List>
              {results.map((wine) => (
                <React.Fragment key={wine.id}>
                  <ListItem 
                    onClick={() => {
                      if (onWineSelect) onWineSelect(wine);
                      onClose();
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        bgcolor: getWineColorCode(wine.color),
                        mr: 2
                      }}
                    />
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {wine.name} {wine.vintage && `(${wine.vintage})`}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {wine.domain && `${wine.domain}`}
                          {wine.region && wine.domain && ' • '}
                          {wine.region && `${wine.region}`}
                        </Typography>
                      }
                    />
                    <Chip 
                      label={
                        wine.color === 'red' ? 'Rouge' :
                        wine.color === 'white' ? 'Blanc' :
                        wine.color === 'rose' ? 'Rosé' :
                        wine.color === 'sparkling' ? 'Effervescent' :
                        wine.color === 'fortified' ? 'Fortifié' : 'Autre'
                      }
                      size="small"
                      sx={{ 
                        bgcolor: getWineColorCode(wine.color),
                        color: getTextColorForBackground(wine.color),
                      }}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            searchTerm && !loading && (
              <Box textAlign="center" py={3}>
                <Typography color="text.secondary">
                  Aucun résultat trouvé pour &quot;{searchTerm}&quot;
                </Typography>
              </Box>
            )
          )
        ) : (
          // Affichage des résultats pour les bouteilles
          bottles.length > 0 ? (
            <List>
              {bottles.map((bottle) => {
                const wineObj = safeWine(bottle.wine);
                
                return (
                  <React.Fragment key={bottle.id}>
                    <ListItem 
                      onClick={() => {
                        if (onBottleSelect) onBottleSelect(bottle);
                        onClose();
                      }}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          bgcolor: getWineColorCode(wineObj.color),
                          mr: 2
                        }}
                      />
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1">
                            {wineObj.name} {wineObj.vintage && `(${wineObj.vintage})`}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {wineObj.domain}
                            {wineObj.domain && wineObj.region && ' • '}
                            {wineObj.region}
                          </Typography>
                        }
                      />
                      <Box>
                        {bottle.position_id ? (
                          <Chip 
                            label="Placé" 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Chip 
                            label="En stock" 
                            size="small" 
                            color="info"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                );
              })}
            </List>
          ) : (
            searchTerm && !loading && (
              <Box textAlign="center" py={3}>
                <Typography color="text.secondary">
                  Aucune bouteille trouvée pour &quot;{searchTerm}&quot;
                </Typography>
              </Box>
            )
          )
        )}
        
        {!searchTerm && !loading && (
          <Box 
            sx={{ 
              py: 6, 
              textAlign: 'center',
              color: 'text.secondary',
              bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.1) : alpha(theme.palette.grey[100], 0.7),
              borderRadius: 2
            }}
          >
            <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography>
              Commencez à taper pour rechercher {mode === 'wine' ? 'un vin' : 'une bouteille'}
            </Typography>
          </Box>
        )}
        
        {loading && results.length === 0 && bottles.length === 0 && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SearchDialog;