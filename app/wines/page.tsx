'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Paper,
  Snackbar,
  Badge,
  Divider,
  CircularProgress,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import WineBarIcon from '@mui/icons-material/WineBar';
import Navbar from '../components/Navbar';
import WineCard from '../components/WineCard';
import { supabase } from '../utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Types définis
type Wine = {
  id: string;
  name: string;
  vintage: number | null;
  domain: string | null;
  region: string | null;
  appellation: string | null;
  color: string;
  image_url: string | null;
  price: number | null;
};

type Filters = {
  color: string;
  region: string;
  priceRange: string;
};

type NotificationType = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
};

export default function Wines() {
  // États du composant
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>({
    color: '',
    region: '',
    priceRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [notification, setNotification] = useState<NotificationType>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [uniqueRegions, setUniqueRegions] = useState<string[]>([]);
  
  // Hooks React
  const router = useRouter();

  // Fonction pour afficher les notifications
  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  // Fermeture de la notification
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // Fonction de récupération des vins
  const fetchWines = useCallback(async () => {
    setLoading(true);
    try {
      // Vérification de l'authentification
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Erreur d\'authentification:', userError.message);
        router.push('/login');
        return;
      }
      
      if (!userData.user) {
        console.log('Aucun utilisateur connecté, redirection vers login');
        router.push('/login');
        return;
      }

      // Récupération des vins
      const { data, error } = await supabase
        .from('wine')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setWines(data || []);
      
      // Extraction des régions uniques pour les filtres
      const regions = data
        ?.filter(wine => wine.region)
        .map(wine => wine.region as string)
        .filter((region, index, self) => self.indexOf(region) === index)
        .sort() || [];
      
      setUniqueRegions(regions);
    } catch (error) {
      console.error('Erreur lors de la récupération des vins:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      showNotification(`Erreur: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [router, showNotification]);

  // Effet pour charger les vins au montage du composant
  useEffect(() => {
    fetchWines();
  }, [fetchWines]);
  
  // Fonction pour trier les vins
  const getSortedWines = (winesToSort: Wine[]) => {
    if (sortBy === 'name') {
      return [...winesToSort].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'vintage') {
      return [...winesToSort].sort((a, b) => {
        if (a.vintage === null) return 1;
        if (b.vintage === null) return -1;
        return b.vintage - a.vintage;
      });
    } else if (sortBy === 'price') {
      return [...winesToSort].sort((a, b) => {
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return b.price - a.price;
      });
    }
    return winesToSort;
  };

  // Appliquer les filtres aux vins
  const filteredWines = getSortedWines(wines).filter(wine => {
    // Filtre de recherche
    const searchMatch = 
      wine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wine.domain && wine.domain.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (wine.region && wine.region.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (wine.appellation && wine.appellation.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtre de couleur
    const colorMatch = filters.color ? wine.color === filters.color : true;
    
    // Filtre de région
    const regionMatch = filters.region ? wine.region === filters.region : true;
    
    // Filtre de prix
    let priceMatch = true;
    if (filters.priceRange) {
      if (wine.price === null) priceMatch = false;
      else if (filters.priceRange === 'budget' && wine.price > 15) priceMatch = false;
      else if (filters.priceRange === 'medium' && (wine.price < 15 || wine.price > 50)) priceMatch = false;
      else if (filters.priceRange === 'premium' && wine.price < 50) priceMatch = false;
    }
    
    return searchMatch && colorMatch && regionMatch && priceMatch;
  });

  // Compter les filtres actifs
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.color) count++;
    if (filters.region) count++;
    if (filters.priceRange) count++;
    return count;
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      color: '',
      region: '',
      priceRange: ''
    });
  };

  // Gestionnaires d'événements
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e: SelectChangeEvent<string>) => {
    setSortBy(e.target.value);
  };

  const handleFilterChange = (name: keyof Filters) => (e: SelectChangeEvent<string>) => {
    setFilters(prev => ({ ...prev, [name]: e.target.value }));
  };

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  // --- Rendu JSX ---
  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-16">
        {/* Fil d'Ariane */}
        <div className="flex items-center text-sm text-gray-600 mb-6">
          <Link href="/" className="flex items-center hover:text-wine-burgundy transition-colors">
            <HomeIcon fontSize="small" className="mr-1" />
            <span>Accueil</span>
          </Link>
          <NavigateNextIcon fontSize="small" className="mx-2" />
          <span className="font-medium text-wine-burgundy">Vins</span>
        </div>
        
        {/* Titre et bouton d'ajout */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif font-medium text-wine-burgundy">
            Mes Vins
          </h1>
          <Link href="/add-wine">
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              className="rounded-lg bg-gradient-to-r from-wine-burgundy to-wine-red hover:from-wine-red hover:to-wine-burgundy shadow-md hover:shadow-lg transition-all duration-300"
            >
              Ajouter un vin
            </Button>
          </Link>
        </div>

        {/* Barre de recherche et filtres */}
        <Paper className="p-6 mb-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-grow min-w-[280px]">
              <TextField
                placeholder="Rechercher par nom, domaine, région..."
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon className="text-gray-400" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  className: "rounded-lg"
                }}
              />
            </div>
            
            <FormControl className="min-w-[140px]">
              <InputLabel>Trier par</InputLabel>
              <Select
                value={sortBy}
                label="Trier par"
                onChange={handleSortChange}
                className="rounded-lg"
              >
                <MenuItem value="name">Nom</MenuItem>
                <MenuItem value="vintage">Millésime</MenuItem>
                <MenuItem value="price">Prix</MenuItem>
              </Select>
            </FormControl>
            
            <Button 
              variant="outlined" 
              className="rounded-lg border-gray-300 hover:border-wine-burgundy hover:bg-gray-50"
              startIcon={
                <Badge badgeContent={getActiveFiltersCount()} color="primary">
                  <FilterListIcon />
                </Badge>
              }
              onClick={toggleFilters}
            >
              Filtres
            </Button>
          </div>
          
          {showFilters && (
            <div className="mt-6">
              <Divider className="mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                <FormControl fullWidth>
                  <InputLabel>Couleur</InputLabel>
                  <Select
                    value={filters.color}
                    label="Couleur"
                    onChange={handleFilterChange('color')}
                    className="rounded-lg"
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    <MenuItem value="red">Rouge</MenuItem>
                    <MenuItem value="white">Blanc</MenuItem>
                    <MenuItem value="rose">Rosé</MenuItem>
                    <MenuItem value="sparkling">Effervescent</MenuItem>
                    <MenuItem value="fortified">Fortifié</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Région</InputLabel>
                  <Select
                    value={filters.region}
                    label="Région"
                    onChange={handleFilterChange('region')}
                    className="rounded-lg"
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {uniqueRegions.map((region) => (
                      <MenuItem key={region} value={region}>
                        {region}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Gamme de prix</InputLabel>
                  <Select
                    value={filters.priceRange}
                    label="Gamme de prix"
                    onChange={handleFilterChange('priceRange')}
                    className="rounded-lg"
                  >
                    <MenuItem value="">Tous les prix</MenuItem>
                    <MenuItem value="budget">Economique (&lt; 15€)</MenuItem>
                    <MenuItem value="medium">Moyen (15-50€)</MenuItem>
                    <MenuItem value="premium">Premium (&gt; 50€)</MenuItem>
                  </Select>
                </FormControl>
                
                <div className="flex justify-end">
                  <Button 
                    variant="text" 
                    color="inherit" 
                    onClick={resetFilters}
                    className="rounded-lg text-gray-500 hover:text-wine-burgundy"
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Paper>

        {loading ? (
          <div className="flex justify-center my-16">
            <CircularProgress />
          </div>
        ) : filteredWines.length === 0 ? (
          <Paper className="p-12 text-center rounded-xl shadow-sm border border-gray-100">
            {wines.length === 0 ? (
              <>
                <WineBarIcon className="text-6xl text-gray-300 mb-4" />
                <h2 className="text-xl font-serif text-gray-600 mb-2">
                  Aucun vin dans votre cave
                </h2>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Commencez par ajouter votre premier vin pour construire votre collection.
                </p>
                <Link href="/add-wine">
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon />}
                    className="mt-2 rounded-lg bg-gradient-to-r from-wine-burgundy to-wine-red"
                  >
                    Ajouter un vin
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <SearchIcon className="text-6xl text-gray-300 mb-4" />
                <h2 className="text-xl font-serif text-gray-600 mb-2">
                  Aucun vin ne correspond à vos critères
                </h2>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Essayez de modifier votre recherche ou vos filtres.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={resetFilters}
                    className="mt-2 rounded-lg"
                  >
                    Réinitialiser les filtres
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    onClick={() => setSearchTerm('')}
                    className="mt-2 rounded-lg"
                  >
                    Effacer la recherche
                  </Button>
                </div>
              </>
            )}
          </Paper>
        ) : (
          <>
            {/* Nombre de vins trouvés */}
            <div className="mb-4">
              <Typography variant="body2" className="text-gray-500">
                {filteredWines.length} {filteredWines.length > 1 ? 'vins trouvés' : 'vin trouvé'}
              </Typography>
            </div>
            
            {/* Grille de vins avec taille uniforme */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredWines.map((wine) => (
                <WineCard
                  key={wine.id}
                  id={wine.id}
                  name={wine.name}
                  color={wine.color}
                  vintage={wine.vintage}
                  domain={wine.domain}
                  region={wine.region}
                  appellation={wine.appellation}
                  price={wine.price}
                  imageUrl={wine.image_url}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={closeNotification} 
          severity={notification.severity}
          variant="filled"
          className="rounded-lg"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}