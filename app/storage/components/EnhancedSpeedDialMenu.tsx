// app/storage/components/EnhancedSpeedDialMenu.tsx
import React, { useState } from 'react';
import { 
  SpeedDial, SpeedDialAction, SpeedDialIcon,
  Badge, useTheme, alpha
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import InventoryIcon from '@mui/icons-material/Inventory';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PieChartIcon from '@mui/icons-material/PieChart';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import QrCodeIcon from '@mui/icons-material/QrCode';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import WineBarIcon from '@mui/icons-material/WineBar';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useRouter } from 'next/navigation';

interface SpeedDialMenuProps {
  onSearch: () => void;
  onFilter: () => void;
  onInventoryToggle: (active: boolean) => void;
  onOptimize: () => void;
  onAperitifSuggestions: () => void;
  displayMode: string;
  onDisplayModeChange: (mode: string) => void;
  activeFilters: string[];
  inventoryMode: boolean;
}

const EnhancedSpeedDialMenu: React.FC<SpeedDialMenuProps> = ({ 
  onSearch, 
  onFilter, 
  onInventoryToggle, 
  onOptimize,
  onAperitifSuggestions,
  displayMode,
  onDisplayModeChange,
  activeFilters = [],
  inventoryMode = false
}) => {
  const theme = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  
  const handleClose = () => {
    setOpen(false);
  };
  
  const handleOpen = () => {
    setOpen(true);
  };

  // Supprimé la fonction non utilisée getActionIcon

  // Supprimé la fonction non utilisée getDisplayModeLabel

  const toggleDisplayMode = () => {
    const modes = ['default', 'temperature', 'labels'];
    const currentIndex = modes.indexOf(displayMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onDisplayModeChange(modes[nextIndex]);
    handleClose();
  };

  const actions = [
    { 
      icon: <SearchIcon />, 
      name: 'Rechercher', 
      action: () => { handleClose(); onSearch(); },
      backgroundColor: alpha(theme.palette.primary.main, 0.1)
    },
    { 
      icon: activeFilters.length ? 
        <Badge badgeContent={activeFilters.length} color="primary">
          <FilterListIcon />
        </Badge> : 
        <FilterListIcon />, 
      name: 'Filtrer', 
      action: () => { handleClose(); onFilter(); },
      backgroundColor: alpha(theme.palette.primary.main, 0.1)
    },
    { 
      icon: <InventoryIcon color={inventoryMode ? "primary" : "inherit"} />, 
      name: `Mode inventaire ${inventoryMode ? '(actif)' : ''}`, 
      action: () => { handleClose(); onInventoryToggle(!inventoryMode); },
      backgroundColor: alpha(theme.palette.primary.main, 0.1)
    },
    { 
      icon: displayMode === 'default' ? <WineBarIcon /> : 
           displayMode === 'temperature' ? <ThermostatIcon /> : 
           <FavoriteIcon />, 
      name: displayMode === 'default' ? 'Mode Couleur' : 
           displayMode === 'temperature' ? 'Mode Température' : 
           'Mode Étiquettes', 
      action: toggleDisplayMode,
      backgroundColor: alpha(theme.palette.secondary.main, 0.1)
    },
    { 
      icon: <QrCodeIcon />, 
      name: 'QR Codes', 
      action: () => { handleClose(); router.push('/generate-qr'); },
      backgroundColor: alpha(theme.palette.info.main, 0.1)
    },
    { 
      icon: <LunchDiningIcon />, 
      name: 'Suggestions apéritif', 
      action: () => { handleClose(); onAperitifSuggestions(); },
      backgroundColor: alpha(theme.palette.secondary.main, 0.1)
    },
    { 
      icon: <PieChartIcon />, 
      name: 'Analyses', 
      action: () => { handleClose(); router.push('/insights'); },
      backgroundColor: alpha(theme.palette.info.main, 0.1)
    },
    { 
      icon: <AutoFixHighIcon />, 
      name: 'Optimiser', 
      action: () => { handleClose(); onOptimize(); },
      backgroundColor: alpha(theme.palette.info.main, 0.1)
    },
    { 
      icon: <AddIcon />, 
      name: 'Nouvel emplacement', 
      action: () => { handleClose(); router.push('/storage/add'); },
      backgroundColor: alpha(theme.palette.error.main, 0.1)
    },
  ];

  return (
    <SpeedDial
      ariaLabel="Menu d&apos;actions"
      sx={{ 
        position: 'fixed', 
        bottom: 24, 
        right: 24,
        '& .MuiSpeedDial-fab': {
          backgroundColor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.primary.dark, 0.9)
            : alpha(theme.palette.primary.main, 0.9),
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          '&:hover': {
            backgroundColor: theme.palette.primary.main,
          }
        }
      }}
      icon={<SpeedDialIcon icon={<MoreHorizIcon />} openIcon={<CloseIcon />} />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
      direction="up"
      FabProps={{
        size: "large"
      }}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          tooltipOpen
          onClick={action.action}
          FabProps={{
            sx: {
              bgcolor: action.backgroundColor,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2)
              }
            }
          }}
        />
      ))}
    </SpeedDial>
  );
};

export default EnhancedSpeedDialMenu;