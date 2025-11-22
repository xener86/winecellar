'use client';

import React from 'react';
import {
  Grid,
  Typography,
  Paper,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Rating,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';

import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import WineBarIcon from '@mui/icons-material/WineBar';
import InfoIcon from '@mui/icons-material/Info';

import { CellarMatch, FoodPairing, BottleMatch, DBWine } from '@/utils/types';

interface EnhancedBottleMatch extends Omit<BottleMatch, 'wine'> {
  wine?: DBWine;
}

interface CellarMatchesProps {
  matches: CellarMatch[];
  foodQuery: string;
  userId?: string;
  onSave?: (pairing: FoodPairing) => void;
  onRemove?: (id: string) => void;
  onRate?: (id: string, rating: number) => void;
  savedPairings: FoodPairing[];
}

const getMatchQualityColor = (quality: string): "success" | "info" | "warning" | "default" => {
  switch (quality) {
    case 'perfect': return 'success';
    case 'good': return 'info';
    case 'alternative': return 'warning';
    default: return 'default';
  }
};

const getMatchQualityLabel = (quality: string): string => {
  switch (quality) {
    case 'perfect': return 'Parfait';
    case 'good': return 'Bon';
    case 'alternative': return 'Alternative';
    default: return quality || 'Non spécifié';
  }
};

const getPairingTypeColor = (type: string | undefined): "primary" | "secondary" | "error" | "default" => {
  if (!type) return 'default';
  switch (type) {
    case 'classic': return 'primary';
    case 'audacious': return 'secondary';
    case 'heart': return 'error';
    default: return 'default';
  }
};

const getPairingTypeLabel = (type: string | undefined): string => {
  if (!type) return 'Non catégorisé';
  switch (type) {
    case 'classic': return 'Classique';
    case 'audacious': return 'Audacieux';
    case 'heart': return 'Coup de cœur';
    default: return type || 'Non catégorisé';
  }
};

export default function CellarMatches({
  matches,
  foodQuery,
  userId,
  onSave,
  onRemove,
  onRate,
  savedPairings = []
}: CellarMatchesProps) {
  if (!matches || matches.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography variant="h6" gutterBottom>
          Aucune correspondance trouvée dans votre cave
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
          Aucun vin correspondant aux recommandations n&apos;a été trouvé dans votre cave.
          <br /><br />
          Cela peut être dû à plusieurs raisons :
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: 500, mx: 'auto', textAlign: 'left' }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Vous n&apos;avez pas encore ajouté de bouteilles dans votre cave
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Les vins dans votre cave ne correspondent pas aux recommandations
          </Typography>
          <Typography variant="body2">
            • Un problème technique est survenu lors de la recherche
          </Typography>
        </Box>
      </Box>
    );
  }

  const isPairingSaved = (wineId?: string): boolean => {
    if (!wineId) return false;
    return savedPairings.some((p: FoodPairing) => p.wine_id === wineId && p.food === foodQuery);
  };

  const getPairingRating = (wineId?: string): number => {
    if (!wineId) return 0;
    const pairing = savedPairings.find((p: FoodPairing) => p.wine_id === wineId && p.food === foodQuery);
    return pairing?.rating || 0;
  };

  const handleSave = (
    bottleMatch: EnhancedBottleMatch,
    pairingType: 'classic' | 'audacious' | 'heart' = 'classic'
  ) => {
    if (!userId || !onSave || !onRemove || !bottleMatch?.wine_id || !bottleMatch.wine) return;

    const wineId = bottleMatch.wine_id;
    const pairingId = `${wineId}-${foodQuery}`;
    const saved = isPairingSaved(wineId);

    if (saved) {
      onRemove?.(pairingId);
    } else {
      const pairing: FoodPairing = {
        id: pairingId,
        wine_id: wineId,
        wine: bottleMatch.wine,
        food: foodQuery,
        pairing_type: pairingType,
        saved: true,
        rating: 0
      };
      onSave(pairing);
    }
  };

  const handleRate = (wineId: string) => (_: React.SyntheticEvent, value: number | null) => {
    if (!onRate || value === null || !wineId) return;
    onRate(`${wineId}-${foodQuery}`, value);
  };

  const hasAnyMatches = matches.some(match => Array.isArray(match.matches) && match.matches.length > 0);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Correspondances dans votre cave pour : <strong>{foodQuery}</strong>
        </Typography>

        {!hasAnyMatches ? (
          <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
            Aucune correspondance exacte n&apos;a été trouvée dans votre cave. Consultez les recommandations ci-dessous pour d&apos;éventuelles alternatives.
          </Alert>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Voici les vins de votre cave qui correspondent aux recommandations.
            Pour chaque recommandation, nous indiquons les bouteilles disponibles par ordre de pertinence.
          </Typography>
        )}
      </Box>

      {matches.map((match, index) => {
        if (!match || !match.recommendation) {
          return (
            <Box key={`invalid-${index}`} sx={{ mb: 4 }}>
              <Paper sx={{ p: 3 }}>
                <Typography color="error">
                  Données de recommandation incorrectes ou incomplètes.
                </Typography>
              </Paper>
            </Box>
          );
        }

        return (
          <Box key={index} sx={{ mb: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  {match.recommendation.wine_type || 'Type de vin non précisé'}
                </Typography>
                <Chip
                  label={getPairingTypeLabel(match.recommendation.pairing_type)}
                  color={getPairingTypeColor(match.recommendation.pairing_type)}
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Caractéristiques recherchées :</strong> {match.recommendation.characteristics || 'Non précisées'}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Bouteilles correspondantes dans votre cave :
              </Typography>

              {match.matches.length > 0 ? (
                <List>
                  {match.matches.map((bottleMatch: EnhancedBottleMatch, idx) => {
                    if (!bottleMatch?.wine_id) {
                      return (
                        <ListItem key={`invalid-match-${idx}`} sx={{ bgcolor: 'background.paper', mb: 1 }}>
                          <Typography color="error">Données de bouteille incorrectes ou incomplètes.</Typography>
                        </ListItem>
                      );
                    }

                    return (
                      <ListItem
                        key={idx}
                        sx={{
                          background: 'linear-gradient(135deg, rgba(112,26,67,0.04), rgba(30,41,59,0.03))',
                          mb: 1.5,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 2,
                          px: { xs: 2, md: 3 },
                          py: 2,
                        }}
                      >
                        <Grid container spacing={2}>
                          <Grid component="div" item xs={12} sm={8}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                              <WineBarIcon sx={{ color: 'primary.main' }} />
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {bottleMatch.wine?.name || 'Vin sans nom'}
                                  </Typography>
                                }
                                secondary={
                                  <>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1 }}>
                                      <Chip
                                        label={getMatchQualityLabel(bottleMatch.match_quality)}
                                        color={getMatchQualityColor(bottleMatch.match_quality)}
                                        size="small"
                                      />
                                      {bottleMatch.position?.label && (
                                        <Chip
                                          label={bottleMatch.position.label}
                                          variant="outlined"
                                          size="small"
                                        />
                                      )}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {bottleMatch.explanation || "Pas d'explication disponible"}
                                    </Typography>
                                  </>
                                }
                              />
                            </Box>
                          </Grid>
                          <Grid component="div" item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
                              {bottleMatch.position?.storage && (
                                <Typography variant="body2" color="text.secondary">
                                  Zone : {bottleMatch.position.storage}
                                </Typography>
                              )}
                              <Tooltip
                                title={
                                  isPairingSaved(bottleMatch.wine_id)
                                    ? 'Retirer des favoris'
                                    : 'Ajouter aux favoris'
                                }
                              >
                                <IconButton
                                  onClick={() =>
                                    handleSave(bottleMatch, match.recommendation.pairing_type as 'classic' | 'audacious' | 'heart')
                                  }
                                  size="small"
                                  sx={{ border: 1, borderColor: 'divider' }}
                                >
                                  {isPairingSaved(bottleMatch.wine_id) ? (
                                    <BookmarkIcon color="primary" />
                                  ) : (
                                    <BookmarkBorderIcon />
                                  )}
                                </IconButton>
                              </Tooltip>

                              {bottleMatch.wine_id && (
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    Votre note :
                                  </Typography>
                                  <Rating
                                    name={`rating-${bottleMatch.wine_id}-${foodQuery}`}
                                    value={getPairingRating(bottleMatch.wine_id)}
                                    precision={0.5}
                                    onChange={handleRate(bottleMatch.wine_id)}
                                    size="small"
                                  />
                                </Box>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <InfoIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Aucune bouteille correspondante trouvée dans votre cave pour cette recommandation.
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                    Vous pourriez envisager d&apos;ajouter ce type de vin à votre collection.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        );
      })}
    </Box>
  );
}