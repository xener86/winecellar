'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Rating,
  Tooltip,
  Chip,
} from '@mui/material';

import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';

import { FoodPairing, DBWine } from '@/utils/types';

export interface PairingProps {
  wine: DBWine | null | undefined;
  food: string;
  mode: 'byFood' | 'byWine';
  compact?: boolean;
  apiConfig: {
    apiProvider: string; // "openai" | "mistral"
    apiKey: string;
  };
  userId?: string;
  onSave?: (pairing: FoodPairing) => void;
  onRemove?: (id: string) => void;
  onRate?: (id: string, rating: number) => void;
  saved?: boolean;
  userRating?: number;
}

// Fonction auxiliaire pour obtenir le style de couleur basé sur le type de vin
const getWineColorStyle = (wine: DBWine | null | undefined) => {
  if (!wine || !wine.color) {
    // Retourner une couleur par défaut si wine ou wine.color n'existe pas
    return { bgcolor: 'grey.300', color: 'text.primary' };
  }

  const color = wine.color.toLowerCase();
  
  switch (color) {
    case 'red':
    case 'rouge':
      return { bgcolor: 'error.main', color: 'white' };
    case 'white':
    case 'blanc':
      return { bgcolor: 'warning.light', color: 'text.primary' };
    case 'rosé':
    case 'rose':
      return { bgcolor: 'pink.400', color: 'white' };
    case 'sparkling':
    case 'effervescent':
      return { bgcolor: 'info.light', color: 'text.primary' };
    default:
      return { bgcolor: 'grey.300', color: 'text.primary' };
  }
};

const Pairing: React.FC<PairingProps> = ({
  wine,
  food,
  compact = false,
  userId,
  onSave,
  onRemove,
  onRate,
  saved = false,
  userRating = 0,
}) => {
  // Ajouter des valeurs par défaut sécurisées
  const wineName = wine?.name || 'Vin recommandé';
  const wineId = wine?.id || `unknown-${Math.random().toString(36).substring(2, 9)}`;
  const colorStyle = getWineColorStyle(wine);

  const handleSave = () => {
    if (!userId) return;
    if (saved && onRemove) {
      onRemove(`${wineId}-${food}`);
    } else if (!saved && onSave && wine) {
      const pairing: FoodPairing = {
        id: `${wineId}-${food}`,
        wine_id: wineId,
        wine,
        food,
        saved: true,
        rating: 0,
        pairing_type: 'classic'
      };
      onSave(pairing);
    }
  };

  const handleRate = (_: unknown, value: number | null) => {
    if (onRate && value !== null) {
      onRate(`${wineId}-${food}`, value);
    }
  };

  return (
    <Card className="w-full" variant="outlined">
      <CardContent className="flex flex-col gap-2">
        <Box className="flex items-center justify-between">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" className="font-bold">
              {wineName}
            </Typography>
            {wine?.color && (
              <Chip 
                label={wine.color} 
                size="small" 
                sx={{ 
                  ml: 1,
                  bgcolor: colorStyle.bgcolor,
                  color: colorStyle.color
                }} 
              />
            )}
          </Box>
          <Tooltip title={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
            <IconButton onClick={handleSave} size="small">
              {saved ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="body2" className="text-gray-600 italic">
          Accord avec : <span className="font-medium">{food}</span>
        </Typography>

        {wine?.vintage && (
          <Typography variant="body2" color="text.secondary">
            {wine.domain || 'Domaine non spécifié'} ({wine.vintage || 'N/A'})
          </Typography>
        )}

        {!compact && (
          <Box className="flex items-center justify-between mt-2">
            <Typography variant="body2">Votre note :</Typography>
            <Rating
              name={`rating-${wineId}-${food}`}
              value={userRating || 0}
              precision={0.5}
              onChange={handleRate}
              icon={<StarIcon fontSize="small" />}
              emptyIcon={<StarBorderIcon fontSize="small" />}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default Pairing;