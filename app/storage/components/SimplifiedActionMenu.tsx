// app/storage/components/SimplifiedActionMenu.tsx
import React from 'react';
import { 
  Box, Button, IconButton, 
  ToggleButtonGroup, ToggleButton, FormControlLabel, Switch, 
  Tooltip, Stack
} from '@mui/material';
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

interface SimplifiedActionMenuProps {
  onSearch: () => void;
  onFilter: () => void;
  onOptimize: () => void;
  onAperitifSuggestions: () => void;
  displayMode: string;
  onDisplayModeChange: (mode: string) => void;
  inventoryMode: boolean;
  onInventoryModeChange: (value: boolean) => void;
  isSmallScreen: boolean;
}

const SimplifiedActionMenu: React.FC<SimplifiedActionMenuProps> = ({
  onSearch,
  onFilter,
  onOptimize,
  onAperitifSuggestions,
  displayMode,
  onDisplayModeChange,
  inventoryMode,
  onInventoryModeChange,
  isSmallScreen
}) => {
  // Supprimé la variable 'theme' non utilisée
  
  // Supprimé la fonction non utilisée getDisplayModeName

  const handleDisplayModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: string | null) => {
    if (newMode !== null) {
      onDisplayModeChange(newMode);
    }
  };

  // Version mobile avec boutons empilés verticalement
  if (isSmallScreen) {
    return (
      <Stack spacing={1} sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          href="/storage/add"
          sx={{ borderRadius: 8 }}
        >
          Ajouter
        </Button>
        
        <IconButton 
          onClick={onSearch}
          color="primary"
          sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
        >
          <SearchIcon />
        </IconButton>
        
        <IconButton 
          onClick={onFilter}
          color="primary"
          sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
        >
          <FilterAltIcon />
        </IconButton>
      </Stack>
    );
  }

  // Version desktop avec barre d'outils complète
  return (
    <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        {/* Boutons d'action à gauche */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap'
          }}
        >
          <Button 
            variant="outlined" 
            startIcon={<SearchIcon />} 
            onClick={onSearch}
            sx={{ borderRadius: 2 }}
          >
            Rechercher
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<FilterAltIcon />} 
            onClick={onFilter}
            sx={{ borderRadius: 2 }}
          >
            Filtrer
          </Button>
          
          <Button 
            variant="outlined" 
            color="info"
            startIcon={<InventoryIcon />} 
            component={Link}
            href="/storage/stock"
            sx={{ borderRadius: 2 }}
          >
            Stock
          </Button>
          
          <Button 
            variant="outlined" 
            color="info"
            startIcon={<QrCodeIcon />} 
            component={Link}
            href="/generate-qr"
            sx={{ borderRadius: 2 }}
          >
            QR Codes
          </Button>
        </Box>
        
        {/* Bouton d'ajout à droite */}
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          component={Link}
          href="/storage/add"
          sx={{ borderRadius: 2 }}
        >
          Nouvel emplacement
        </Button>
      </Box>
      
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap'
          }}
        >
          <Button 
            variant="outlined" 
            color="secondary"
            startIcon={<LunchDiningIcon />} 
            onClick={onAperitifSuggestions}
            sx={{ borderRadius: 2 }}
          >
            Apéritif
          </Button>
          
          <Button 
            variant="outlined" 
            color="info"
            startIcon={<PieChartIcon />} 
            component={Link}
            href="/insights"
            sx={{ borderRadius: 2 }}
          >
            Analyses
          </Button>
          
          <Button 
            variant="outlined" 
            color="info"
            startIcon={<AutoFixHighIcon />} 
            onClick={onOptimize}
            sx={{ borderRadius: 2 }}
          >
            Optimiser
          </Button>
        </Box>
        
        <Box display="flex" gap={2} alignItems="center">
          <ToggleButtonGroup
            value={displayMode}
            exclusive
            onChange={handleDisplayModeChange}
            aria-label="mode d&apos;affichage"
            size="small"
          >
            <ToggleButton value="default" aria-label="couleur">
              <Tooltip title="Par couleur">
                <WineBarIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="temperature" aria-label="température">
              <Tooltip title="Par température de service">
                <ThermostatIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="labels" aria-label="étiquettes">
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
              />
            }
            label="Mode inventaire"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default SimplifiedActionMenu;