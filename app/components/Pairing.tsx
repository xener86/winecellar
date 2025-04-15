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
} from '@mui/material';

import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';

import { FoodPairing, DBWine, ApiKeys } from '@/utils/types';

export interface PairingProps {
  wine: DBWine;
  food: string;
  mode: 'byFood' | 'byWine';
  compact?: boolean;
  apiConfig: {
    apiProvider: keyof ApiKeys; // ✅ "openai" | "mistral"
    apiKey: string;             // ✅ une seule clé, pas l'objet complet
  };
  userId?: string;
  onSave?: (pairing: FoodPairing) => void;
  onRemove?: (id: string) => void;
  onRate?: (id: string, rating: number) => void;
  saved?: boolean;
  userRating?: number;
}

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
  const handleSave = () => {
    if (!userId) return;
    if (saved && onRemove) {
      onRemove(`${wine.id}-${food}`);
    } else if (!saved && onSave) {
      const pairing: FoodPairing = {
        id: `${wine.id}-${food}`,
        wine_id: wine.id,
        wine,
        food,
        saved: true,
        user_id: userId,
      };
      onSave(pairing);
    }
  };

  const handleRate = (_: unknown, value: number | null) => {
    if (onRate && value !== null) {
      onRate(`${wine.id}-${food}`, value);
    }
  };

  return (
    <Card className="w-full" variant="outlined">
      <CardContent className="flex flex-col gap-2">
        <Box className="flex items-center justify-between">
          <Typography variant="h6" className="font-bold">
            {wine.name}
          </Typography>
          <Tooltip title={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
            <IconButton onClick={handleSave} size="small">
              {saved ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="body2" className="text-gray-600 italic">
          Accord avec : <span className="font-medium">{food}</span>
        </Typography>

        {!compact && (
          <Box className="flex items-center justify-between mt-2">
            <Typography variant="body2">Votre note :</Typography>
            <Rating
              name={`rating-${wine.id}-${food}`}
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
