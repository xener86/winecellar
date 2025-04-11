// components/PairingCard.tsx

import React from 'react';
import {
  Card, CardContent, CardActions, Typography, Box, Chip, Divider,
  Button, Rating, Tooltip
} from '@mui/material';
import WineBarIcon from '@mui/icons-material/WineBar';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import VerifiedIcon from '@mui/icons-material/Verified';
import StorefrontIcon from '@mui/icons-material/Storefront';
import Link from 'next/link';

// Types
type Wine = {
  id: string;
  name: string;
  color: string;
  vintage: number | null;
  domain: string | null;
  region: string | null;
  appellation: string | null;
  alcohol_percentage: number | null;
};

type FoodPairing = {
  id?: string;
  food: string;
  wine_id?: string;
  wine_type?: string;
  pairing_strength: number;
  pairing_type: 'classic' | 'audacious' | 'merchant';
  explanation: string;
  user_id?: string;
  saved?: boolean;
  wine?: Wine;
  user_rating?: number;
  caviste_recommendation?: boolean;
};

interface PairingCardProps {
  pairing: FoodPairing;
  showWine?: boolean; // Si on affiche le vin ou le plat en premier
  onShowExplanation: (pairing: FoodPairing) => void;
  onSavePairing?: (pairing: FoodPairing) => void;
  onRemovePairing?: (pairingId: string) => void;
}

const getWineColor = (color: string) => {
  switch (color) {
    case 'red': return '#8B0000'; // Bordeaux
    case 'white': return '#F5F5DC'; // Beige
    case 'rose': return '#F8BBD0';
    case 'sparkling': return '#81D4FA';
    case 'fortified': return '#8D6E63';
    default: return '#607D8B';
  }
};

const getWineTypeColor = (type: string) => {
  const wineTypes = [
    { value: 'red_light', label: 'Rouge léger', color: '#C62828' },
    { value: 'red_medium', label: 'Rouge moyenne structure', color: '#8B0000' },
    { value: 'red_full', label: 'Rouge puissant', color: '#7B1FA2' },
    { value: 'white_dry', label: 'Blanc sec', color: '#FFF59D' },
    { value: 'white_sweet', label: 'Blanc moelleux', color: '#FFD54F' },
    { value: 'rose', label: 'Rosé', color: '#F8BBD0' },
    { value: 'sparkling', label: 'Effervescent', color: '#81D4FA' },
    { value: 'fortified', label: 'Vin fortifié', color: '#8D6E63' },
  ];
  const wineType = wineTypes.find(w => w.value === type);
  return wineType ? wineType.color : '#607D8B';
};

export default function PairingCard({ 
  pairing, 
  showWine = true, 
  onShowExplanation, 
  onSavePairing, 
  onRemovePairing 
}: PairingCardProps) {
  // Obtenir le bon badge selon le type d'accord
  const renderPairingBadge = () => {
    switch(pairing.pairing_type) {
      case 'audacious':
        return (
          <Chip
            icon={<EmojiObjectsIcon />}
            label="Audacieux"
            size="small"
            color="secondary"
            sx={{ position: 'absolute', top: 12, right: 12 }}
          />
        );
      case 'merchant':
        return (
          <Chip
            icon={<StorefrontIcon />}
            label="Caviste"
            size="small"
            color="info"
            sx={{ position: 'absolute', top: 12, right: 12 }}
          />
        );
      case 'classic':
      default:
        return (
          <Chip
            icon={<VerifiedIcon />}
            label="Classique"
            size="small"
            color="success"
            sx={{ position: 'absolute', top: 12, right: 12 }}
          />
        );
    }
  };

  return (
    <Card 
      elevation={0} 
      sx={{ 
        height: '100%', 
        border: '1px solid',
        borderColor: pairing.pairing_type === 'merchant' ? 'info.main' : 'divider',
        borderRadius: 2,
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        },
        ...(pairing.pairing_type === 'merchant' && {
          background: 'linear-gradient(45deg, rgba(139,0,0,0.05) 0%, rgba(139,0,0,0) 100%)',
        })
      }}
    >
      {renderPairingBadge()}
      
      <CardContent>
        {showWine ? (
          // Afficher le vin d'abord (pour recherche par plat)
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Box 
              sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: pairing.wine ? 
                  getWineColor(pairing.wine.color) : 
                  pairing.wine_type ? 
                    getWineTypeColor(pairing.wine_type) : 
                    '#8B0000', // Bordeaux par défaut
                color: (pairing.wine?.color === 'red' || pairing.wine?.color === 'fortified') ? 'white' : 'rgba(0, 0, 0, 0.7)',
                mr: 2,
                flexShrink: 0
              }}
            >
              <WineBarIcon />
            </Box>
            
            <Box sx={{ flexGrow: 1 }}>
              {pairing.wine ? (
                <>
                  <Typography variant="h6" component="div" gutterBottom sx={{ lineHeight: 1.2 }}>
                    {pairing.wine.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pairing.wine.vintage && `${pairing.wine.vintage} • `}
                    {pairing.wine.color === 'red' ? 'Rouge' : 
                     pairing.wine.color === 'white' ? 'Blanc' : 
                     pairing.wine.color === 'rose' ? 'Rosé' : 
                     pairing.wine.color === 'sparkling' ? 'Effervescent' : 
                     'Fortifié'}
                    {pairing.wine.region && ` • ${pairing.wine.region}`}
                  </Typography>
                </>
              ) : (
                <Typography variant="h6" component="div" gutterBottom sx={{ lineHeight: 1.2 }}>
                  {pairing.pairing_type === 'merchant' ? "Vin recommandé" : 
                  `Vin ${pairing.wine_type === 'red_light' ? 'rouge léger' : 
                     pairing.wine_type === 'red_medium' ? 'rouge moyenne structure' :
                     pairing.wine_type === 'red_full' ? 'rouge puissant' :
                     pairing.wine_type === 'white_dry' ? 'blanc sec' :
                     pairing.wine_type === 'white_sweet' ? 'blanc moelleux' :
                     pairing.wine_type === 'rose' ? 'rosé' :
                     pairing.wine_type === 'sparkling' ? 'effervescent' :
                     pairing.wine_type === 'fortified' ? 'fortifié' : 'suggéré'}`}
                </Typography>
              )}
            </Box>
            
            <Box>
              <Tooltip title={`Force de l'accord: ${pairing.pairing_strength}/5`}>
                <Box>
                  <Rating 
                    value={pairing.pairing_strength} 
                    readOnly 
                    precision={0.5}
                    max={5}
                    size="small"
                  />
                </Box>
              </Tooltip>
            </Box>
          </Box>
        ) : (
          // Afficher le plat d'abord (pour recherche par vin)
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Box 
              sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: '#8B0000', // Bordeaux comme couleur principale
                color: 'white',
                mr: 2,
                flexShrink: 0
              }}
            >
              <RestaurantIcon />
            </Box>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="div" gutterBottom sx={{ lineHeight: 1.2 }}>
                {pairing.food}
              </Typography>
            </Box>
            
            <Box>
              <Tooltip title={`Force de l'accord: ${pairing.pairing_strength}/5`}>
                <Box>
                  <Rating 
                    value={pairing.pairing_strength} 
                    readOnly 
                    precision={0.5}
                    max={5}
                    size="small"
                  />
                </Box>
              </Tooltip>
            </Box>
          </Box>
        )}
        
        <Divider sx={{ my: 1.5 }} />
        
        <Box sx={{ mb: 2 }}>
          {showWine ? (
            <Typography variant="subtitle1" gutterBottom>
              <RestaurantIcon sx={{ fontSize: 18, mr: 0.5, mb: -0.3 }} />
              {pairing.food}
            </Typography>
          ) : (
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <WineBarIcon sx={{ fontSize: 18, mr: 0.5, mb: -0.3 }} />
              {pairing.wine ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {pairing.wine.name}
                  {pairing.wine.vintage && <Box component="span" sx={{ ml: 0.5 }}>({pairing.wine.vintage})</Box>}
                </Box>
              ) : (
                "Vin suggéré"
              )}
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ 
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}>
            {pairing.explanation}
          </Typography>
          
          <Button 
            size="small" 
            onClick={() => onShowExplanation(pairing)}
            variant="text"
            sx={{ mt: 1 }}
            endIcon={<MenuBookIcon />}
          >
            Voir l&apos;explication complète
          </Button>
        </Box>
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
        {pairing.wine && (
          <Button 
            size="small" 
            component={Link} 
            href={`/wines/${pairing.wine_id}`}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Voir le vin
          </Button>
        )}
        
        {pairing.pairing_type === 'merchant' && !pairing.wine_id && (
          <Button
            size="small"
            color="info"
            variant="outlined"
            startIcon={<StorefrontIcon />}
            component={Link}
            href="/find-wine" // Lien vers une page de recherche de vins ou carte des cavistes
            sx={{ borderRadius: 2 }}
          >
            Trouver ce vin
          </Button>
        )}
        
        {pairing.saved ? (
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<BookmarkIcon />}
            onClick={() => pairing.id && onRemovePairing && onRemovePairing(pairing.id)}
            sx={{ borderRadius: 2, ml: 'auto' }}
          >
            Retirer des favoris
          </Button>
        ) : (
          <Button
            size="small"
            color="primary"
            variant="outlined"
            startIcon={<BookmarkBorderIcon />}
            onClick={() => onSavePairing && onSavePairing(pairing)}
            sx={{ borderRadius: 2, ml: 'auto' }}
          >
            Sauvegarder
          </Button>
        )}
      </CardActions>
    </Card>
);
}