'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react'; 
import { 
  Container, Typography, Box, Grid, Paper, Button, CircularProgress, 
  Card, CardContent, IconButton, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, Divider, Tabs, Tab, Snackbar, Alert, useTheme,
  ToggleButtonGroup, ToggleButton, TextField, Tooltip,
  Switch, FormControlLabel, List, ListItem
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WineBarIcon from '@mui/icons-material/WineBar';
import SearchIcon from '@mui/icons-material/Search';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import InventoryIcon from '@mui/icons-material/Inventory';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PieChartIcon from '@mui/icons-material/PieChart';
import Navbar from '../components/Navbar';
import AddBottleDialog from './stock/components/AddBottleDialog';
import { supabase } from '../utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

// Types
type StorageLocation = {
  id: string;
  name: string;
  type: string;
  row_count: number | null;
  column_count: number | null;
};

type Position = {
  id: string;
  storage_location_id: string;
  row_position: number;
  column_position: number;
  qr_code: string | null;
};

type Bottle = {
  id: string;
  wine_id: string;
  position_id: string | null;
  status: string;
  acquisition_date: string | null;
  consumption_date: string | null;
  tasting_note: string | null;
  wine?: Wine;
  position?: Position;
  label?: string;
};

type Wine = {
  id: string;
  name: string;
  color: string;
  vintage: number | null;
  domain: string | null;
  region: string | null;
  appellation: string | null;
  alcohol_percentage: number | null;
};

type FilterOptions = {
  colors: string[];
  labels: string[];
  vintage: { min: number | null; max: number | null };
  searchTerm: string;
};

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



export default function StorageManagement() {
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const cellSize = 50; 
  const bottleSize = 40;
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionLoading, setPositionLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedBottle, setSelectedBottle] = useState<Bottle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addBottleDialogOpen, setAddBottleDialogOpen] = useState(false);
  const [consumeBottleDialogOpen, setConsumeBottleDialogOpen] = useState(false);
  const [inventoryMode, setInventoryMode] = useState(false);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState('default');
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filters, setFilters] = useState<FilterOptions>({ 
    colors: [],
    labels: [],
    vintage: { min: null, max: null },
    searchTerm: ''
  });
  
  const [consumeData, setConsumeData] = useState({
    consumption_date: new Date(),
    tasting_note: ''
  });
  
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info'
  });
  
  const [currentTab, setCurrentTab] = useState(0);
  
  const [aperitifSuggestions, setAperitifSuggestions] = useState<Bottle[]>([]);
  const [aperitifDialogOpen, setAperitifDialogOpen] = useState(false);
  const [hoveredPositionInfo, setHoveredPositionInfo] = useState<{ row: number, col: number } | null>(null);
  const [apiKey, setApiKey] = useState('');

  // Utiliser useRef pour briser la dépendance circulaire
  const fetchPositionsAndBottlesRef = useRef<(locationId: string, filterOptions?: FilterOptions | null) => Promise<void>>(undefined);
  
  // Définir fetchPositionsAndBottles en premier
  const fetchPositionsAndBottles = useCallback(async (locationId: string, filterOptions: FilterOptions | null = null) => { 
    setPositionLoading(true);
    try {
      // Récupérer les positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('position')
        .select('*')
        .eq('storage_location_id', locationId)
        .order('row_position', { ascending: true })
        .order('column_position', { ascending: true });
      
      if (positionsError) throw positionsError;
      setPositions(positionsData || []);
      
      // Construction requête bouteilles
      let bottleQuery = supabase
        .from('bottle')
        .select(`*, wine:wine_id (*)`)
        .eq('status', 'in_stock');
      
      // Appliquer les filtres (utilisant l'état 'filters' ou ceux passés en argument)
      const currentFilters = filterOptions || filters; 

      // Application des différents filtres
      if (currentFilters.colors && currentFilters.colors.length > 0) {
        bottleQuery = bottleQuery.in('wine.color', currentFilters.colors);
      }
      if (currentFilters.labels && currentFilters.labels.length > 0) {
        if (currentFilters.labels.includes('null')) {
          const labelsWithoutNull = currentFilters.labels.filter(l => l !== 'null');
          if (labelsWithoutNull.length > 0) {
            bottleQuery = bottleQuery.or(`label.is.null,label.in.(${labelsWithoutNull.join(',')})`);
          } else {
            bottleQuery = bottleQuery.is('label', null);
          }
        } else {
          bottleQuery = bottleQuery.in('label', currentFilters.labels);
        }
      }
      if (currentFilters.vintage) {
        if (currentFilters.vintage.min !== null) bottleQuery = bottleQuery.gte('wine.vintage', currentFilters.vintage.min);
        if (currentFilters.vintage.max !== null) bottleQuery = bottleQuery.lte('wine.vintage', currentFilters.vintage.max);
      }
      if (currentFilters.searchTerm) {
        bottleQuery = bottleQuery.or(
          `wine.name.ilike.%${currentFilters.searchTerm}%,wine.domain.ilike.%${currentFilters.searchTerm}%,wine.region.ilike.%${currentFilters.searchTerm}%,wine.appellation.ilike.%${currentFilters.searchTerm}%`
        );
      }
      
      // Exécution de la requête pour les bouteilles
      const { data: bottlesData, error: bottlesError } = await bottleQuery; 
      if (bottlesError) throw bottlesError;
      
      // Filtrer bouteilles pour cet emplacement + ajouter info position
      const locationPositionIds = positionsData?.map(p => p.id) || [];
      const bottlesWithPosition = (bottlesData || [])
        .filter(bottle => bottle.position_id && locationPositionIds.includes(bottle.position_id))
        .map(bottle => ({
          ...bottle,
          position: positionsData?.find(pos => pos.id === bottle.position_id),
          wine: bottle.wine || undefined 
        }));
         
      setBottles(bottlesWithPosition as Bottle[]); 
      
    } catch (error: unknown) { 
      console.error('Erreur chargement positions/bouteilles:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur chargement détails'}`,
        severity: 'error'
      });
    } finally {
      setPositionLoading(false);
    }
  }, [filters]);

  // Stocker la référence à la fonction fetchPositionsAndBottles
  useEffect(() => {
    fetchPositionsAndBottlesRef.current = fetchPositionsAndBottles;
  }, [fetchPositionsAndBottles]);
  
  // Ensuite définir fetchLocations qui utilise fetchPositionsAndBottlesRef.current
  const fetchLocations = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('storage_location')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setLocations(data || []);
      if (data && data.length > 0 && !selectedLocation) {
        const firstLocation = data[0];
        setSelectedLocation(firstLocation);
        // Utiliser la référence pour éviter la dépendance circulaire
        if (fetchPositionsAndBottlesRef.current) {
          fetchPositionsAndBottlesRef.current(firstLocation.id);
        }
      }
      setLoading(false);
    } catch (error: unknown) {
      console.error('Exception fetchLocations:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur chargement emplacements'}`,
        severity: 'error'
      });
      setLoading(false);
    }
  }, [router, selectedLocation]);

  const fetchAPIKeys = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('openai_api_key, mistral_api_key')
        .eq('user_id', user.id)
        .single();
      
      // PGRST116: No rows found - ce n'est pas une erreur bloquante
      if (error && error.code !== 'PGRST116') { 
        console.error('Erreur récupération clés API:', error);
        return;
      }
      
      if (data?.openai_api_key) {
        setApiKey(data.openai_api_key);
      } else if (data?.mistral_api_key) {
        setApiKey(data.mistral_api_key);
      }
    } catch (error: unknown) {
      console.error('Erreur fetchAPIKeys:', error);
    }
  }, []); 

  // Effect initial pour charger les données
  useEffect(() => {
    setLoading(true); // S'assurer que loading est true au début
    // Charger les emplacements et les clés API en parallèle
    Promise.all([fetchLocations(), fetchAPIKeys()])
      .catch(error => {
        console.error("Erreur lors du chargement initial:", error);
        setLoading(false);
      });
  }, [fetchLocations, fetchAPIKeys]);

  // Supprimer un emplacement
  const deleteLocation = async (id: string, name: string) => {
    try {
      // Vérifier bouteilles dans l'emplacement
      const { data: positionIdsData } = await supabase
        .from('position').select('id').eq('storage_location_id', id);
      const positionIds = positionIdsData?.map(p => p.id) || [];

      let bottleCount = 0;
      if (positionIds.length > 0) {
        // Utiliser { count: 'exact', head: true } pour juste compter sans récupérer les données
        const { count, error: countError } = await supabase
          .from('bottle').select('id', { count: 'exact', head: true })
          .eq('status', 'in_stock').in('position_id', positionIds);
        if (countError) throw countError;
        bottleCount = count || 0;
      }

      // Confirmation utilisateur
      let confirmDelete = false;
      if (bottleCount > 0) {
        confirmDelete = window.confirm(
          `Cet emplacement contient ${bottleCount} bouteille(s). Les déplacer vers le stock général et supprimer l'emplacement ?`
        );
        if (confirmDelete) {
          // Mettre position_id à null pour les bouteilles concernées
          const { error: updateError } = await supabase
            .from('bottle').update({ position_id: null }).in('position_id', positionIds);
          if (updateError) throw updateError;
        }
      } else {
        // Confirmation simple si l'emplacement est vide
        confirmDelete = window.confirm(`Supprimer l'emplacement "${name}" (vide) ?`);
      }

      if (!confirmDelete) return; // Annuler si l'utilisateur refuse

      // Supprimer positions puis emplacement
      if (positionIds.length > 0) {
        const { error: positionError } = await supabase.from('position').delete().in('id', positionIds);
        // Gérer l'erreur mais continuer pour essayer de supprimer l'emplacement si possible
        if (positionError) console.error("Erreur suppression positions:", positionError); 
      }
      const { error } = await supabase.from('storage_location').delete().eq('id', id);
      if (error) throw error; // Si la suppression de l'emplacement échoue, on arrête
      
      // Mettre à jour l'état local
      const remainingLocations = locations.filter(location => location.id !== id);
      setLocations(remainingLocations);
      // Gérer la sélection si l'emplacement supprimé était sélectionné
      if (selectedLocation?.id === id) {
        const newSelected = remainingLocations[0] || null;
        setSelectedLocation(newSelected);
        if (newSelected && fetchPositionsAndBottlesRef.current) {
          fetchPositionsAndBottlesRef.current(newSelected.id); // Charger les données du nouvel emplacement sélectionné
        } else { 
          // S'il n'y a plus d'emplacements, vider les positions et bouteilles
          setPositions([]); 
          setBottles([]); 
        } 
      }
      
      setNotification({ open: true, message: 'Emplacement supprimé', severity: 'success' });
    } catch (error: unknown) {
      console.error('Exception suppression:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur suppression'}`,
        severity: 'error'
      });
    }
  };

  // Fonction pour afficher le type d'emplacement
  const getTypeInfo = (type: string) => {
    const types: Record<string, { label: string, icon: string, color: string }> = {
      shelf: { label: 'Étagère', icon: '📚', color: '#4CAF50' },
      case: { label: 'Caisse', icon: '📦', color: '#FF9800' },
      drawer: { label: 'Tiroir', icon: '🗄️', color: '#2196F3' },
      rack: { label: 'Casier', icon: '🥂', color: '#9C27B0' },
      cellar: { label: 'Cave complète', icon: '🏰', color: '#795548'},
      fridge: { label: 'Réfrigérateur', icon: '❄️', color: '#00BCD4'},
      other: { label: 'Autre', icon: '🍷', color: '#607D8B'}
    };
    // Retourner une valeur par défaut si le type n'est pas trouvé
    return types[type] || { label: type || 'Inconnu', icon: '❓', color: '#607D8B' };
  };

  // Fonction pour obtenir une bouteille à une position
  const getBottleAtPosition = (positionId: string): Bottle | undefined => {
    return bottles.find(bottle => bottle.position_id === positionId);
  };
  
  // Ouvrir le dialogue d'ajout de bouteille
  const handleOpenAddBottleDialog = (position: Position) => {
    setSelectedPosition(position);
    setSelectedBottle(null); // Assurer qu'aucune bouteille n'est sélectionnée
    setAddBottleDialogOpen(true);
  };
  
  // Gérer le clic sur une position
  const handlePositionClick = (position: Position) => {
    setSelectedPosition(position); // Mémoriser la position cliquée
    const bottle = getBottleAtPosition(position.id);
    
    if (bottle) {
      setSelectedBottle(bottle); // Mémoriser la bouteille trouvée
      setDialogOpen(true); // Ouvrir le dialogue de détails/actions
    } else {
      handleOpenAddBottleDialog(position); // Ouvrir le dialogue d'ajout
    }
  };
  
  // Marquer une bouteille comme consommée
  const handleConsumeBottle = async () => {
    if (!selectedBottle) return; // Garde de sécurité
    
    try {
      const { error } = await supabase
        .from('bottle')
        .update({
          status: 'consumed',
          consumption_date: consumeData.consumption_date.toISOString(), // Utiliser ISO string
          tasting_note: consumeData.tasting_note || null, // Mettre null si vide
          position_id: null // Retirer la bouteille de sa position
        })
        .eq('id', selectedBottle.id);
      
      if (error) throw error;
      
      // Mettre à jour l'état local sans refetch complet
      setBottles(prev => prev.filter(b => b.id !== selectedBottle.id)); 
      
      setConsumeBottleDialogOpen(false); // Fermer le dialogue de consommation
      setDialogOpen(false); // Fermer aussi le dialogue de détails
      
      setNotification({ open: true, message: 'Bouteille consommée', severity: 'success' });
    } catch (error: unknown) {
      console.error('Erreur consommation bouteille:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur consommation'}`,
        severity: 'error'
      });
    }
  };
  
  // Marquer une bouteille comme offerte
  const handleGiftBottle = async () => {
    if (!selectedBottle) return; // Garde de sécurité
    
    try {
      const { error } = await supabase
        .from('bottle')
        .update({ status: 'gifted', position_id: null }) // Retirer de la position
        .eq('id', selectedBottle.id);
      
      if (error) throw error;
      
      setBottles(prev => prev.filter(b => b.id !== selectedBottle.id)); // MàJ état local
      setDialogOpen(false); // Fermer dialogue détails
      
      setNotification({ open: true, message: 'Bouteille marquée offerte', severity: 'success' });
    } catch (error: unknown) {
      console.error('Erreur statut offert:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur statut offert'}`,
        severity: 'error'
      });
    }
  };

  // Attribuer une étiquette personnalisée
  const handleSetLabel = async (labelId: string) => {
    if (!selectedBottle) return; // Garde de sécurité
    
    try {
      // Si on clique sur l'étiquette déjà active, on la retire (newLabel = null)
      const newLabel = selectedBottle.label === labelId ? null : labelId;
      
      const { error } = await supabase
        .from('bottle')
        .update({ label: newLabel })
        .eq('id', selectedBottle.id);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      const updatedBottle = { ...selectedBottle, label: newLabel };
      setBottles(prev => prev.map(b => b.id === selectedBottle.id ? updatedBottle : b));
      setSelectedBottle(updatedBottle); // Mettre à jour aussi la bouteille sélectionnée
      
      setLabelDialogOpen(false); // Fermer le dialogue d'étiquette
      setDialogOpen(true); // Ré-ouvrir le dialogue principal pour voir le changement
      
      setNotification({
        open: true,
        message: newLabel ? 'Étiquette ajoutée' : 'Étiquette retirée',
        severity: 'success'
      });
    } catch (error: unknown) {
      console.error('Erreur attribution étiquette:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur étiquette'}`,
        severity: 'error'
      });
    }
  };

  // Changer d'emplacement sélectionné
  const handleLocationChange = (location: StorageLocation) => {
    if (selectedLocation?.id !== location.id) { // Éviter rechargement si clic sur le même
      setSelectedLocation(location);
      if (fetchPositionsAndBottlesRef.current) {
        fetchPositionsAndBottlesRef.current(location.id, filters); // Appliquer les filtres courants
      }
    }
  };

  // Optimisation du placement
  const handleOptimizePlacement = async () => {
    if (!selectedLocation || bottles.length === 0) {
      setNotification({ open: true, message: 'Aucune bouteille à optimiser', severity: 'info' });
      return;
    }
    
    setNotification({ open: true, message: 'Optimisation en cours...', severity: 'info' });
    
    try {
      // 1. Récupérer toutes les positions disponibles pour l'emplacement sélectionné
      const availablePositions = positions
        .map(pos => ({ ...pos, row: pos.row_position, col: pos.column_position }))
        .sort((a, b) => a.row - b.row || a.col - b.col); // Trier par ligne puis colonne

      // 3. Grouper les bouteilles actuelles par couleur, puis région, puis trier par millésime
      const groupedBottles: Record<string, Record<string, Bottle[]>> = {};
      bottles.forEach(bottle => {
        const color = bottle.wine?.color || 'unknown';
        const region = bottle.wine?.region || 'unknown';
        if (!groupedBottles[color]) groupedBottles[color] = {};
        if (!groupedBottles[color][region]) groupedBottles[color][region] = [];
        groupedBottles[color][region].push(bottle);
      });

      Object.keys(groupedBottles).forEach(color => {
        Object.keys(groupedBottles[color]).forEach(region => {
          groupedBottles[color][region].sort((a, b) => (a.wine?.vintage || 9999) - (b.wine?.vintage || 9999));
        });
      });

      // 4. Aplatir les bouteilles triées dans l'ordre souhaité (ex: couleur, puis région, puis millésime)
      const sortedBottles: Bottle[] = [];
      const colorOrder = ['red', 'white', 'rose', 'sparkling', 'fortified', 'unknown']; // Ordre de placement
      colorOrder.forEach(color => {
        if (groupedBottles[color]) {
          Object.keys(groupedBottles[color]).sort().forEach(region => { // Trier les régions alphabétiquement
            sortedBottles.push(...groupedBottles[color][region]);
          });
        }
      });

      // 5. Associer chaque bouteille triée à la prochaine position disponible
      const updates: { id: string; position_id: string }[] = [];
      let positionIndex = 0;
      sortedBottles.forEach(bottle => {
        if (positionIndex < availablePositions.length) {
          const newPositionId = availablePositions[positionIndex].id;
          // Si la nouvelle position est différente de l'ancienne, on prépare la mise à jour
          if (bottle.position_id !== newPositionId) {
            updates.push({ id: bottle.id, position_id: newPositionId });
          }
          positionIndex++;
        } else {
           console.warn(`Plus de positions disponibles pour la bouteille ${bottle.id}`);
        }
      });
      
      if (updates.length > 0) {
        setNotification({ open: true, message: `Mise à jour de ${updates.length} positions...`, severity: 'info' });

        // Exécuter les mises à jour
        // Utilisation de Promise.all pour paralléliser légèrement
        const updatePromises = updates.map(update => 
            supabase.from('bottle').update({ position_id: update.position_id }).eq('id', update.id)
        );
        const results = await Promise.all(updatePromises);

        // Vérifier les erreurs potentielles des updates
        const errors = results.filter(result => result.error);
        if (errors.length > 0) {
            console.error("Erreurs lors de la mise à jour des positions:", errors);
            throw new Error(`Certaines mises à jour ont échoué (${errors.length}/${updates.length}).`);
        }
        
        // Rafraîchir l'affichage local après succès
        if (fetchPositionsAndBottlesRef.current) {
          await fetchPositionsAndBottlesRef.current(selectedLocation.id, filters); // Recharger avec filtres courants
        }
        
        setNotification({ open: true, message: `Placement optimisé (${updates.length} bouteilles déplacées)`, severity: 'success' });
      } else {
        setNotification({ open: true, message: 'Placement déjà optimal', severity: 'info' });
      }

    } catch (error: unknown) {
      console.error('Erreur optimisation:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur optimisation'}`,
        severity: 'error'
      });
    }
  };

  // Générer suggestions apéritif
  const handleAperitifSuggestions = () => {
    if (bottles.length === 0) {
      setNotification({ open: true, message: 'Aucune bouteille disponible', severity: 'info' });
      return;
    }
    
    const aperitifBottles = bottles.filter(bottle => {
      const wineColor = bottle.wine?.color;
      return wineColor === 'sparkling' || wineColor === 'white' || wineColor === 'rose';
    });

    if (aperitifBottles.length === 0) {
      setNotification({ open: true, message: 'Aucune bouteille adaptée trouvée', severity: 'info' });
      return;
    }

    // Trier : effervescent > blanc > rosé
    const sortedSuggestions = aperitifBottles.sort((a, b) => {
      const colorRank: Record<string, number> = { 'sparkling': 1, 'white': 2, 'rose': 3 };
      // Utiliser '' comme clé par défaut si color est undefined/null
      return (colorRank[a.wine?.color || ''] || 99) - (colorRank[b.wine?.color || ''] || 99);
    });

    const topSuggestions = sortedSuggestions.slice(0, 5); // Limiter à 5
    setAperitifSuggestions(topSuggestions);
    setAperitifDialogOpen(true);
    // Pas besoin de notification ici, le dialogue s'ouvre
 };

 // Gérer changement onglet
 const handleChangeTab = (_event: React.SyntheticEvent, newValue: number) => {
   setCurrentTab(newValue);
 };

 // Changer mode d'affichage
 const handleDisplayModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: string | null) => { 
   if (newMode !== null) { // Vérifier null car ToggleButtonGroup peut retourner null si on désélectionne
     setDisplayMode(newMode);
   }
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
     border: `1px solid ${theme.palette.divider}`, // Bordure plus subtile par défaut
     cursor: 'pointer',
     transition: 'all 0.2s ease-in-out',
     position: 'relative',
     width: bottleSize, // Appliquer la taille ici
     height: bottleSize,
     overflow: 'hidden' // Empêcher le contenu de déborder
   };

   if (!bottle || !bottle.wine) return { ...baseStyle, backgroundColor: theme.palette.action.hover }; // Style pour bouteille vide ou inconnue

   const colorKey = bottle.wine.color as keyof typeof serviceTemperatures;
   // Définir les couleurs de fond et texte
   const colorStyleMap: Record<string, { bg: string, text: string }> = {
      red: { bg: alpha('#8B0000', 0.9), text: '#fff' },
      white: { bg: alpha('#FFFACD', 0.9), text: '#000' }, // Slightly darker yellow
      rose: { bg: alpha('#FFC0CB', 0.9), text: '#000' }, // Standard pink
      sparkling: { bg: alpha('#ADD8E6', 0.9), text: '#000' }, // Light blue
      fortified: { bg: alpha('#A0522D', 0.9), text: '#fff' } // Sienna
   };
   const { bg, text } = colorStyleMap[colorKey] || { bg: alpha(theme.palette.grey[500], 0.9), text: '#fff' }; // Gris par défaut

   const finalStyle: React.CSSProperties = { ...baseStyle, backgroundColor: bg, color: text };

   // Appliquer styles spécifiques au mode d'affichage
   if (displayMode === 'labels' && bottle.label) {
     const labelInfo = customLabels.find(l => l.id === bottle.label);
     finalStyle.boxShadow = `0 0 0 3px ${labelInfo?.color || theme.palette.primary.main}`; // Anneau de couleur
     finalStyle.border = `1px solid ${theme.palette.divider}`; // Garder une bordure interne fine
   } else if (displayMode === 'temperature') {
     const tempInfo = serviceTemperatures[colorKey];
     finalStyle.border = `2px solid ${tempInfo?.color || theme.palette.divider}`; // Bordure épaisse avec couleur de température
   }
   
   // Ajouter l'effet de survol générique ici pour qu'il s'applique à tous les modes
   // Le style de survol est géré via sx prop dans renderPositionsGrid pour utiliser theme.palette
   
   return finalStyle;
 };

 // Render la grille de positions
 const renderPositionsGrid = () => {
    if (!selectedLocation) { // Vérifier juste selectedLocation
      return <Typography>Sélectionnez un emplacement.</Typography>; // Message plus clair
    }
    
    // Gérer le cas où les dimensions ne sont pas définies
    if (!selectedLocation.row_count || !selectedLocation.column_count) {
      return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight={200} textAlign="center">
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Cet emplacement ({selectedLocation.name}) n&apos;a pas de dimensions définies.
          </Typography>
          <Button 
             variant="outlined" 
             component={Link} 
             href={`/storage/edit?id=${selectedLocation.id}`} 
             sx={{ borderRadius: 2, mt: 1}}
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
         p: 2, 
         border: `1px solid ${theme.palette.divider}`,
         borderRadius: 2,
         overflowX: 'auto',
         overflowY: 'auto',
         maxHeight: 'calc(100vh - 250px)',
         backgroundColor: isDarkMode ? alpha(theme.palette.background.paper, 0.7) : alpha(theme.palette.grey[100], 0.7)
       }}
     >
       {/* Légende du mode d'affichage */}
       {displayMode === 'temperature' && (
         <Box mb={2} p={2} bgcolor={isDarkMode ? 'rgba(30,30,30,0.5)' : 'rgba(255,255,255,0.5)'} borderRadius={1} boxShadow={1}>
           <Typography variant="subtitle2" gutterBottom>Température de service recommandée:</Typography>
           <Grid container spacing={2}>
             {Object.entries(serviceTemperatures).map(([key, value]) => (
               <Grid key={key}>
                 <Box display="flex" alignItems="center">
                   <Box sx={{ 
                     width: 16, 
                     height: 16, 
                     borderRadius: '50%', 
                     bgcolor: value.color,
                     mr: 0.5
                   }} />
                   <Typography variant="caption">{value.label} ({value.range})</Typography>
                 </Box>
               </Grid>
             ))}
           </Grid>
         </Box>
       )}

       {displayMode === 'labels' && (
         <Box mb={2} p={2} bgcolor={isDarkMode ? 'rgba(30,30,30,0.5)' : 'rgba(255,255,255,0.5)'} borderRadius={1} boxShadow={1}>
           <Typography variant="subtitle2" gutterBottom>Étiquettes personnalisées:</Typography>
           <Grid container spacing={2}>
             {customLabels.map(label => (
               <Grid  key={label.id}>
                 <Box display="flex" alignItems="center">
                   <Box sx={{ 
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     width: 24, 
                     height: 24, 
                     borderRadius: '50%', 
                     bgcolor: label.color,
                     mr: 0.5
                   }}>
                     {React.cloneElement(label.icon, { sx: { fontSize: 16 } })}
                   </Box>
                   <Typography variant="caption">{label.label}</Typography>
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
           bgcolor={isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)'}
           borderRadius={1}
           boxShadow={3}
           zIndex={100}
           sx={{ backdropFilter: 'blur(5px)' }}
         >
           <Typography variant="subtitle2" fontWeight="bold">
             Position: {hoveredPositionInfo.row} / {hoveredPositionInfo.col}
           </Typography>
         </Box>
       )}

       <Box sx={{ maxWidth: containerMaxWidth, margin: '0 auto' }}>
         {/* Numéros de colonnes */}
         <Box display="flex" justifyContent="center" mb={1} ml={4}>
           {Array.from({ length: columnCount }, (_, index) => (
             <Box key={index} sx={{ width: cellSize, textAlign: 'center' }}>
               <Typography variant="caption" color="primary.main" fontWeight="bold">
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
               <Box key={index} sx={{ height: cellSize, display: 'flex', alignItems: 'center' }}>
                 <Typography variant="caption" color="primary.main" fontWeight="bold">
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
                         onClick={() => position && handlePositionClick(position)}
                         onMouseEnter={() => setHoveredPositionInfo({ row: rowIndex + 1, col: colIndex + 1 })}
                         onMouseLeave={() => setHoveredPositionInfo(null)}
                         sx={{
                           m: 0.2,
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
                             backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.5)' : 'rgba(245, 245, 245, 0.7)',
                             boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                             display: 'flex',
                             justifyContent: 'center',
                             alignItems: 'center',
                             cursor: 'pointer',
                             transition: 'all 0.2s ease',
                             '&:hover': {
                               boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2), 0 0 0 2px rgba(25, 118, 210, 0.3)',
                               transform: 'translateY(-2px)'
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
                                             width: 16, 
                                             height: 16, 
                                             borderRadius: '50%', 
                                             bgcolor: labelInfo.color,
                                             display: 'flex',
                                             alignItems: 'center',
                                             justifyContent: 'center',
                                             boxShadow: 1
                                           }}
                                         >
                                           {React.cloneElement(labelInfo.icon, { sx: { fontSize: 10 } })}
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
                                       width: 16, 
                                       height: 16, 
                                       borderRadius: '50%', 
                                       bgcolor: 'white',
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center',
                                       boxShadow: 1,
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
                                   fontSize: '0.7rem', 
                                   fontWeight: 'bold',
                                   lineHeight: 1,
                                   px: 0.5,
                                   maxWidth: '100%',
                                   overflow: 'hidden',
                                   textOverflow: 'ellipsis',
                                   whiteSpace: 'nowrap'
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
                                 backgroundColor: theme.palette.mode === 'dark' ? 'rgba(50, 50, 50, 0.5)' : 'rgba(0, 0, 0, 0.03)',
                                 color: theme.palette.text.secondary,
                                 cursor: 'pointer',
                                 transition: 'all 0.2s ease',
                                 '&:hover': {
                                   backgroundColor: theme.palette.mode === 'dark' ? 'rgba(70, 70, 70, 0.5)' : 'rgba(0, 0, 0, 0.1)',
                                   transform: 'scale(1.05)'
                                 }
                               }}
                             >
                               <Typography variant="body2" fontSize="0.7rem">Vide</Typography>
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
                             enterDelay={200}
                             leaveDelay={100}
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

 // Composant de fil d'Ariane
 const renderBreadcrumbs = () => (
   <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 3 }}>
     <Button component={Link} href="/" color="inherit" size="small" startIcon={<HomeIcon />}>Accueil</Button>
     <Typography color="text.primary">Emplacements</Typography>
   </Breadcrumbs>
);

 if (loading) {
   return (
     <>
       <Navbar />
       <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
         <Box display="flex" justifyContent="center" my={4}>
           <CircularProgress />
         </Box>
       </Container>
     </>
   );
 }

 return (
   <>
     <Navbar />
     <Container 
       sx={{ 
         width: '100%', 
         maxWidth: { 
           xs: '100%', 
           sm: '100%', 
           md: '98%', 
           lg: '1400px'
         }, 
         mt: 4, 
         mb: 6,
         px: { xs: 1, sm: 2, md: 3 }
       }}
     >
       {renderBreadcrumbs()}
       {/* Titre et actions principales */}
       <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
         <Typography variant="h4" component="h1" fontWeight="500">
           Mes Emplacements
         </Typography>
         <Box>
           {/* Boutons d'action */}
           <Button 
             variant="outlined" 
             startIcon={<SearchIcon />}
             sx={{ mr: 1, borderRadius: 2 }}
           >
             Rechercher
           </Button>
           
           <Button 
             variant="outlined" 
             startIcon={<FilterAltIcon />}
             sx={{ mr: 1, borderRadius: 2 }}
           >
             Filtrer
           </Button>
           
           <Button 
             variant="outlined"
             color="info"
             startIcon={<InventoryIcon />}
             component={Link}
             href="/storage/stock"
             sx={{ mr: 1, borderRadius: 2 }}
           >
             Stock
           </Button>
           
           <Button 
             variant="outlined" 
             color="info"
             startIcon={<QrCodeIcon />}
             component={Link}
             href="/generate-qr"
             sx={{ mr: 1, borderRadius: 2 }}
           >
             QR Codes
           </Button>
           
           <Button 
             variant="outlined" 
             color="secondary"
             startIcon={<LunchDiningIcon />}
             onClick={handleAperitifSuggestions}
             sx={{ mr: 1, borderRadius: 2 }}
           >
             Apéritif
           </Button>
           
           <Button 
             variant="outlined" 
             color="info"
             startIcon={<PieChartIcon />}
             component={Link}
             href="/insights"
             sx={{ mr: 1, borderRadius: 2 }}
           >
             Analyses
           </Button>
           
           <Button 
             variant="outlined" 
             color="info"
             startIcon={<AutoFixHighIcon />}
             onClick={handleOptimizePlacement}
             sx={{ mr: 1, borderRadius: 2 }}
           >
             Optimiser
           </Button>
           
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
       </Box>

       {/* Mode d'affichage */}
       <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
         <ToggleButtonGroup
           value={displayMode}
           exclusive
           onChange={handleDisplayModeChange}
           aria-label="mode d'affichage"
           size="small"
           sx={{ 
             bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
             borderRadius: 2,
             p: 0.5
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
               onChange={(e) => setInventoryMode(e.target.checked)} 
             />
           }
           label="Mode inventaire"
           sx={{ 
             bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
             borderRadius: 2,
             px: 2,
             py: 0.5
           }}
         />
       </Box>

       {locations.length === 0 ? (
         <Paper 
           elevation={0} 
           sx={{ 
             p: 2,
             border: `1px solid ${theme.palette.divider}`,
             borderRadius: 2,
             overflowX: 'auto',
             overflowY: 'auto',
             maxHeight: 'calc(100vh - 250px)',
             backgroundColor: isDarkMode ? alpha(theme.palette.background.paper, 0.7) : alpha(theme.palette.grey[100], 0.7)
           }}
         >
           <Typography variant="h6" color="text.secondary" gutterBottom>
             Aucun emplacement de stockage trouvé
           </Typography>
           <Typography variant="body1" color="text.secondary" paragraph>
             Commencez par ajouter votre premier emplacement pour organiser votre cave à vin.
           </Typography>
           <Button 
             variant="contained" 
             color="primary" 
             startIcon={<AddIcon />}
             component={Link}
             href="/storage/add"
             sx={{ mt: 2, borderRadius: 2 }}
           >
             Ajouter un emplacement
           </Button>
         </Paper>
       ) : (
         <Grid container spacing={2}>
           {/* Sélection d'emplacement - Colonne de gauche */}
           <Grid component="div" sx={{ width: { xs: '100%', md: '25%' } }}>

             <Paper 
               elevation={0} 
               sx={{ 
                 p: 3, 
                 height: '100%',
                 border: `1px solid ${theme.palette.divider}`,
                 borderRadius: 2,
                 bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
                 position: { md: 'sticky' },
                 top: { md: 16 }
               }}
             >
               <Typography variant="h6" gutterBottom color="primary">
                 Mes Emplacements
               </Typography>
               <Divider sx={{ mb: 2 }} />
               <Box sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
                 {locations.map((location) => {
                   const typeInfo = getTypeInfo(location.type);
                   const isSelected = selectedLocation?.id === location.id;
                   
                   return (
                     <Card 
                       key={location.id} 
                       elevation={0}
                       onClick={() => handleLocationChange(location)}
                       sx={{
                         mb: 2,
                         cursor: 'pointer',
                         border: isSelected 
                           ? `2px solid ${theme.palette.primary.main}` 
                           : `1px solid ${theme.palette.divider}`,
                         borderRadius: 2,
                         backgroundColor: isSelected 
                           ? theme.palette.mode === 'dark' 
                             ? alpha(theme.palette.primary.main, 0.15)
                             : alpha(theme.palette.primary.light, 0.15)
                           : 'transparent',
                         transition: 'all 0.2s',
                         '&:hover': {
                           backgroundColor: isSelected 
                           ? theme.palette.mode === 'dark' 
                           ? alpha(theme.palette.primary.main, 0.2)
                           : alpha(theme.palette.primary.light, 0.2)
                         : theme.palette.mode === 'dark' 
                           ? 'rgba(50, 50, 50, 0.5)' 
                           : 'rgba(242, 242, 242, 0.5)',
                       transform: 'translateY(-2px)',
                       boxShadow: 1
                     }
                   }}
                 >
                   <CardContent>
                     <Box display="flex" alignItems="center" justifyContent="space-between">
                       <Box display="flex" alignItems="center">
                         <Box sx={{ fontSize: '1.8rem', mr: 2 }}>{typeInfo.icon}</Box>
                         <Box>
                           <Typography variant="h6" component="div" sx={{ fontSize: '1rem' }}>
                             {location.name}
                           </Typography>
                           <Chip 
                             label={typeInfo.label} 
                             size="small" 
                             sx={{ 
                               backgroundColor: typeInfo.color, 
                               color: 'white', 
                               mt: 0.5,
                               fontWeight: 500,
                               fontSize: '0.7rem',
                               height: 20
                             }}
                           />
                         </Box>
                       </Box>
                       <Box>
                          <IconButton 
                            size="small" 
                            component={Link}
                            href={`/storage/edit?id=${location.id}`}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              '&:hover': {
                                color: theme.palette.primary.main,
                                bgcolor: isDarkMode ? 
                                  alpha(theme.palette.primary.main, 0.1) : 
                                  alpha(theme.palette.primary.light, 0.1)
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLocation(location.id, location.name);
                            }}
                            sx={{
                              '&:hover': {
                                bgcolor: isDarkMode ? 
                                  alpha(theme.palette.error.main, 0.1) : 
                                  alpha(theme.palette.error.light, 0.1)
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                        
                      {(location.row_count && location.column_count) && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Capacité: {location.row_count * location.column_count} bouteilles
                          <br />
                          {location.row_count} rangées × {location.column_count} colonnes
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                  );
                })}
                </Box>
              </Paper>
            </Grid>
            
            {/* Détails de l'emplacement - Colonne de droite */}
            <Grid component="div" sx={{ width: { xs: '100%', md: '75%' } }}>
              {selectedLocation ? (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h5" component="h2" color="primary">
                        {selectedLocation.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getTypeInfo(selectedLocation.type).label}
                      </Typography>
                    </Box>
                    <Box>
                      <Button 
                        startIcon={<EditIcon />}
                        component={Link}
                        href={`/storage/edit?id=${selectedLocation.id}`}
                        sx={{ borderRadius: 2 }}
                      >
                        Modifier
                      </Button>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  <Tabs 
                    value={currentTab} 
                    onChange={handleChangeTab}
                    sx={{ 
                      mb: 3,
                      '& .MuiTabs-indicator': {
                        backgroundColor: theme.palette.primary.main,
                        height: 3,
                        borderRadius: '3px 3px 0 0'
                      }
                    }}
                  >
                    <Tab label="Vue Graphique" />
                    <Tab label="Statistiques" />
                  </Tabs>
                  
                  {positionLoading ? (
                    <Box display="flex" justifyContent="center" my={4}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <>
                      {currentTab === 0 && (
                        <Box>
                          {renderPositionsGrid()}
                          
                          {(!selectedLocation.row_count || !selectedLocation.column_count) && (
                            <Box mt={2} textAlign="center">
                              <Button 
                                variant="outlined"
                                component={Link}
                                href={`/storage/edit?id=${selectedLocation.id}`}
                                sx={{ borderRadius: 2 }}
                              >
                                Définir les dimensions
                              </Button>
                            </Box>
                          )}
                        </Box>
                      )}
                      
                      {currentTab === 1 && (
                        <Box p={2}>
                          <Grid container spacing={3}>
                          <Grid component="div" sx={{ width: { xs: '100%', md: '33%' } }}>

                              <Paper 
                                elevation={0} 
                                sx={{ 
                                  p: 2, 
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 2,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  bgcolor: 'rgba(21, 101, 192, 0.08)'
                                }}
                              >
                                <Typography variant="h3" color="primary">
                                  {bottles.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Bouteilles placées
                                </Typography>
                              </Paper>
                            </Grid>
                            
                            <Grid component="div" sx={{ width: { xs: '100%', md: '33%' } }}>
                              <Paper 
                                elevation={0} 
                                sx={{ 
                                  p: 2, 
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 2,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  bgcolor: 'rgba(245, 124, 0, 0.08)'
                                }}
                              >
                                <Typography variant="h3" color="warning.main">
                                  {positions.length - bottles.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Emplacements vides
                                </Typography>
                              </Paper>
                            </Grid>
                            
                            <Grid component="div" sx={{ width: { xs: '100%', md: '33%' } }}>
                              <Paper 
                                elevation={0} 
                                sx={{ 
                                  p: 2, 
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 2,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  bgcolor: 'rgba(46, 125, 50, 0.08)'
                                }}
                              >
                                <Typography variant="h3" color="success.main">
                                  {positions.length ? Math.round((bottles.length / positions.length) * 100) : 0}%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Taux d&apos;occupation
                                </Typography>
                              </Paper>
                            </Grid>
                            
                            <Grid component="div" sx={{ width: { xs: '100%' } }}>
                              <Paper 
                                elevation={0} 
                                sx={{ 
                                  p: 2, 
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 2
                                }}
                              >
                                <Typography variant="h6" gutterBottom>
                                  Répartition par type de vin
                                </Typography>
                                <Box 
                                  sx={{ 
                                    display: 'flex',
                                    justifyContent: 'space-around',
                                    mt: 2
                                  }}
                                >
                                  {['red', 'white', 'rose', 'sparkling', 'fortified'].map(color => {
                                    const count = bottles.filter(b => b.wine?.color === color).length;
                                    const percentage = bottles.length ? Math.round((count / bottles.length) * 100) : 0;
                                    
                                    return (
                                      <Box key={color} sx={{ textAlign: 'center' }}>
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
                                            boxShadow: 2
                                          }}
                                        >
                                          {count}
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                          {color === 'red' ? 'Rouge' :
                                           color === 'white' ? 'Blanc' :
                                           color === 'rose' ? 'Rosé' :
                                           color === 'sparkling' ? 'Effervescent' :
                                           'Fortifié'}
                                        </Typography>
                                        <Typography variant="caption">
                                          {percentage}%
                                        </Typography>
                                      </Box>
                                    );
                                  })}
                                </Box>
                              </Paper>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </>
                  )}
                </Paper>
              ) : (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 6, 
                    height: '100%',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white'
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Sélectionnez un emplacement
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Choisissez un emplacement dans la liste à gauche pour visualiser son contenu
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        )}
      </Container>
      
      {/* Dialogue pour détails sur la bouteille existante */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: 400,
            bgcolor: isDarkMode ? '#1A1A1A' : 'white'
          }
        }}
      >
        {selectedBottle && (
          <>
            <DialogTitle sx={{ pb: 1, color: 'primary.main' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{selectedBottle.wine?.name}</Typography>
                {selectedBottle.wine?.vintage && (
                  <Chip 
                    label={selectedBottle.wine.vintage} 
                    size="small" 
                    color="primary"
                    sx={{ fontWeight: 'bold' }}
                  />
                )}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box mb={2}>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid component="div" sx={{ width: { xs: '50%'} }}>
                    <Typography variant="body2" color="text.secondary">Type:</Typography>
                    <Chip 
                      label={selectedBottle.wine?.color === 'red' ? 'Rouge' :
                            selectedBottle.wine?.color === 'white' ? 'Blanc' :
                            selectedBottle.wine?.color === 'rose' ? 'Rosé' :
                            selectedBottle.wine?.color === 'sparkling' ? 'Effervescent' :
                            'Fortifié'} 
                      size="small" 
                      sx={{ 
                        mt: 0.5,
                        backgroundColor: selectedBottle.wine?.color === 'red' ? 'rgba(139, 0, 0, 0.9)' :
                                         selectedBottle.wine?.color === 'white' ? 'rgba(245, 245, 220, 0.9)' :
                                         selectedBottle.wine?.color === 'rose' ? 'rgba(255, 182, 193, 0.9)' :
                                         selectedBottle.wine?.color === 'sparkling' ? 'rgba(176, 196, 222, 0.9)' :
                                         'rgba(139, 69, 19, 0.9)',
                        color: selectedBottle.wine?.color === 'red' || selectedBottle.wine?.color === 'fortified' ? 'white' : 'black',
                      }}
                    />
                  </Grid>
                  
                  {selectedBottle.wine?.domain && (
                    <Grid component="div" sx={{ width: { xs: '50%' } }}>
                      <Typography variant="body2" color="text.secondary">Domaine:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedBottle.wine.domain}
                      </Typography>
                    </Grid>
                  )}
                  
                  {selectedBottle.wine?.appellation && (
                <Grid component="div" sx={{ width: { xs: '50%'} }}>
                      <Typography variant="body2" color="text.secondary">Appellation:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedBottle.wine.appellation}
                      </Typography>
                    </Grid>
                  )}
                  
                  {selectedBottle.wine?.region && (
                <Grid component="div" sx={{ width: { xs: '50%'} }}>
                      <Typography variant="body2" color="text.secondary">Région:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedBottle.wine.region}
                      </Typography>
                    </Grid>
                  )}
                  
                  {selectedBottle.acquisition_date && (
                <Grid component="div" sx={{ width: { xs: '50%'} }}>
                      <Typography variant="body2" color="text.secondary">Acquise le:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {new Date(selectedBottle.acquisition_date).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Grid>
                  )}
                  
                  {selectedBottle.wine?.alcohol_percentage && (
                <Grid component="div" sx={{ width: { xs: '50%'} }}>
                      <Typography variant="body2" color="text.secondary">Degré:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedBottle.wine.alcohol_percentage}%
                      </Typography>
                    </Grid>
                  )}
                  
                  {selectedBottle.position && (
                <Grid component="div" sx={{ width: { xs: '50%'} }}>
                      <Typography variant="body2" color="text.secondary">Position:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        Rangée {selectedBottle.position.row_position}, Col {selectedBottle.position.column_position}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Actions
              </Typography>
              
              <Grid container spacing={1}>
              <Grid component="div" sx={{ width: { xs: '50%'} }}>
              <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<MenuBookIcon />}
                    component={Link}
                    href={`/wines/${selectedBottle.wine_id}`}
                    onClick={() => setDialogOpen(false)}
                    sx={{ borderRadius: 2 }}
                  >
                    Fiche vin
                  </Button>
                </Grid>
                
                <Grid component="div" sx={{ width: { xs: '50%'} }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FavoriteIcon />}
                    onClick={() => {
                      setDialogOpen(false);
                      setLabelDialogOpen(true);
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Étiquette
                  </Button>
                </Grid>
                
                <Grid component="div" sx={{ width: { xs: '50%'} }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    startIcon={<RestaurantIcon />}
                    onClick={() => {
                      setDialogOpen(false);
                      setConsumeBottleDialogOpen(true);
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Consommée
                  </Button>
                </Grid>
                
                <Grid component="div" sx={{ width: { xs: '50%'} }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="warning"
                    startIcon={<CardGiftcardIcon />}
                    onClick={handleGiftBottle}
                    sx={{ borderRadius: 2 }}
                  >
                    Offerte
                  </Button>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button 
                onClick={() => setDialogOpen(false)} 
                sx={{ borderRadius: 2 }}
              >
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialogue pour consommer une bouteille */}
      <Dialog
        open={consumeBottleDialogOpen}
        onClose={() => setConsumeBottleDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: 500,
            bgcolor: isDarkMode ? '#1A1A1A' : 'white'
          }
        }}
      >
        <DialogTitle color="secondary">
          Marquer comme consommée
        </DialogTitle>
        <DialogContent>
          <Box mt={1}>
            <Typography variant="body1" gutterBottom>
              {selectedBottle?.wine?.name} {selectedBottle?.wine?.vintage || ''}
            </Typography>
            
            <Box my={2}>
              <TextField
                fullWidth
                label="Date de consommation"
                type="date"
                value={consumeData.consumption_date ? 
                  new Date(consumeData.consumption_date).toISOString().split('T')[0] : 
                  new Date().toISOString().split('T')[0]
                }
                onChange={(e) => setConsumeData({
                  ...consumeData,
                  consumption_date: new Date(e.target.value)
                })}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Notes de dégustation"
                multiline
                rows={4}
                value={consumeData.tasting_note || ''}
                onChange={(e) => setConsumeData({
                  ...consumeData,
                  tasting_note: e.target.value
                })}
                placeholder="Vos impressions, arômes, saveurs, accords réussis..."
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setConsumeBottleDialogOpen(false)} 
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleConsumeBottle} 
            variant="contained" 
            color="secondary"
            sx={{ borderRadius: 2 }}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue pour ajouter une étiquette personnalisée */}
      <Dialog
        open={labelDialogOpen}
        onClose={() => setLabelDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: 400,
            bgcolor: isDarkMode ? '#1A1A1A' : 'white'
          }
        }}
      >
        <DialogTitle>
          Étiquettes personnalisées
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Sélectionnez une étiquette pour cette bouteille:
          </Typography>
          
          <Grid container spacing={2}>
            {customLabels.map(label => (
              <Grid component="div" key={label.id} sx={{ width: { xs: '50%'} }}>

                <Button
                  fullWidth
                  variant={selectedBottle?.label === label.id ? "contained" : "outlined"}
                  startIcon={label.icon}
                  onClick={() => handleSetLabel(label.id)}
                  sx={{ 
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: selectedBottle?.label === label.id ? label.color : 'transparent',
                    borderColor: label.color,
                    color: selectedBottle?.label === label.id ? 'white' : label.color,
                    '&:hover': {
                      bgcolor: selectedBottle?.label === label.id 
                        ? label.color 
                        : `${label.color}22`
                    }
                  }}
                >
                  {label.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setLabelDialogOpen(false)} 
            sx={{ borderRadius: 2 }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue pour les suggestions d'apéritif */}
      <Dialog
        open={aperitifDialogOpen}
        onClose={() => setAperitifDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Suggestions pour l&apos;apéritif</Typography>
            <IconButton onClick={() => setAperitifDialogOpen(false)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {aperitifSuggestions.length > 0 ? (
            <List>
              {aperitifSuggestions.map((bottle) => (
                <ListItem 
                  key={bottle.id}
                  component={Button}
                  href={`/wines/${bottle.wine_id}`}
                  sx={{ 
                    display: 'block',
                    textAlign: 'left',
                    mb: 1, 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 2
                  }}
                >
                  <Typography variant="subtitle1">
                    {bottle.wine?.name} {bottle.wine?.vintage && `(${bottle.wine.vintage})`}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={0.5}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: bottle.wine?.color === 'sparkling' ? '#B0C4DE' : 
                                bottle.wine?.color === 'white' ? '#F5F5DC' : '#FFB6C1',
                        mr: 1
                      }} 
                    />
                    <Typography variant="body2" color="text.secondary">
                      {bottle.wine?.color === 'sparkling' ? 'Effervescent' : 
                      bottle.wine?.color === 'white' ? 'Blanc' : 'Rosé'}
                      {bottle.wine?.domain && ` • ${bottle.wine.domain}`}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              Aucune suggestion disponible. Ajoutez plus de bouteilles à votre cave !
            </Alert>
          )}
          
          <Box mt={2} p={2} bgcolor={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'} borderRadius={2}>
            <Typography variant="subtitle2" color="primary.main" gutterBottom>Comment sont sélectionnées les suggestions ?</Typography>
            <Typography variant="body2">
              Les vins sont sélectionnés selon leur pertinence pour l&apos;apéritif :
            </Typography>
            <Box component="ol" sx={{ pl: 2, mt: 1 }}>
              <li>Vins effervescents (prioritaires)</li>
              <li>Vins blancs secs</li>
              <li>Vins rosés</li>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setAperitifDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue amélioré d'ajout de bouteille */}
      {selectedPosition && (
        <AddBottleDialog
          open={addBottleDialogOpen}
          onClose={() => setAddBottleDialogOpen(false)}
          position={selectedPosition}
          onBottleAdded={() => {
            // Rafraîchir les bouteilles après ajout
            if (selectedLocation && fetchPositionsAndBottlesRef.current) {
              fetchPositionsAndBottlesRef.current(selectedLocation.id);
            }
          }}
          apiKey={apiKey}
        />
      )}
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          variant="filled"
          sx={{ borderRadius: 2, boxShadow: 3 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}