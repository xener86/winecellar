import React from 'react';
import {
  Box, Paper, IconButton, InputBase, Chip, useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  WineBar as WineBarIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';

interface Props {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  toggleFilter: (filter: string) => void;
  isFilterActive: (filter: string) => boolean;
}

const SearchAndFiltersBar: React.FC<Props> = ({
  searchTerm,
  setSearchTerm,
  toggleFilter,
  isFilterActive
}) => {
  const theme = useTheme();

  const wineColorFilters = [
    { id: 'red', label: 'Rouge', chipColor: 'default' as const, iconColor: '#8B0000' },
    { id: 'white', label: 'Blanc', chipColor: 'default' as const, iconColor: '#DAA520' },
    { id: 'rose', label: 'Rosé', chipColor: 'default' as const, iconColor: '#FFB6C1' },
  ];

  const labelFilters = [
    { id: 'favorite', label: 'Coup de cœur', icon: <FavoriteIcon />, chipColor: 'secondary' as const },
    { id: 'ready', label: 'Prêt à boire', icon: <WineBarIcon />, chipColor: 'success' as const },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', md: 'center' },
        mb: 3,
        gap: 2,
      }}
    >
      {/* Barre de recherche */}
      <Paper
        component="form"
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          width: { xs: '100%', md: 300 },
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
        onSubmit={(e) => e.preventDefault()}
      >
        <IconButton sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Rechercher un vin..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <IconButton
            sx={{ p: '10px' }}
            aria-label="clear search"
            onClick={() => setSearchTerm('')}
          >
            <ClearIcon />
          </IconButton>
        )}
      </Paper>

      {/* Filtres */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: { xs: 'flex-start', md: 'flex-end' },
        }}
      >
        {wineColorFilters.map((filter) => {
          const isActive = isFilterActive(filter.id);
          return (
            <Chip
              key={filter.id}
              icon={<WineBarIcon />}
              label={filter.label}
              onClick={() => toggleFilter(filter.id)}
              color={isActive ? 'primary' : filter.chipColor}
              variant={isActive ? 'filled' : 'outlined'}
              sx={{
                '& .MuiChip-icon': {
                  color: isActive ? 'inherit' : filter.iconColor,
                },
              }}
            />
          );
        })}

        {labelFilters.map((filter) => {
          const isActive = isFilterActive(filter.id);
          return (
            <Chip
              key={filter.id}
              icon={filter.icon}
              label={filter.label}
              onClick={() => toggleFilter(filter.id)}
              color={isActive ? filter.chipColor : 'default'}
              variant={isActive ? 'filled' : 'outlined'}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default SearchAndFiltersBar;
