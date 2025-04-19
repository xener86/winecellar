'use client';

import React from 'react';
import Grid from '@mui/material/Grid';
import {
  Card,
  Typography,
  Divider,
  Box,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Bottle, StorageLocation, Position } from '@/utils/types';

interface Props {
  selectedLocation: StorageLocation | null;
  bottles: Bottle[];
  positions: Position[];
}

const StatisticsPanel: React.FC<Props> = ({ bottles }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const totalBottles = bottles.length;
  const emptyPositions = bottles.filter((b) => !b.position_id).length;
  const occupationRate = totalBottles
    ? Math.round(((totalBottles - emptyPositions) / totalBottles) * 100)
    : 0;

  const colorCounts = bottles.reduce<Record<string, number>>((acc, b) => {
    const color = b.wine?.color;
    if (color) acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});

  return (
    <Box mt={3}>
      <Grid container spacing={3}>
        {/* Cartes statistiques */}
        <Grid component="div" sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              textAlign: 'center',
              bgcolor: alpha(theme.palette.warning.main, 0.08),
            }}
          >
            <Typography variant="h3" color="warning.main" fontWeight="bold">
              {emptyPositions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Emplacements vides
            </Typography>
          </Card>
        </Grid>

        <Grid component="div" sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              textAlign: 'center',
              bgcolor: alpha(theme.palette.success.main, 0.08),
            }}
          >
            <Typography variant="h3" color="success.main" fontWeight="bold">
              {occupationRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Taux d’occupation
            </Typography>
          </Card>
        </Grid>

        {/* Répartition par couleur */}
        <Grid component="div" sx={{ width: '100%' }}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              mt: 2,
              background: isDarkMode
                ? 'linear-gradient(145deg, rgba(30,30,30,0.6), rgba(50,50,50,0.4))'
                : 'linear-gradient(145deg, rgba(255,255,255,0.7), rgba(245,245,245,0.5))'
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="500" color="primary">
              Répartition par type de vin
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-around',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              {['red', 'white', 'rose', 'sparkling', 'fortified'].map((color) => {
                const count = colorCounts[color] || 0;
                const percentage = totalBottles
                  ? Math.round((count / totalBottles) * 100)
                  : 0;

                const bgMap: Record<string, string> = {
                  red: '#8B0000',
                  white: '#F5F5DC',
                  rose: '#FFB6C1',
                  sparkling: '#B0C4DE',
                  fortified: '#8B4513'
                };

                const textColor = ['red', 'fortified'].includes(color) ? 'white' : 'black';

                return (
                  <Box key={color} sx={{ textAlign: 'center', minWidth: 100 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: bgMap[color],
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mx: 'auto',
                        color: textColor,
                        fontWeight: 'bold',
                        fontSize: '1.5rem',
                        boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                        border: '4px solid white',
                        position: 'relative'
                      }}
                    >
                      {count}
                      {percentage > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -5,
                            right: -5,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: 'white',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            border: `2px solid ${bgMap[color]}`
                          }}
                        >
                          {percentage}%
                        </Box>
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontWeight: 500 }}>
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatisticsPanel;
