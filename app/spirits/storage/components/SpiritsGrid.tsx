// app/spirits/storage/components/SpiritsGrid.tsx

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, useTheme, 
  alpha, Tooltip, Button, CircularProgress,
  Alert
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import LiquorIcon from '@mui/icons-material/Liquor';
import { Spirit, SpiritStorageLocation } from '@/utils/types/spirit.types';
import SpiritCard from '../../components/SpiritCard';

interface SpiritsGridProps {
  storageLocation: SpiritStorageLocation;
  spirits: Spirit[];
}

const SpiritsGrid: React.FC<SpiritsGridProps> = ({ 
  storageLocation,
  spirits
}) => {
  const theme = useTheme();
  const router = useRouter();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // État pour le formatage de la grille
  const [gridCells, setGridCells] = useState<Array<Array<Spirit | null>>>([]);
  const [loading, setLoading] = useState(false);
  
  // Générer la grille basée sur les dimensions et les spiritueux
  useEffect(() => {
    if (storageLocation.layout === 'grid' && 
        storageLocation.rowCount && 
        storageLocation.columnCount) {
      // Initialiser une grille vide
      const newGrid: Array<Array<Spirit | null>> = [];
      for (let row = 0; row < storageLocation.rowCount; row++) {
        newGrid[row] = [];
        for (let col = 0; col < storageLocation.columnCount; col++) {
          newGrid[row][col] = null;
        }
      }
      
      // Placer les spiritueux dans la grille selon leur position
      spirits.forEach(spirit => {
        const position = spirit.storage.position;
        if (position && position.row !== null && position.column !== null) {
          // Vérifier que la position est valide dans la grille
          if (position.row < storageLocation.rowCount && 
              position.column < storageLocation.columnCount) {
            newGrid[position.row][position.column] = spirit;
          }
        }
      });
      
      setGridCells(newGrid);
    } else {
      // Si ce n'est pas une disposition en grille, juste initialiser un tableau vide
      setGridCells([]);
    }
  }, [storageLocation, spirits]);
  
  // Obtenir la couleur associée au type de spiritueux
  const getSpiritTypeColor = (type: string): string => {
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
  
  // Basculer entre les modes d'affichage en fonction de la disposition
  if (storageLocation.layout === 'grid' && gridCells.length > 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1">
            Disposition de la grille: {storageLocation.rowCount} × {storageLocation.columnCount}
          </Typography>
          
          <Button
            component={Link}
            href="/spirits/add"
            startIcon={<AddIcon />}
            size="small"
          >
            Ajouter un spiritueux
          </Button>
        </Box>
        
        {/* Grille des emplacements */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(${storageLocation.columnCount}, 1fr)`,
            gap: 2
          }}
        >
          {gridCells.map((row, rowIndex) => 
            row.map((spirit, colIndex) => (
              <Paper
                key={`${rowIndex}-${colIndex}`}
                elevation={0}
                sx={{
                  p: 2,
                  height: 140,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: spirit 
                    ? alpha(getSpiritTypeColor(spirit.type), isDarkMode ? 0.2 : 0.1)
                    : isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: spirit ? 'translateY(-4px)' : 'none',
                    boxShadow: spirit ? 2 : 0
                  }
                }}
                component={spirit ? Link : 'div'}
                href={spirit ? `/spirits/details/${spirit.id}` : '#'}
              >
                {spirit ? (
                  <>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 'medium',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {spirit.name}
                    </Typography>
                    
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ display: 'block', mb: 1 }}
                    >
                      {spirit.subType || getSpiritTypeColor(spirit.type)}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', mt: 'auto' }}>
                      <Box 
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: getSpiritTypeColor(spirit.type),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1
                        }}
                      >
                        <LiquorIcon sx={{ fontSize: 14, color: 'white' }} />
                      </Box>
                      <Typography variant="body2">
                        {spirit.abv}%
                      </Typography>
                    </Box>
                    
                    <Box 
                      sx={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: spirit.storage.fillLevel === 'full' ? 'success.main'
                          : spirit.storage.fillLevel === 'threeFourths' ? 'info.main'
                          : spirit.storage.fillLevel === 'half' ? 'warning.main'
                          : spirit.storage.fillLevel === 'oneFourth' ? 'error.main'
                          : 'text.disabled'
                      }}
                    />
                  </>
                ) : (
                  <Tooltip title="Ajouter un spiritueux à cet emplacement">
                    <Box
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => router.push('/spirits/add')}
                    >
                      <AddIcon color="disabled" />
                    </Box>
                  </Tooltip>
                )}
                
                {/* Position */}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8,
                    color: 'text.secondary',
                    fontSize: '0.7rem'
                  }}
                >
                  {rowIndex+1}.{colIndex+1}
                </Typography>
              </Paper>
            ))
          )}
        </Box>
      </Box>
    );
  }
  
  // Affichage alternatif pour les dispositions non-grille
  return (
    <Box>
      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : spirits.length === 0 ? (
        <Box textAlign="center" p={3}>
          <Typography variant="subtitle1" paragraph>
            Aucun spiritueux dans cet emplacement
          </Typography>
          <Button
            component={Link}
            href="/spirits/add"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Ajouter un spiritueux
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              component={Link}
              href="/spirits/add"
              startIcon={<AddIcon />}
              size="small"
            >
              Ajouter un spiritueux
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            {spirits.map(spirit => (
              <Grid component="div" key={spirit.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                <SpiritCard spirit={spirit} compact />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default SpiritsGrid;