import React, { useState, useEffect, useMemo, ReactNode, ReactElement } from 'react';
import {
  Box, Typography, Paper, Chip, Divider, Button,
  Card, CardContent, CardActions, Rating, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WineBarIcon from '@mui/icons-material/WineBar';
import BookmarkIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import VerifiedIcon from '@mui/icons-material/Verified';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

// Type d'IconButton personnalisé
type IconButtonProps = {
  children: ReactNode;
  [key: string]: unknown;
};

const IconButton = ({ children, ...props }: IconButtonProps) => (
  <Button
    sx={{ 
      minWidth: 'auto', 
      p: 1,
      borderRadius: '50%'
    }}
    {...props}
  >
    {children}
  </Button>
);

// Types
type PairingStrength = number;
type PairingExplanation = string;
type PairingType = string;

interface WineObject {
  id?: string;
  name: string;
  color?: string;
  vintage?: number;
  domain?: string;
  region?: string;
  appellation?: string;
  wine_type?: string;
  saved?: boolean;
  pairing_strength?: PairingStrength;
  pairing_type?: PairingType;
  type?: string;
  explanation?: PairingExplanation;
  [key: string]: unknown; // Pour permettre l'indexation dynamique
}

interface FoodObject {
  id?: string;
  food: string;
  pairing_strength?: PairingStrength;
  pairing_type?: PairingType;
  type?: string;
  explanation?: PairingExplanation;
  saved?: boolean;
  wine_type?: string;
  wine?: WineObject | string;
  [key: string]: unknown; // Pour permettre l'indexation dynamique
}

type PairingProps = {
  wine: WineObject | string | null;
  food: string | FoodObject;
  mode?: 'byWine' | 'byFood';
  compact?: boolean;
  apiConfig?: {
    apiProvider: string;
    apiKey: string;
  };
  userId?: string;
  onSave?: (pairing: Record<string, unknown>) => void;
  onRemove?: (pairingId: string) => void;
  debug?: boolean;
};

// Type pour le MUI Chip
type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

/**
 * Composant qui affiche un accord mets-vin avec des options interactives
 */
const WinePairingSuggestions: React.FC<PairingProps> = ({
  wine,
  food,
  mode = 'byWine',
  compact = false,
  // apiConfig est défini pour la signature mais non utilisé dans le composant
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  apiConfig,
  userId = null,
  onSave = null,
  onRemove = null,
  debug = false
}) => {
  // États locaux
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info'
  });

  // Fonctions de normalisation et helpers
  const getColorFromWineType = (wineType: string): string => {
    if (!wineType) return 'unknown';
    
    if (wineType.startsWith('red_')) return 'red';
    if (wineType.startsWith('white_')) return 'white';
    if (wineType === 'rose') return 'rose';
    if (wineType === 'sparkling') return 'sparkling';
    if (wineType === 'fortified') return 'fortified';
    
    return wineType; // Pour les cas où wine_type est déjà une couleur
  };

  const normalizeWine = useMemo(() => {
    return (wineParam: WineObject | string | null): WineObject => {
      if (!wineParam) {
        return { name: "Vin recommandé" };
      }
      
      // Si wine est une chaîne, la convertir en objet
      if (typeof wineParam === 'string') {
        return { 
          name: wineParam,
          // Si 'food' est un objet qui contient wine_type, on l'utilise pour déterminer la couleur
          color: food && typeof food === 'object' && food.wine_type 
            ? getColorFromWineType(food.wine_type as string) 
            : undefined
        };
      }
      
      // Si wine est un objet, le retourner tel quel avec éventuelles normalisations
      return {
        ...wineParam,
        // Si la couleur est manquante mais qu'on a un wine_type, déduire la couleur
        color: wineParam.color || (wineParam.wine_type ? getColorFromWineType(wineParam.wine_type) : undefined)
      };
    };
  }, [food]);

  const normalizeFood = useMemo(() => {
    return (foodParam: string | FoodObject | null): string => {
      if (!foodParam) return "Plat recommandé";
      
      if (typeof foodParam === 'string') return foodParam;
      
      // Si food est un objet, extraire la propriété 'food'
      if (typeof foodParam === 'object' && foodParam.food) {
        return foodParam.food;
      }
      
      return "Plat recommandé";
    };
  }, []);

  // Normaliser les données de l'accord et les mettre en cache avec useMemo
  const normalizedWine = useMemo(() => normalizeWine(wine), [wine, normalizeWine]);
  const normalizedFood = useMemo(() => normalizeFood(food), [food, normalizeFood]);
  
  // Force de l'accord et explication
  const getPairingStrength = useMemo(() => {
    return (): number => {
      if (typeof food === 'object' && food && food.pairing_strength) {
        return parseFloat(food.pairing_strength.toString());
      }
      if (typeof wine === 'object' && wine && wine.pairing_strength) {
        return parseFloat(wine.pairing_strength.toString());
      }
      if (typeof food === 'object' && food && food.explanation) {
        // L'explication est souvent dans food pour le mode byWine
        return 4;
      }
      if (typeof wine === 'object' && wine && wine.explanation) {
        // L'explication est souvent dans wine pour le mode byFood
        return 4;
      }
      return 4; // Valeur par défaut
    };
  }, [food, wine]);

  const getExplanation = useMemo(() => {
    return (): string => {
      // Log complet des données pour debugging
      if (debug) {
        console.log("DEBUG - wine:", wine);
        console.log("DEBUG - food:", food);
      }
      
      // Si mode byFood, l'explication est souvent dans wine ou ses propriétés
      if (mode === 'byFood' && typeof food === 'string') {
        if (typeof wine === 'object' && wine && wine.explanation) {
          return wine.explanation;
        }
      }
      
      // Vérifier directement dans l'objet food (cas standard)
      if (typeof food === 'object' && food && food.explanation) {
        return food.explanation;
      }
      
      // Vérifier directement dans l'objet wine (cas standard)
      if (typeof wine === 'object' && wine && wine.explanation) {
        return wine.explanation;
      }
      
      // Mode par vin - chercher l'explication dans l'objet food
      if (mode === 'byWine' && typeof food === 'object' && food) {
        return food.explanation || "Accord harmonieux entre ce vin et ce plat.";
      }
      
      // Mode par plat - l'explication peut être directement dans l'objet principal
      if (typeof food === 'object' && food && food.wine === wine) {
        return food.explanation || "Accord harmonieux entre ce plat et ce vin.";
      }
      
      // Dernière vérification: regarder si wine est un objet complexe
      if (typeof wine === 'object' && wine) {
        for (const key in wine) {
          const value = wine[key];
          if (typeof value === 'object' && value && 'explanation' in value) {
            return (value as { explanation: string }).explanation;
          }
        }
      }
      
      return "Accord harmonieux entre les saveurs du plat et les caractéristiques du vin.";
    };
  }, [debug, food, mode, wine]);

  const getPairingType = useMemo(() => {
    return (): string => {
      // Chercher d'abord dans les objets
      if (typeof food === 'object' && food && (food.pairing_type || food.type)) {
        return (food.pairing_type || food.type) as string;
      }
      if (typeof wine === 'object' && wine && (wine.pairing_type || wine.type)) {
        return (wine.pairing_type || wine.type) as string;
      }
      
      // Valeur par défaut
      return "classic";
    };
  }, [food, wine]);

  const isSaved = useMemo(() => {
    return (): boolean => {
      if (typeof food === 'object' && food && food.saved) return true;
      if (typeof wine === 'object' && wine && wine.saved) return true;
      return false;
    };
  }, [food, wine]);

  const getPairingId = useMemo(() => {
    return (): string | undefined => {
      if (typeof food === 'object' && food && food.id) return food.id;
      if (typeof wine === 'object' && wine && wine.id) return wine.id;
      return undefined;
    };
  }, [food, wine]);

  // Logs pour débogage
  useEffect(() => {
    if (debug) {
      console.log("WinePairingSuggestions - Props:", { wine, food, mode });
    }
  }, [wine, food, mode, debug]);

  // Construire l'objet d'accord complet avec useMemo pour éviter les re-renders
  const pairing = useMemo(() => ({
    id: getPairingId(),
    wine_id: normalizedWine.id,
    wine_type: normalizedWine.wine_type || normalizedWine.color || '',
    food: normalizedFood,
    pairing_strength: getPairingStrength(),
    pairing_type: getPairingType(),
    explanation: getExplanation(),
    saved: isSaved(),
    wine: normalizedWine
  }), [normalizedWine, normalizedFood, getPairingId, getPairingStrength, getPairingType, getExplanation, isSaved]);

  // Log pour débogage
  useEffect(() => {
    if (debug) {
      console.log("Pairing après normalisation:", pairing);
    }
  }, [pairing, debug]);

  // Gestionnaires d'événements
  const handleSave = () => {
    if (onSave) {
      onSave(pairing);
    } else {
      setNotification({
        open: true,
        message: 'Fonctionnalité de sauvegarde non configurée',
        severity: 'info'
      });
    }
  };

  const handleRemove = () => {
    if (onRemove && pairing.id) {
      onRemove(pairing.id);
    } else {
      setNotification({
        open: true,
        message: 'Fonctionnalité de suppression non configurée',
        severity: 'info'
      });
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Fonctions auxiliaires
  const getWineColor = (color?: string) => {
    if (!color) return '#607D8B'; // Gris par défaut
    
    switch (color) {
      case 'red': return '#8B0000';
      case 'white': return '#F5F5DC';
      case 'rose': return '#F8BBD0';
      case 'sparkling': return '#81D4FA';
      case 'fortified': return '#8D6E63';
      default: return '#607D8B';
    }
  };

  type PairingTypeInfo = {
    icon: ReactElement;
    color: ChipColor;
    label: string;
    description: string;
  };

  const getPairingTypeInfo = (type: string): PairingTypeInfo => {
    switch (type) {
      case 'classic':
        return { 
          icon: <VerifiedIcon />, 
          color: 'success', 
          label: 'Classique',
          description: 'Accord traditionnel éprouvé'
        };
      case 'audacious':
        return { 
          icon: <EmojiObjectsIcon />, 
          color: 'secondary', 
          label: 'Audacieux',
          description: 'Accord créatif et surprenant'
        };
      case 'merchant':
        return { 
          icon: <StorefrontIcon />, 
          color: 'info', 
          label: 'Premium',
          description: 'Suggestion exceptionnelle'
        };
      default:
        return { 
          icon: <InfoIcon />, 
          color: 'default', 
          label: 'Standard',
          description: 'Accord général'
        };
    }
  };

  // Information sur le type d'accord
  const pairingInfo = getPairingTypeInfo(pairing.pairing_type);

  // Rendu en version compacte
  if (compact) {
    return (
      <Card 
        elevation={0} 
        sx={{ 
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: 2,
          height: '100%'
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Chip 
              icon={pairingInfo.icon}
              label={pairingInfo.label}
              color={pairingInfo.color}
              size="small"
            />
            <Rating value={pairing.pairing_strength} readOnly precision={0.5} size="small" />
          </Box>
          
          <Typography variant="subtitle2" component="h3" gutterBottom>
            {mode === 'byWine' ? normalizedFood : normalizedWine.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '0.8rem',
            mb: 1
          }}>
            {pairing.explanation}
          </Typography>
        </CardContent>
        
        <CardActions>
          <Button size="small" onClick={handleOpenDialog}>Détails</Button>
          
          {userId && (
            pairing.saved ? (
              <Button 
                size="small" 
                color="error" 
                startIcon={<BookmarkAddedIcon />} 
                onClick={handleRemove}
                sx={{ ml: 'auto' }}
              >
                Retirer
              </Button>
            ) : (
              <Button 
                size="small"
                startIcon={<BookmarkIcon />}
                onClick={handleSave}
                sx={{ ml: 'auto' }}
              >
                Favoris
              </Button>
            )
          )}
        </CardActions>
      </Card>
    );
  }

  // Rendu en version complète
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        border: '1px solid', 
        borderColor: 'divider',
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* En-tête */}
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {pairingInfo.icon}
          <Typography variant="subtitle1" component="h3" sx={{ ml: 1 }}>
            {mode === 'byWine' ? normalizedFood : normalizedWine.name}
          </Typography>
        </Box>
        
        <Chip 
          label={pairingInfo.label} 
          color={pairingInfo.color}
          size="small"
          sx={{ fontWeight: 'medium' }}
        />
      </Box>
      
      {/* Contenu principal */}
      <Box sx={{ p: 2, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Force de l&apos;accord:
          </Typography>
          <Rating value={pairing.pairing_strength} readOnly precision={0.5} />
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Information sur le vin ou le plat complémentaire */}
        <Box 
          sx={{ 
            p: 1.5, 
            mb: 2, 
            bgcolor: 'background.default',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {mode === 'byWine' ? (
            <RestaurantIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
          ) : (
            <WineBarIcon 
              sx={{ 
                mr: 1.5, 
                color: getWineColor(normalizedWine.color)
              }} 
            />
          )}
          
          <Box>
            <Typography variant="caption" color="text.secondary" component="div">
              {mode === 'byWine' ? "Plat" : "Vin"}
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {mode === 'byWine' ? normalizedFood : normalizedWine.name}
            </Typography>
            {mode === 'byFood' && normalizedWine.vintage && (
              <Typography variant="caption" color="text.secondary">
                Millésime {normalizedWine.vintage}
              </Typography>
            )}
            {mode === 'byFood' && normalizedWine.region && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {normalizedWine.region}
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Explication de l'accord */}
        <Typography variant="body2" sx={{ 
          mb: 2,
          maxHeight: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical'
        }}>
          {pairing.explanation}
        </Typography>
        
        <Button 
          size="small" 
          onClick={handleOpenDialog}
          variant="outlined"
          fullWidth
          sx={{ borderRadius: 2 }}
        >
          Voir les détails
        </Button>
      </Box>
      
      {/* Actions en bas */}
      {userId && (
        <Box 
          sx={{ 
            p: 2, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          {pairing.saved ? (
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<BookmarkAddedIcon />} 
              onClick={handleRemove}
              sx={{ borderRadius: 2 }}
            >
              Retirer des favoris
            </Button>
          ) : (
            <Button 
              variant="outlined"
              startIcon={<BookmarkIcon />}
              onClick={handleSave}
              sx={{ borderRadius: 2 }}
            >
              Ajouter aux favoris
            </Button>
          )}
        </Box>
      )}
      
      {/* Dialogue de détails */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6">Détails de l&apos;accord</Typography>
              <Chip 
                icon={pairingInfo.icon}
                label={pairingInfo.label}
                color={pairingInfo.color}
                size="small"
                sx={{ ml: 2 }}
              />
            </Box>
            <IconButton onClick={handleCloseDialog} size="small" edge="end">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {pairingInfo.description}
            </Typography>
            
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mt: 2
              }}
            >
              {/* Information sur le vin */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  flex: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'flex-start'
                }}
              >
                <WineBarIcon 
                  sx={{ 
                    mr: 1.5, 
                    mt: 0.5,
                    color: getWineColor(normalizedWine.color),
                    fontSize: 32
                  }} 
                />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vin
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {normalizedWine.name}
                  </Typography>
                  {normalizedWine.vintage && (
                    <Chip
                      label={`Millésime ${normalizedWine.vintage}`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}
                  {normalizedWine.region && (
                    <Chip
                      label={normalizedWine.region}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                  )}
                  {normalizedWine.color && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Box 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: '50%', 
                          bgcolor: getWineColor(normalizedWine.color),
                          mr: 1 
                        }} 
                      />
                      <Typography variant="caption">
                        {normalizedWine.color.charAt(0).toUpperCase() + normalizedWine.color.slice(1)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
              
              {/* Information sur le plat */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  flex: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'flex-start'
                }}
              >
                <RestaurantIcon sx={{ mr: 1.5, mt: 0.5, fontSize: 32 }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Plat
                  </Typography>
                  <Typography variant="h6">
                    {normalizedFood}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
          
          {/* Force et explication de l'accord */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mb: 3
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Force de l&apos;accord
            </Typography>
            <Rating 
              value={pairing.pairing_strength} 
              readOnly 
              precision={0.5}
              size="large"
            />
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Explication
            </Typography>
            <Typography variant="body1" paragraph>
              {pairing.explanation}
            </Typography>
          </Paper>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          {userId && (
            pairing.saved ? (
              <Button
                variant="outlined"
                color="error"
                startIcon={<BookmarkAddedIcon />}
                onClick={() => {
                  handleRemove();
                  handleCloseDialog();
                }}
                sx={{ mr: 'auto', borderRadius: 2 }}
              >
                Retirer des favoris
              </Button>
            ) : (
              <Button
                variant="outlined"
                startIcon={<BookmarkIcon />}
                onClick={() => {
                  handleSave();
                  handleCloseDialog();
                }}
                sx={{ mr: 'auto', borderRadius: 2 }}
              >
                Ajouter aux favoris
              </Button>
            )
          )}
          <Button 
            variant="contained"
            onClick={handleCloseDialog}
            sx={{ borderRadius: 2 }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ borderRadius: 2 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default WinePairingSuggestions;