import React from 'react';
import { Box, Typography, Tooltip, useTheme, alpha } from '@mui/material';
import {
  Add as AddIcon,
  WineBar as WineBarIcon,
} from '@mui/icons-material';
import { Bottle } from '@types';

interface WineAgingInfo {
  current_phase?: string;
  drink_now?: boolean;
}

interface Props {
  bottle: Bottle | null;
  filteredBottles: Bottle[];
  hovered: boolean;
  displayMode: string;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  getBottleStyle: (bottle: Bottle | null) => React.CSSProperties;
  agingInfo: Record<string, WineAgingInfo>;
}

const customLabels = [
  { id: 'favorite', label: 'Coup de cœur', color: '#FFD54F', icon: <WineBarIcon /> },
  { id: 'special', label: 'Occasion spéciale', color: '#7986CB', icon: <WineBarIcon /> },
  { id: 'keep', label: 'À garder', color: '#81C784', icon: <WineBarIcon /> },
  { id: 'aperitif', label: 'Apéritif', color: '#FF8A65', icon: <WineBarIcon /> },
];

const BottleCell: React.FC<Props> = ({
  bottle,
  filteredBottles,
  hovered,
  displayMode,
  onClick,
  onHover,
  getBottleStyle,
  agingInfo
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const cellSize = 60;
  const bottleSize = 48;
  const isBottleInFilter = bottle && filteredBottles.includes(bottle);
  const isFiltered = bottle && !isBottleInFilter;

  const labelInfo = customLabels.find(l => l.id === bottle?.label);

  const content = bottle ? (
    <Box sx={{ ...getBottleStyle(bottle), width: bottleSize, height: bottleSize }}>
      {agingInfo[bottle.id]?.drink_now && (
        <Box sx={{ position: 'absolute', top: -8, left: -8 }}>
          <Tooltip title="Prêt à boire" arrow>
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                bgcolor: theme.palette.success.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              <WineBarIcon sx={{ fontSize: 12, color: 'white' }} />
            </Box>
          </Tooltip>
        </Box>
      )}

      {bottle.label && displayMode !== 'labels' && labelInfo && (
        <Box sx={{ position: 'absolute', top: -8, right: -8 }}>
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
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textShadow: ['red', 'fortified'].includes(bottle.wine?.color || '')
            ? '0px 1px 2px rgba(0,0,0,0.3)'
            : 'none'
        }}
      >
        {bottle.wine?.vintage}
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
        backgroundColor: isDarkMode
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
      {hovered ? (
        <AddIcon sx={{ color: theme.palette.primary.main, fontSize: '1.2rem' }} />
      ) : (
        <Typography variant="body2" fontSize="0.7rem" sx={{ opacity: 0.7 }}>
          Vide
        </Typography>
      )}
    </Box>
  );

  return (
    <Box
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      sx={{
        m: 0.3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        transition: 'transform 0.2s ease',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
        opacity: isFiltered ? 0.4 : 1
      }}
    >
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
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2), 0 0 0 3px rgba(25, 118, 210, 0.3)',
            transform: 'translateY(-3px)'
          }
        }}
      >
        {content}
      </Box>
    </Box>
  );
};

export default BottleCell;
