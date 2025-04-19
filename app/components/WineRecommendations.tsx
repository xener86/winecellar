'use client';

import React from 'react';
import { 
  Grid, 
  Typography, 
  Paper, 
  Box, 
  Button,
  Chip,
  Divider 
} from '@mui/material';
import { WineRecommendation } from '@/utils/types';

interface WineRecommendationsProps {
  recommendations: WineRecommendation[];
  foodQuery: string;
  onCheckCellar: () => void;
  loading?: boolean;
}

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
    default: return type;
  }
};

export default function WineRecommendations({ 
  recommendations, 
  foodQuery,
  onCheckCellar,
  loading = false 
}: WineRecommendationsProps) {
  if (!recommendations || recommendations.length === 0) {
    return <Typography>Aucune suggestion trouvée.</Typography>;
  }

  // Grouper les recommandations par type
  const groupedRecommendations = recommendations.reduce((groups, rec) => {
    const pairingType = rec.pairing_type || 'default';
    const group = groups[pairingType] || [];
    group.push(rec);
    groups[pairingType] = group;
    return groups;
  }, {} as Record<string, WineRecommendation[]>);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Suggestions de vins pour : <strong>{foodQuery}</strong>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Voici des recommandations générales d&apos;accords mets-vins. Ces suggestions 
          sont basées sur des principes œnologiques et gastronomiques.
        </Typography>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={onCheckCellar}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          Vérifier les correspondances dans ma cave
        </Button>
      </Box>

      {Object.entries(groupedRecommendations).map(([type, recs]) => (
        <Box key={type} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Accords {getPairingTypeLabel(type).toLowerCase()}
          </Typography>
          <Grid container spacing={2}>
            {recs.map((rec, index) => (
              <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }} key={index}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {rec.wine_type}
                    </Typography>
                    <Chip 
                      label={getPairingTypeLabel(rec.pairing_type)} 
                      color={getPairingTypeColor(rec.pairing_type)}
                      size="small"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Cépage :</strong> {rec.grape || 'Non spécifié'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Caractéristiques :</strong> {rec.characteristics || 'Non spécifiées'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body1">
                    {rec.explanation || 'Pas d\'explication disponible.'}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
} 