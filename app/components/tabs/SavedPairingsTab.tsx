'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';

import LocalBarIcon from '@mui/icons-material/LocalBar';
import VerifiedIcon from '@mui/icons-material/Verified';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import StorefrontIcon from '@mui/icons-material/Storefront';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import WineBarIcon from '@mui/icons-material/WineBar';
import SearchIcon from '@mui/icons-material/Search';

import WinePairingSuggestions from '../WinePairingSuggestions';
import { PairingMode, FoodPairing, ApiKeys, DBWine } from '@/utils/types';

interface SavedPairingsTabProps {
  savedPairings: FoodPairing[];
  pairingFilter: PairingMode;
  setPairingFilter: (val: PairingMode) => void;
  handlePairingFilterChange: (_: React.MouseEvent<HTMLElement>, val: PairingMode | null) => void;
  handleSavePairing: (pairing: FoodPairing) => void;
  handleRemovePairing: (id: string) => void;
  handleRatePairing: (id: string, rating: number) => void;
  apiKeys: ApiKeys;
  apiProvider: 'openai' | 'mistral';
  userId?: string;
  onSearchTabRedirect?: (tabIndex: number) => void;
}

const SavedPairingsTab: React.FC<SavedPairingsTabProps> = ({
  savedPairings,
  pairingFilter,
  setPairingFilter,
  handlePairingFilterChange,
  handleSavePairing,
  handleRemovePairing,
  handleRatePairing,
  apiKeys,
  apiProvider,
  userId,
  onSearchTabRedirect
}) => {
  const filteredSavedPairings = pairingFilter === 'all'
    ? savedPairings
    : savedPairings.filter((p) => p.pairing_type === pairingFilter);

  return (
    <Box sx={{ width: '100%' }}>
      {savedPairings.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Aucun accord sauvegardé
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Commencez par rechercher des accords mets-vins et sauvegardez vos préférés.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              onClick={() => onSearchTabRedirect?.(0)}
              startIcon={<SearchIcon />}
              sx={{ borderRadius: 2, mr: 2 }}
            >
              Rechercher par plat
            </Button>
            <Button
              variant="outlined"
              onClick={() => onSearchTabRedirect?.(1)}
              startIcon={<WineBarIcon />}
              sx={{ borderRadius: 2 }}
            >
              Rechercher par vin
            </Button>
          </Box>
        </Paper>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <BookmarkIcon sx={{ mr: 1 }} />
            Vos accords mets-vins sauvegardés
          </Typography>

          <Box sx={{ mb: 6, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 16, p: 0.5 }}>
              <ToggleButtonGroup
                value={pairingFilter}
                exclusive
                onChange={handlePairingFilterChange}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: 0,
                    '&:first-of-type': {
                      borderTopLeftRadius: 16,
                      borderBottomLeftRadius: 16,
                    },
                    '&:last-of-type': {
                      borderTopRightRadius: 16,
                      borderBottomRightRadius: 16,
                    },
                  },
                }}
              >
                <ToggleButton value="all">
                  <Tooltip title="Tous les types">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <LocalBarIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Tous</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="classic">
                  <Tooltip title="Accords classiques">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <VerifiedIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Classiques</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="audacious">
                  <Tooltip title="Accords audacieux">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <EmojiObjectsIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Audacieux</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="merchant">
                  <Tooltip title="Suggestions caviste">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <StorefrontIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Premium</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {filteredSavedPairings.length > 0 ? (
            <Grid container spacing={3}>
              {filteredSavedPairings.map((pairing, idx) => (
                <Grid
                  key={pairing.id || idx}
                  component="div"
                  sx={{ width: { xs: '100%', md: '50%' } }}
                >
                  <WinePairingSuggestions
                    wine={pairing.wine as DBWine}
                    food={pairing.food}
                    pairings={[pairing]} 
                    mode={pairing.wine_id ? 'byFood' : 'byWine'}
                    compact={false}
                    apiConfig={{
                      apiProvider,
                      apiKey: apiKeys[apiProvider],
                    }}
                    userId={userId}
                    onSave={handleSavePairing}
                    onRemove={handleRemovePairing}
                    onRate={handleRatePairing}
                    saved
                    userRating={pairing.rating ?? undefined}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', my: 8 }}>
              <Typography variant="body1" color="text.secondary">
                Aucun accord sauvegardé de type « {pairingFilter} ».
              </Typography>
              <Button
                variant="text"
                onClick={() => setPairingFilter('all')}
                startIcon={<FilterAltOffIcon />}
                sx={{ mt: 2 }}
              >
                Afficher tous les favoris
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SavedPairingsTab;