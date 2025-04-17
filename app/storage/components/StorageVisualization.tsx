// File: app/storage/components/StorageVisualization.tsx
import React from 'react';
import { 
  Typography, Box, Paper, Button, CircularProgress, 
  Tabs, Tab, Grid, Tooltip, Divider, Card,
  alpha, useTheme
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import WineBarIcon from '@mui/icons-material/WineBar';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import Link from 'next/link';
import { StorageLocation, Position, Bottle } from '../types';

// Températures de service optimales
const serviceTemperatures: Record<string, { range: string; icon: React.ReactNode; label: string; color: string }> = {
  red: { range: '16-18°C', icon: <ThermostatIcon />, label: 'Température ambiante', color: '#FF5252' },
  white: { range: '8-10°C', icon: <AcUnitIcon />, label: 'Très frais', color: '#81D4FA' },
  rose: { range: '10-12°C', icon: <AcUnitIcon />, label: 'Frais', color: '#F48FB1' },
  sparkling: { range: '6-8°C', icon: <AcUnitIcon />, label: 'Très frais', color: '#90CAF9' },
  fortified: { range: '14-16°C', icon: <ThermostatIcon />, label: 'Tempéré', color: '#A1887F' }
};

// Étiquettes personnalisées
const customLabels = [
  { id: 'favorite', label: 'Coup de cœur', icon: <FavoriteIcon color="error" />, color: '#FFD54F' },
  { id: 'special', label: 'Occasion spéciale', icon: <CelebrationIcon color="secondary" />, color: '#7986CB' },
  { id: 'keep', label: 'À garder', icon: <AccessTimeIcon color="primary" />, color: '#81C784' },
  { id: 'aperitif', label: 'Apéritif', icon: <LunchDiningIcon color="warning" />, color: '#FF8A65' }
];

interface StorageVisualizationProps {
  selectedLocation: StorageLocation | null;
  positions: Position[];
  bottles: Bottle[];
  loading: boolean;
  currentTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  displayMode: string;
  onPositionClick: (position: Position) => void;
  hoveredPositionInfo: { row: number; col: number } | null;
  onPositionHover: (info: { row: number; col: number } | null) => void;
}

const StorageVisualization: React.FC<StorageVisualizationProps> = ({
  selectedLocation,
  positions,
  bottles,
  loading,
  currentTab,
  onTabChange,
  displayMode,
  onPositionClick,
  hoveredPositionInfo,
  onPositionHover
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const cellSize = 54; // Slightly larger cells
  const bottleSize = 44; // Slightly larger bottles

  // Fonction pour obtenir une bouteille à une position
  const getBottleAtPosition = (positionId: string): Bottle | undefined => {
    return bottles.find(bottle => bottle.position_id === positionId);
  };

  // Obtenir style bouteille
  const getBottleStyle = (bottle: Bottle | null): React.CSSProperties => {
    // Style de base commun
    const baseStyle: React.CSSProperties = {
      borderRadius: '50%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      border: `1px solid ${theme.palette.divider}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      position: 'relative',
      width: bottleSize,
      height: bottleSize,
      overflow: 'hidden',
    };

    if (!bottle || !bottle.wine) return { 
      ...baseStyle, 
      backgroundColor: isDarkMode ? alpha(theme.palette.background.paper, 0.5) : theme.palette.action.hover 
    };

    const colorKey = bottle.wine.color as keyof typeof serviceTemperatures;
    // Définir les couleurs de fond et texte avec dégradés
    const colorStyleMap: Record<string, { bg: string, text: string }> = {
      red: { 
        bg: isDarkMode 
          ? 'linear-gradient(145deg, rgba(100,0,0,0.95), rgba(139,0,0,0.9))' 
          : 'linear-gradient(145deg, rgba(139,0,0,0.9), rgba(160,0,0,0.85))', 
        text: '#fff' 
      },
      white: { 
        bg: isDarkMode 
          ? 'linear-gradient(145deg, rgba(240,240,200,0.95), rgba(255,250,205,0.9))' 
          : 'linear-gradient(145deg, rgba(255,250,205,0.9), rgba(240,240,220,0.85))', 
        text: '#000' 
      },
      rose: { 
        bg: isDarkMode 
          ? 'linear-gradient(145deg, rgba(240,180,190,0.95), rgba(255,192,203,0.9))' 
          : 'linear-gradient(145deg, rgba(255,192,203,0.9), rgba(240,180,190,0.85))', 
        text: '#000' 
      },
      sparkling: { 
        bg: isDarkMode 
          ? 'linear-gradient(145deg, rgba(150,180,210,0.95), rgba(173,216,230,0.9))' 
          : 'linear-gradient(145deg, rgba(173,216,230,0.9), rgba(150,180,210,0.85))', 
        text: '#000' 
      },
      fortified: { 
        bg: isDarkMode 
          ? 'linear-gradient(145deg, rgba(130,60,20,0.95), rgba(160,82,45,0.9))' 
          : 'linear-gradient(145deg, rgba(160,82,45,0.9), rgba(130,60,20,0.85))', 
        text: '#fff' 
      }
    };

    const { bg, text } = colorStyleMap[colorKey] || { 
      bg: alpha(theme.palette.grey[500], 0.9), 
      text: '#fff' 
    };

    const finalStyle: React.CSSProperties = { 
      ...baseStyle, 
      background: bg, 
      color: text,
      boxShadow: '0 3px 6px rgba(0,0,0,0.16)'
    };

    // Appliquer styles spécifiques au mode d'affichage
    if (displayMode === 'labels' && bottle.label) {
      const labelInfo = customLabels.find(l => l.id === bottle.label);
      finalStyle.boxShadow = `0 0 0 3px ${labelInfo?.color || theme.palette.primary.main}, 0 4px 6px rgba(0,0,0,0.2)`;
      finalStyle.border = `1px solid ${theme.palette.divider}`;
    } else if (displayMode === 'temperature') {
      const tempInfo = serviceTemperatures[colorKey];
      finalStyle.border = `2px solid ${tempInfo?.color || theme.palette.divider}`;
      finalStyle.boxShadow = `0 0 8px ${alpha(tempInfo?.color || theme.palette.divider, 0.5)}`;
    }
    
    return finalStyle;
  };

  // Render la grille de positions
  const renderPositionsGrid = () => {
    if (!selectedLocation) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <Typography variant="subtitle1" color="text.secondary">
            Sélectionnez un emplacement pour voir son contenu.
          </Typography>
        </Box>
      );
    }
    
    // Gérer le cas où les dimensions ne sont pas définies
    if (!selectedLocation.row_count || !selectedLocation.column_count) {
      return (
        <Box 
          display="flex" 
          flexDirection="column" 
          justifyContent="center" 
          alignItems="center" 
          minHeight={300} 
          textAlign="center"
          p={4}
          sx={{
            background: isDarkMode 
              ? 'linear-gradient(145deg, rgba(30,30,30,0.6), rgba(50,50,50,0.4))' 
              : 'linear-gradient(145deg, rgba(250,250,250,0.9), rgba(240,240,240,0.7))',
            borderRadius: 4,
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)'
          }}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Cet emplacement ({selectedLocation.name}) n&apos;a pas de dimensions définies.
          </Typography>
          <Button 
            variant="contained" 
            component={Link} 
            href={`/storage/edit?id=${selectedLocation.id}`} 
            startIcon={<EditIcon />}
            sx={{ 
              borderRadius: 2, 
              mt: 2,
              background: isDarkMode 
                ? 'linear-gradient(45deg, #6a1b1b, #8b0000)' 
                : 'linear-gradient(45deg, #8b0000, #C62828)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              '&:hover': {
                background: isDarkMode 
                  ? 'linear-gradient(45deg, #8b0000, #a31515)' 
                  : 'linear-gradient(45deg, #a31515, #c62828)',
                boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
              }
            }}
          >
            Modifier et définir les dimensions
          </Button>
        </Box>
      );
    }

    const rowCount = Number(selectedLocation.row_count);
    const columnCount = Number(selectedLocation.column_count);
    const containerMaxWidth = Math.min(columnCount * (cellSize + 4), 1200); // +4 pour spacing

    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 250px)',
          backgroundColor: isDarkMode 
            ? alpha(theme.palette.background.paper, 0.5) 
            : alpha(theme.palette.grey[50], 0.7),
          backdropFilter: 'blur(10px)',
          boxShadow: isDarkMode 
            ? 'inset 0 0 30px rgba(0,0,0,0.3)' 
            : 'inset 0 0 30px rgba(0,0,0,0.05)'
        }}
      >
        {/* Légende du mode d'affichage */}
        {displayMode === 'temperature' && (
          <Box 
            mb={3} 
            p={2} 
            bgcolor={isDarkMode ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.8)'} 
            borderRadius={2} 
            boxShadow="0 2px 8px rgba(0,0,0,0.08)"
            border={`1px solid ${isDarkMode ? alpha(theme.palette.divider, 0.1) : theme.palette.divider}`}
          >
            <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary">
              Température de service recommandée:
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {Object.entries(serviceTemperatures).map(([key, value]) => (
                <Grid component="div" key={key}>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      bgcolor: value.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                     {React.cloneElement(value.icon as React.ReactElement, { 
  style: { fontSize: '16px' } 
} as React.HTMLAttributes<HTMLElement>)}
                    </Box>
                    <Typography variant="body2">
                      <Box component="span" fontWeight="medium">{value.label}</Box> ({value.range})
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {displayMode === 'labels' && (
          <Box 
            mb={3} 
            p={2} 
            bgcolor={isDarkMode ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.8)'} 
            borderRadius={2} 
            boxShadow="0 2px 8px rgba(0,0,0,0.08)"
            border={`1px solid ${isDarkMode ? alpha(theme.palette.divider, 0.1) : theme.palette.divider}`}
          >
            <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary">
              Étiquettes personnalisées:
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {customLabels.map(label => (
                <Grid component="div" key={label.id}>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      bgcolor: label.color,
                      mr: 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {React.cloneElement(label.icon, { sx: { fontSize: 16 } })}
                    </Box>
                    <Typography variant="body2">{label.label}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Information sur la position survolée */}
        {hoveredPositionInfo && (
          <Box 
            position="absolute"
            top={16}
            right={16}
            p={2}
            bgcolor={isDarkMode 
              ? alpha(theme.palette.background.paper, 0.9)
              : alpha(theme.palette.background.paper, 0.9)
            }
            borderRadius={2}
            boxShadow="0 4px 12px rgba(0,0,0,0.15)"
            zIndex={100}
            sx={{ 
              backdropFilter: 'blur(8px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold" color="primary">
              Position: Rangée {hoveredPositionInfo.row} / Colonne {hoveredPositionInfo.col}
            </Typography>
          </Box>
        )}

        <Box 
          sx={{ 
            maxWidth: containerMaxWidth, 
            margin: '0 auto',
            p: 2,
            borderRadius: 2,
            bgcolor: isDarkMode 
              ? alpha(theme.palette.background.paper, 0.2) 
              : alpha(theme.palette.background.paper, 0.5),
          }}
        >
          {/* Numéros de colonnes */}
          <Box display="flex" justifyContent="center" mb={1} ml={4}>
            {Array.from({ length: columnCount }, (_, index) => (
              <Box key={index} sx={{ width: cellSize, textAlign: 'center' }}>
                <Typography 
                  variant="caption" 
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    backgroundColor: isDarkMode 
                      ? alpha(theme.palette.background.paper, 0.3) 
                      : alpha(theme.palette.background.paper, 0.6),
                    borderRadius: '8px',
                    px: 1,
                    py: 0.5,
                    display: 'inline-block'
                  }}
                >
                  {index + 1}
                </Typography>
              </Box>
            ))}
          </Box>
          
          {/* Grille des positions */}
          <Box display="flex">
            {/* Numéros de lignes */}
            <Box display="flex" flexDirection="column" justifyContent="center" mr={1}>
              {Array.from({ length: rowCount }, (_, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    height: cellSize, 
                    display: 'flex', 
                    alignItems: 'center'
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      backgroundColor: isDarkMode 
                        ? alpha(theme.palette.background.paper, 0.3) 
                        : alpha(theme.palette.background.paper, 0.6),
                      borderRadius: '8px',
                      px: 1,
                      py: 0.5,
                      display: 'inline-block',
                      width: 24,
                      textAlign: 'center'
                    }}
                  >
                    {index + 1}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            {/* Grille des bouteilles */}
            <Grid container spacing={0.5}>
              {Array.from({ length: rowCount }, (_, rowIndex) => (
                <Grid component="div" key={rowIndex} sx={{ width: { xs: '100%' } }}>
                  <Box display="flex" justifyContent="flex-start">
                    {Array.from({ length: columnCount }, (_, colIndex) => {
                      const position = positions.find(
                        p => p.row_position === rowIndex + 1 && p.column_position === colIndex + 1
                      );
                      const bottle = position ? getBottleAtPosition(position.id) : null;
                      
                      return (
                        <Box 
                          key={colIndex}
                          onClick={() => position && onPositionClick(position)}
                          onMouseEnter={() => onPositionHover({ row: rowIndex + 1, col: colIndex + 1 })}
                          onMouseLeave={() => onPositionHover(null)}
                          sx={{
                            m: 0.3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            position: 'relative'
                          }}
                        >
                          {/* Support pour la bouteille */}
                          <Box 
                            sx={{
                              width: cellSize,
                              height: cellSize,
                              borderRadius: '50%',
                              border: `1px solid ${theme.palette.grey[400]}`,
                              background: isDarkMode 
                                ? 'linear-gradient(145deg, rgba(25,25,25,0.6), rgba(40,40,40,0.4))' 
                                : 'linear-gradient(145deg, rgba(245,245,245,0.7), rgba(255,255,255,0.8))',
                              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1)',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2), 0 0 0 3px rgba(25, 118, 210, 0.3)',
                                transform: 'translateY(-3px)'
                              }
                            }}
                          >
                            {/* La bouteille elle-même */}
                            {bottle ? (
                              <Box
                                sx={{
                                  ...getBottleStyle(bottle),
                                  width: bottleSize,
                                  height: bottleSize,
                                }}
                              >
                                {bottle.label && displayMode !== 'labels' && (
                                  <Box 
                                    sx={{ 
                                      position: 'absolute', 
                                      top: -8, 
                                      right: -8, 
                                      zIndex: 2
                                    }}
                                  >
                                    {(() => {
                                      const labelInfo = customLabels.find(l => l.id === bottle.label);
                                      return labelInfo ? (
                                        <Tooltip title={labelInfo.label} arrow>
                                          <Box 
                                            sx={{ 
                                              width: 18, 
                                              height: 18, 
                                              borderRadius: '50%', 
                                              bgcolor: labelInfo.color,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}
                                          >
                                            {React.cloneElement(labelInfo.icon, { sx: { fontSize: 11 } })}
                                          </Box>
                                        </Tooltip>
                                      ) : null;
                                    })()}
                                  </Box>
                                )}
                                
                                {displayMode === 'temperature' && (
                                  <Box 
                                    sx={{ 
                                      position: 'absolute', 
                                      top: -8, 
                                      left: -8,
                                      zIndex: 2 
                                    }}
                                  >
                                    <Tooltip 
                                      title={
                                        bottle.wine && 
                                        serviceTemperatures[bottle.wine.color as keyof typeof serviceTemperatures]?.range || ''
                                      }
                                      arrow
                                    >
                                      <Box sx={{ 
                                        width: 18, 
                                        height: 18, 
                                        borderRadius: '50%', 
                                        bgcolor: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        fontSize: '10px'
                                      }}>
                                        {bottle.wine && 
                                          serviceTemperatures[bottle.wine.color as keyof typeof serviceTemperatures]?.icon}
                                      </Box>
                                    </Tooltip>
                                  </Box>
                                )}
                                
                                <Typography 
                                  variant="caption" 
                                  align="center" 
                                  sx={{ 
                                    fontSize: '0.75rem', 
                                    fontWeight: 'bold',
                                    lineHeight: 1,
                                    px: 0.5,
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    textShadow: bottle.wine?.color === 'red' || bottle.wine?.color === 'fortified' 
                                      ? '0px 1px 2px rgba(0,0,0,0.3)' 
                                      : 'none'
                                  }}
                                >
                                  {bottle.wine?.vintage || ''}
                                </Typography>
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  width: bottleSize,
                                  height: bottleSize,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  backgroundColor: theme.palette.mode === 'dark' 
                                    ? alpha(theme.palette.background.paper, 0.3)
                                    : alpha(theme.palette.background.paper, 0.5),
                                  color: theme.palette.text.secondary,
                                  border: `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    backgroundColor: theme.palette.mode === 'dark' 
                                      ? alpha(theme.palette.action.hover, 0.3)
                                      : alpha(theme.palette.action.hover, 0.5),
                                    transform: 'scale(1.05)'
                                  }
                                }}
                              >
                                <Typography 
                                  variant="body2" 
                                  fontSize="0.7rem" 
                                  sx={{ opacity: 0.7 }}
                                >
                                  Vide
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          
                          {/* Tooltip pour montrer les informations au survol */}
                          {bottle && (
                            <Tooltip
                              title={
                                <Box sx={{ p: 0.5 }}>
                                  <Typography variant="subtitle2" fontWeight="bold">{bottle.wine?.name}</Typography>
                                  <Typography variant="body2">
                                    {bottle.wine?.vintage && `${bottle.wine.vintage} • `}
                                    {bottle.wine?.color === 'red' ? 'Rouge' : 
                                     bottle.wine?.color === 'white' ? 'Blanc' : 
                                     bottle.wine?.color === 'rose' ? 'Rosé' : 
                                     bottle.wine?.color === 'sparkling' ? 'Effervescent' : 'Fortifié'}
                                  </Typography>
                                  {bottle.wine?.domain && (
                                    <Typography variant="body2">Domaine: {bottle.wine.domain}</Typography>
                                  )}
                                  {bottle.wine?.appellation && (
                                    <Typography variant="body2">Appellation: {bottle.wine.appellation}</Typography>
                                  )}
                                  {bottle.wine?.region && (
                                    <Typography variant="body2">Région: {bottle.wine.region}</Typography>
                                  )}
                                  {bottle.label && (
                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      {(() => {
                                        const labelInfo = customLabels.find(l => l.id === bottle.label);
                                        return labelInfo ? (
                                          <>
                                            {React.cloneElement(labelInfo.icon, { sx: { fontSize: 14 } })}
                                            <Typography variant="body2">{labelInfo.label}</Typography>
                                          </>
                                        ) : null;
                                      })()}
                                    </Box>
                                  )}
                                </Box>
                              }
                              arrow
                              placement="top"
                              followCursor
                              enterDelay={300}
                              leaveDelay={100}
                              componentsProps={{
                                tooltip: {
                                  sx: {
                                    bgcolor: theme.palette.mode === 'dark' 
                                      ? 'rgba(40, 40, 40, 0.95)' 
                                      : 'rgba(255, 255, 255, 0.95)',
                                    color: theme.palette.text.primary,
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                                    borderRadius: 2,
                                    p: 1.5,
                                    border: `1px solid ${theme.palette.divider}`,
                                    maxWidth: 280
                                  }
                                }
                              }}
                            >
                              <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}></span>
                            </Tooltip>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Paper>
    );
  };

  // Rendu des statistiques
  const renderStatistics = () => {
    if (!selectedLocation) return null;

    return (
      <Box p={2}>
        <Grid container spacing={3}>
          <Grid component="div" sx={{ width: { xs: '100%', md: '33%' } }}>
            <Card
              elevation={0}
              sx={{
                p: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: 'rgba(21, 101, 192, 0.08)',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  background: 'linear-gradient(90deg, #1565C0, #42A5F5)'
                }
              }}
            >
              <Typography 
                variant="h3" 
                color="primary"
                sx={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #1565C0, #42A5F5)',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                {bottles.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
                Bouteilles placées
              </Typography>
            </Card>
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '100%', md: '33%' } }}>
            <Card
              elevation={0}
              sx={{
                p: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: 'rgba(245, 124, 0, 0.08)',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  background: 'linear-gradient(90deg, #E65100, #FF9800)'
                }
              }}
            >
              <Typography 
                variant="h3" 
                color="warning.main"
                sx={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #E65100, #FF9800)',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                {positions.length - bottles.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
                Emplacements vides
              </Typography>
            </Card>
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '100%', md: '33%' } }}>
            <Card
              elevation={0}
              sx={{
                p: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: 'rgba(46, 125, 50, 0.08)',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  background: 'linear-gradient(90deg, #2E7D32, #66BB6A)'
                }
              }}
            >
              <Typography 
                variant="h3" 
                color="success.main"
                sx={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #2E7D32, #66BB6A)',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                {positions.length ? Math.round((bottles.length / positions.length) * 100) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
                Taux d&apos;occupation
              </Typography>
            </Card>
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '100%' } }}>
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
                {['red', 'white', 'rose', 'sparkling', 'fortified'].map(color => {
                  const count = bottles.filter(b => b.wine?.color === color).length;
                  const percentage = bottles.length ? Math.round((count / bottles.length) * 100) : 0;
                  
                  return (
                    <Box key={color} sx={{ textAlign: 'center', minWidth: 100 }}>
                      <Box 
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: '50%',
                          bgcolor: color === 'red' ? 'rgba(139, 0, 0, 0.9)' :
                                  color === 'white' ? 'rgba(245, 245, 220, 0.9)' :
                                  color === 'rose' ? 'rgba(255, 182, 193, 0.9)' :
                                  color === 'sparkling' ? 'rgba(176, 196, 222, 0.9)' :
                                  'rgba(139, 69, 19, 0.9)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mx: 'auto',
                          color: color === 'red' || color === 'fortified' ? 'white' : 'black',
                          fontWeight: 'bold',
                          fontSize: '1.5rem',
                          boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                          border: '4px solid white',
                          position: 'relative',
                          '&::after': percentage > 0 ? {
                            content: '""',
                            position: 'absolute',
                            top: -5,
                            right: -5,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: 'white',
                            color: 'black',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            border: `2px solid ${
                              color === 'red' ? '#8B0000' :
                              color === 'white' ? '#E8E8D0' :
                              color === 'rose' ? '#FFB6C1' :
                              color === 'sparkling' ? '#B0C4DE' :
                              '#A0522D'
                            }`
                          } : {}
                        }}
                      >
                        {count}
                        {percentage > 0 && (
                          <Box sx={{ 
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
                            border: `2px solid ${
                              color === 'red' ? '#8B0000' :
                              color === 'white' ? '#E8E8D0' :
                              color === 'rose' ? '#FFB6C1' :
                              color === 'sparkling' ? '#B0C4DE' :
                              '#A0522D'
                            }`
                          }}>
                            {percentage}%
                          </Box>
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontWeight: 500 }}>
                        {color === 'red' ? 'Rouge' :
                         color === 'white' ? 'Blanc' :
                         color === 'rose' ? 'Rosé' :
                         color === 'sparkling' ? 'Effervescent' :
                         'Fortifié'}
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
  
  // Composant principal
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        height: '100%'
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              fontWeight: 600,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <WineBarIcon /> {selectedLocation?.name || 'Sélectionnez un emplacement'}
          </Typography>
          {selectedLocation && (
            <Typography variant="body2" color="text.secondary">
              {(() => {
                const types: Record<string, string> = {
                  shelf: 'Étagère',
                  case: 'Caisse',
                  drawer: 'Tiroir',
                  rack: 'Casier',
                  cellar: 'Cave complète',
                  fridge: 'Réfrigérateur',
                  other: 'Autre'
                };
                return types[selectedLocation.type] || selectedLocation.type;
              })()}
            </Typography>
          )}
        </Box>
        {selectedLocation && (
          <Box>
            <Button 
              startIcon={<EditIcon />}
              component={Link}
              href={`/storage/edit?id=${selectedLocation.id}`}
              sx={{ 
                borderRadius: 2,
                background: isDarkMode 
                  ? 'linear-gradient(90deg, rgba(25,118,210,0.1), rgba(21,101,192,0.05))'
                  : 'linear-gradient(90deg, rgba(25,118,210,0.05), rgba(21,101,192,0.02))',
                borderColor: alpha(theme.palette.primary.main, 0.3),
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  background: isDarkMode 
                    ? 'linear-gradient(90deg, rgba(25,118,210,0.2), rgba(21,101,192,0.1))'
                    : 'linear-gradient(90deg, rgba(25,118,210,0.1), rgba(21,101,192,0.05))',
                }
              }}
            >
              Modifier
            </Button>
          </Box>
        )}
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Tabs 
        value={currentTab} 
        onChange={onTabChange}
        sx={{ 
          mb: 3,
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.main,
            height: 3,
            borderRadius: '3px 3px 0 0'
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '1rem',
            '&.Mui-selected': {
              fontWeight: 600,
              color: theme.palette.primary.main
            }
          }
        }}
      >
        <Tab label="Vue Graphique" />
        <Tab label="Statistiques" />
      </Tabs>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {currentTab === 0 && renderPositionsGrid()}
          {currentTab === 1 && renderStatistics()}
        </>
      )}
    </Paper>
  );
};

export default StorageVisualization;