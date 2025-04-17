// File: app/storage/components/StorageHeader.tsx
import React from 'react';
import { 
  Typography, Box, Button, Tooltip,
  ToggleButtonGroup, ToggleButton, FormControlLabel, Switch
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import InventoryIcon from '@mui/icons-material/Inventory';
import QrCodeIcon from '@mui/icons-material/QrCode';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import PieChartIcon from '@mui/icons-material/PieChart';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import WineBarIcon from '@mui/icons-material/WineBar';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Link from 'next/link';

interface StorageHeaderProps {
  onSearch: () => void;
  onFilter: () => void;
  onOptimize: () => void;
  onAperitifSuggestions: () => void;
  displayMode: string;
  onDisplayModeChange: (event: React.MouseEvent<HTMLElement>, newMode: string | null) => void;
  inventoryMode: boolean;
  onInventoryModeChange: (value: boolean) => void;
}

const StorageHeader: React.FC<StorageHeaderProps> = ({
  onSearch,
  onFilter,
  onOptimize,
  onAperitifSuggestions,
  displayMode,
  onDisplayModeChange,
  inventoryMode,
  onInventoryModeChange
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <>
      {/* Titre et actions principales */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight="500"
          sx={{
            backgroundImage: 'linear-gradient(45deg, #880000, #B30000)',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: isDarkMode ? '0px 2px 4px rgba(0,0,0,0.5)' : 'none'
          }}
        >
          Mes Emplacements
        </Typography>
        
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap',
            justifyContent: 'flex-end'
          }}
        >
          {/* Action buttons */}
          <ActionButton 
            icon={<SearchIcon />} 
            onClick={onSearch}
            label="Rechercher"
          />
          
          <ActionButton 
            icon={<FilterAltIcon />} 
            onClick={onFilter}
            label="Filtrer"
          />
          
          <ActionButton 
            icon={<InventoryIcon />} 
            component={Link}
            href="/storage/stock"
            color="info"
            label="Stock"
          />
          
          <ActionButton 
            icon={<QrCodeIcon />} 
            component={Link}
            href="/generate-qr"
            color="info"
            label="QR Codes"
          />
          
          <ActionButton 
            icon={<LunchDiningIcon />} 
            onClick={onAperitifSuggestions}
            color="secondary"
            label="Apéritif"
          />
          
          <ActionButton 
            icon={<PieChartIcon />} 
            component={Link}
            href="/insights"
            color="info"
            label="Analyses"
          />
          
          <ActionButton 
            icon={<AutoFixHighIcon />} 
            onClick={onOptimize}
            color="info"
            label="Optimiser"
          />
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            component={Link}
            href="/storage/add"
            sx={{ 
              borderRadius: 2,
              px: 2,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              background: isDarkMode 
                ? 'linear-gradient(45deg, #6a1b1b, #8b0000)' 
                : 'linear-gradient(45deg, #8b0000, #C62828)',
              '&:hover': {
                background: isDarkMode 
                  ? 'linear-gradient(45deg, #8b0000, #a31515)' 
                  : 'linear-gradient(45deg, #a31515, #c62828)',
                boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Nouvel emplacement
          </Button>
        </Box>
      </Box>

      {/* Mode d'affichage et mode inventaire */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={3}
        sx={{
          p: 1.5,
          borderRadius: 3,
          bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.4) : alpha(theme.palette.grey[100], 0.7),
          border: `1px solid ${isDarkMode ? alpha(theme.palette.divider, 0.2) : theme.palette.divider}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <ToggleButtonGroup
          value={displayMode}
          exclusive
          onChange={onDisplayModeChange}
          aria-label="mode d'affichage"
          size="small"
          sx={{ 
            bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.7) : alpha(theme.palette.grey[50], 0.9),
            borderRadius: 2,
            p: 0.5,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
            '& .MuiToggleButton-root.Mui-selected': {
              bgcolor: isDarkMode ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.primary.light, 0.3),
              color: theme.palette.primary.main,
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
          }}
        >
          <ToggleButton value="default" aria-label="couleur" sx={{ borderRadius: 1.5 }}>
            <Tooltip title="Par couleur">
              <WineBarIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="temperature" aria-label="température" sx={{ borderRadius: 1.5 }}>
            <Tooltip title="Par température de service">
              <ThermostatIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="labels" aria-label="étiquettes" sx={{ borderRadius: 1.5 }}>
            <Tooltip title="Par étiquette">
              <FavoriteIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
        
        <FormControlLabel
          control={
            <Switch 
              checked={inventoryMode} 
              onChange={(e) => onInventoryModeChange(e.target.checked)}
              color="primary"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: theme.palette.primary.main,
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            />
          }
          label={
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: inventoryMode ? 'bold' : 'normal',
                color: inventoryMode ? 'primary.main' : 'text.secondary'
              }}
            >
              Mode inventaire
            </Typography>
          }
          sx={{ 
            bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.7) : alpha(theme.palette.grey[50], 0.9),
            borderRadius: 2,
            px: 2,
            py: 0.5,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
          }}
        />
      </Box>
    </>
  );
};

// Composant de bouton d'action réutilisable
const ActionButton = ({ 
  icon, 
  onClick, 
  label, 
  component, 
  href, 
  color = 'default'
}: { 
  icon: React.ReactNode, 
  onClick?: () => void, 
  label: string, 
  component?: React.ElementType;
  href?: string, 
  color?: 'default' | 'primary' | 'secondary' | 'info' | 'warning' | 'error' | 'success'
}) => {
  const colorVariant = color === 'default' ? undefined : color;
  
  return (
    <Button 
      variant="outlined" 
      color={colorVariant}
      startIcon={icon}
      onClick={onClick}
      component={component}
      href={href}
      sx={{ 
        borderRadius: 2,
        minWidth: { xs: '40px', sm: '40px', md: 'auto' },
        // Masquer le texte sur petits écrans
        '& .MuiButton-startIcon': {
          mr: { xs: 0, md: 0.5 }
        },
        px: { xs: 1, md: 2 },
        borderWidth: '1.5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          transform: 'translateY(-1px)'
        }
      }}
    >
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>{label}</Box>
    </Button>
  );
};

export default StorageHeader;