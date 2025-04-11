'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, Button, TextField, 
  Rating, Slider, FormControlLabel, Switch, 
  FormControl, InputLabel, Select, MenuItem,
  Chip, Divider, IconButton, Collapse,
  CircularProgress, Alert, Snackbar, Tooltip
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SpaIcon from '@mui/icons-material/Spa';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import ForestIcon from '@mui/icons-material/Forest';
import GrainIcon from '@mui/icons-material/Grain';
import PetsIcon from '@mui/icons-material/Pets';
import LiquorIcon from '@mui/icons-material/Liquor';
import OpacityIcon from '@mui/icons-material/Opacity';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SaveIcon from '@mui/icons-material/Save';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import WineBarIcon from '@mui/icons-material/WineBar';
import WineColorPicker from '../components/WineColorPicker';
import AromaWheel from '../components/AromaWheel';
import { useTheme } from '@mui/material/styles';
import { supabase } from '../utils/supabase';

// Objet de référence pour les arômes spécifiques selon le type de vin
const aromasByWineType = {
  red: {
    fruit: ['Cerise', 'Fraise', 'Framboise', 'Mûre', 'Cassis', 'Prune', 'Figue', 'Grenade'],
    floral: ['Violette', 'Rose', 'Pivoine', 'Lavande'],
    spice: ['Poivre', 'Réglisse', 'Cannelle', 'Clou de girofle', 'Muscade'],
    woody: ['Cèdre', 'Santal', 'Tabac', 'Vanille', 'Chêne', 'Fumé', 'Toasté'],
    animal: ['Cuir', 'Musc', 'Fourrure', 'Gibier'],
    vegetal: ['Poivron', 'Truffe', 'Sous-bois', 'Champignon', 'Humus', 'Eucalyptus'],
    mineral: ['Pierre à fusil', 'Graphite', 'Craie', 'Ardoise']
  },
  white: {
    fruit: ['Citron', 'Pamplemousse', 'Pomme verte', 'Poire', 'Pêche', 'Abricot', 'Mangue', 'Ananas', 'Litchi', 'Melon'],
    floral: ['Acacia', 'Tilleul', 'Fleur d\'oranger', 'Aubépine', 'Chèvrefeuille', 'Jasmin'],
    spice: ['Gingembre', 'Safran', 'Anis', 'Fenouil', 'Cardamome'],
    woody: ['Amande', 'Noisette', 'Vanille', 'Beurre', 'Brioche', 'Pain grillé'],
    vegetal: ['Fougère', 'Herbe fraîche', 'Asperge', 'Foin coupé', 'Buis'],
    mineral: ['Silex', 'Pierre à fusil', 'Iode', 'Craie', 'Pétrole'],
    other: ['Miel', 'Cire d\'abeille', 'Agrumes confits']
  },
  rose: {
    fruit: ['Fraise', 'Framboise', 'Groseille', 'Pamplemousse', 'Pêche', 'Melon', 'Cerise'],
    floral: ['Rose', 'Pivoine', 'Jasmin', 'Fleur d\'oranger'],
    spice: ['Poivre blanc', 'Gingembre', 'Cannelle'],
    vegetal: ['Herbe fraîche', 'Garrigue', 'Fenouil'],
    mineral: ['Pierre', 'Salin'],
    other: ['Bonbon anglais', 'Pétale de rose']
  },
  orange: {
    fruit: ['Abricot sec', 'Orange', 'Mandarine', 'Kumquat', 'Coing'],
    floral: ['Camomille', 'Fleur de sureau', 'Thé'],
    spice: ['Gingembre', 'Curry', 'Curcuma', 'Safran'],
    woody: ['Noix', 'Noisette', 'Amande', 'Pin'],
    other: ['Miel', 'Oxydatif', 'Écorce d\'agrumes']
  },
  sparkling: {
    fruit: ['Pomme verte', 'Citron', 'Poire', 'Pêche blanche', 'Fraise'],
    floral: ['Fleur d\'acacia', 'Fleur blanche'],
    woody: ['Brioche', 'Biscuit', 'Viennoiserie', 'Pain grillé', 'Levure'],
    other: ['Levure', 'Beurre', 'Noisette', 'Amande']
  }
};

// Fonction utilitaire pour déterminer le type principal de vin à partir de la couleur
const getMainWineTypeFromColor = (colorId) => {
  if (!colorId) return null;

  if (['purple', 'ruby', 'garnet', 'tawny', 'mahogany'].includes(colorId)) {
    return 'red';
  } else if (['pale_yellow', 'straw_yellow', 'gold', 'amber', 'brown'].includes(colorId)) {
    return 'white';
  } else if (['pale_pink', 'salmon', 'raspberry', 'coral'].includes(colorId)) {
    return 'rose';
  } else if (['pale_orange', 'medium_orange', 'deep_orange', 'amber_orange'].includes(colorId)) {
    return 'orange';
  } else if (['pale_sparkling', 'straw_sparkling', 'rose_sparkling', 'amber_sparkling'].includes(colorId)) {
    return 'sparkling';
  }
  return null;
};

// Fonction pour obtenir la couleur d'affichage du vin (pour les badges)
const getWineDisplayColor = (wineColor) => {
  switch (wineColor) {
    case 'red':
      return '#8B0000';
    case 'white':
      return '#F5F5DC';
    case 'rose':
      return '#F8BBD0';
    case 'orange':
      return '#FF8C00';
    default:
      return '#81D4FA';
  }
};

const TastingForm = ({ initialData = null, onSubmit, onCancel }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [cellarWines, setCellarWines] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // États pour les sections développables
  const [expandedSections, setExpandedSections] = useState({
    visual: true,
    nose: true,
    palate: true,
    pairing: true,
    overall: true
  });

  // État du formulaire
  const [formData, setFormData] = useState({
    wine_id: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    occasion: '',
    with_who: '',
    serving_temperature: '',
    aeration_time: '',
    color: '',
    color_intensity: 3,
    clarity: 4,
    tears: 3,
    nose_intensity: 4,
    aroma_families: [],
    specific_aromas: '',
    attack: 4,
    acidity: 3,
    tannin: 4,
    alcohol: 3,
    body: 4,
    length: 7,
    food_pairing: '',
    pairing_rating: 3,
    overall_rating: 4,
    is_favorite: false,
    comments: '',
    evolution_phase: 'peak'
  });

  // État pour le vin externe (si le vin n'est pas en cave)
  const [externalWine, setExternalWine] = useState({
    name: '',
    vintage: '',
    type: 'red'
  });

  // État pour les suggestions d'arômes
  const [suggestedAromas, setSuggestedAromas] = useState([]);
  const [selectedAromas, setSelectedAromas] = useState([]);
  const [blindMode, setBlindMode] = useState(false);

  // Détermine le type de vin à partir de la couleur sélectionnée
  const currentWineType = getMainWineTypeFromColor(formData.color);

  // Chargement initial des données et des vins
  useEffect(() => {
    fetchWines();

    if (initialData) {
      // Utilisation d'une mise à jour fonctionnelle pour éviter d'utiliser formData obsolète
      setFormData(prev => ({ ...prev, ...initialData }));

      if (initialData.specific_aromas) {
        setSelectedAromas(initialData.specific_aromas.split(',').map(a => a.trim()));
      }
    }
  }, [initialData]);

  // Mise à jour des suggestions d'arômes lorsque le type de vin change
  useEffect(() => {
    if (currentWineType) {
      const allSuggestions = [];
      Object.values(aromasByWineType[currentWineType]).forEach(category => {
        category.forEach(aroma => {
          if (!allSuggestions.includes(aroma)) {
            allSuggestions.push(aroma);
          }
        });
      });
      setSuggestedAromas(allSuggestions);
    }
  }, [currentWineType]);

  // Récupérer les vins de la cave
  const fetchWines = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data: winesData, error: winesError } = await supabase
        .from('bottle')
        .select(`
          id, wine_id, status,
          wine:wine_id ( id, name, vintage, color, domain, region, appellation )
        `)
        .eq('user_id', authData.user.id)
        .eq('status', 'in_stock')
        .order('wine_id');

      if (winesError) throw winesError;

      const uniqueWines = [];
      const wineIds = new Set();
      winesData?.forEach(bottle => {
        if (bottle.wine && !wineIds.has(bottle.wine.id)) {
          uniqueWines.push(bottle);
          wineIds.add(bottle.wine.id);
        }
      });

      setCellarWines(uniqueWines || []);
    } catch (error) {
      console.error('Erreur lors du chargement des vins:', error);
    }
  };

  // Mise à jour du formulaire
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Ajoute ou retire une famille d'arômes
  const handleAromaFamilyToggle = (family) => {
    if (formData.aroma_families.includes(family)) {
      handleChange('aroma_families', formData.aroma_families.filter(f => f !== family));
    } else {
      handleChange('aroma_families', [...formData.aroma_families, family]);
    }
  };

  // Gestion des arômes spécifiques
  const handleAddAroma = (aroma) => {
    if (!selectedAromas.includes(aroma)) {
      const newAromas = [...selectedAromas, aroma];
      setSelectedAromas(newAromas);
      handleChange('specific_aromas', newAromas.join(', '));
    }
  };

  const handleRemoveAroma = (aroma) => {
    const newAromas = selectedAromas.filter(a => a !== aroma);
    setSelectedAromas(newAromas);
    handleChange('specific_aromas', newAromas.join(', '));
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!formData.wine_id && formData.wine_id !== 'external') {
      setNotification({
        open: true,
        message: 'Veuillez sélectionner un vin',
        severity: 'error'
      });
      return;
    }

    if (formData.wine_id === 'external' && !externalWine.name) {
      setNotification({
        open: true,
        message: 'Veuillez saisir le nom du vin externe',
        severity: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      const finalData = {
        ...formData,
        wine_external: formData.wine_id === 'external' ? externalWine : null,
        specific_aromas: selectedAromas.join(', ')
      };

      await onSubmit(finalData);

      setNotification({
        open: true,
        message: 'Note de dégustation enregistrée avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la dégustation:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Détermine si une section doit être affichée selon le type de vin
  const shouldShowSection = (section) => {
    if (!currentWineType) return true;

    switch (section) {
      case 'tannin':
        return ['red', 'orange'].includes(currentWineType);
      case 'acidity':
        return true;
      case 'sweetness':
        return ['white', 'sparkling', 'orange'].includes(currentWineType);
      default:
        return true;
    }
  };

  // Permet d'expand/replier une section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Box>
      {/* Informations générales */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" gutterBottom fontWeight={500}>
            Informations générales
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="wine-select-label">Vin</InputLabel>
              <Select
                labelId="wine-select-label"
                value={formData.wine_id}
                label="Vin"
                onChange={(e) => handleChange('wine_id', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                renderValue={(selected) => {
                  if (selected === 'external') return 'Vin externe';
                  const wine = cellarWines.find(b => b.wine?.id === selected)?.wine;
                  if (!wine) return 'Sélectionnez un vin';
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: '50%', 
                          bgcolor: getWineDisplayColor(wine.color),
                          mr: 1 
                        }} 
                      />
                      {wine.name} {wine.vintage && `(${wine.vintage})`}
                    </Box>
                  );
                }}
              >
                {cellarWines.map((bottle) => (
                  bottle.wine && (
                    <MenuItem key={bottle.wine.id} value={bottle.wine.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 16, 
                            height: 16, 
                            borderRadius: '50%', 
                            bgcolor: getWineDisplayColor(bottle.wine.color),
                            mr: 1 
                          }} 
                        />
                        {bottle.wine.name} {bottle.wine.vintage && `(${bottle.wine.vintage})`}
                      </Box>
                    </MenuItem>
                  )
                ))}
                <MenuItem value="external">Vin externe</MenuItem>
              </Select>
            </FormControl>

            {formData.wine_id === 'external' && (
              <>
                <TextField
                  fullWidth
                  label="Nom du vin"
                  placeholder="Saisissez le nom du vin"
                  value={externalWine.name}
                  onChange={(e) => setExternalWine(prev => ({ ...prev, name: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="Millésime"
                  placeholder="Ex : 2020"
                  value={externalWine.vintage}
                  onChange={(e) => setExternalWine(prev => ({ ...prev, vintage: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <FormControl fullWidth>
                  <InputLabel id="external-wine-type-label">Type de vin</InputLabel>
                  <Select
                    labelId="external-wine-type-label"
                    value={externalWine.type}
                    label="Type de vin"
                    onChange={(e) => setExternalWine(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <MenuItem value="red">Rouge</MenuItem>
                    <MenuItem value="white">Blanc</MenuItem>
                    <MenuItem value="rose">Rosé</MenuItem>
                    <MenuItem value="orange">Orange</MenuItem>
                    <MenuItem value="sparkling">Effervescent</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            <FormControlLabel
              control={
                <Switch 
                  checked={blindMode}
                  onChange={() => setBlindMode(!blindMode)}
                />
              }
              label="Dégustation à l'aveugle"
            />

            <TextField
              fullWidth
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              InputProps={{ startAdornment: <CalendarMonthIcon sx={{ color: 'text.secondary', mr: 1 }} /> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Lieu"
              placeholder="Domicile, Restaurant..."
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              InputProps={{ startAdornment: <LocationOnIcon sx={{ color: 'text.secondary', mr: 1 }} /> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Avec qui"
              placeholder="Famille, Amis..."
              value={formData.with_who}
              onChange={(e) => handleChange('with_who', e.target.value)}
              InputProps={{ startAdornment: <PersonIcon sx={{ color: 'text.secondary', mr: 1 }} /> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Occasion"
              placeholder="Dîner, Pique-nique, Fête…"
              value={formData.occasion}
              onChange={(e) => handleChange('occasion', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Conditions de service
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Température"
                  placeholder="°C"
                  value={formData.serving_temperature}
                  onChange={(e) => handleChange('serving_temperature', e.target.value)}
                  InputProps={{ startAdornment: <ThermostatIcon sx={{ color: 'text.secondary', mr: 1 }} /> }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Aération"
                  placeholder="Minutes"
                  value={formData.aeration_time}
                  onChange={(e) => handleChange('aeration_time', e.target.value)}
                  InputProps={{ startAdornment: <HourglassEmptyIcon sx={{ color: 'text.secondary', mr: 1 }} /> }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Formulaire détaillé */}
        <Grid item xs={12} md={8}>
          {/* Aspect visuel */}
          <Paper 
            elevation={0}
            sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
          >
            <Box 
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', py: 1 }}
              onClick={() => toggleSection('visual')}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <VisibilityIcon sx={{ mr: 1 }} /> Aspect visuel
              </Typography>
              <IconButton size="small">
                {expandedSections.visual ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={expandedSections.visual}>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Couleur
                  </Typography>
                  <WineColorPicker 
                    value={formData.color}
                    onChange={(value) => handleChange('color', value)}
                  />
                  <Box sx={{ mb: 3, mt: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Intensité de la robe
                    </Typography>
                    <Slider
                      value={formData.color_intensity}
                      onChange={(_, value) => handleChange('color_intensity', value)}
                      step={1}
                      marks
                      min={1}
                      max={5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Limpidité
                    </Typography>
                    <Slider
                      value={formData.clarity}
                      onChange={(_, value) => handleChange('clarity', value)}
                      step={1}
                      marks
                      min={1}
                      max={5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Larmes / Jambes
                    </Typography>
                    <Slider
                      value={formData.tears}
                      onChange={(_, value) => handleChange('tears', value)}
                      step={1}
                      marks
                      min={1}
                      max={5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Collapse>
          </Paper>

          {/* Évaluation olfactive */}
          <Paper 
            elevation={0}
            sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
          >
            <Box 
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', py: 1 }}
              onClick={() => toggleSection('nose')}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <SpaIcon sx={{ mr: 1 }} /> Nez
              </Typography>
              <IconButton size="small">
                {expandedSections.nose ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={expandedSections.nose}>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Intensité aromatique
                    </Typography>
                    <Slider
                      value={formData.nose_intensity}
                      onChange={(_, value) => handleChange('nose_intensity', value)}
                      step={1}
                      marks
                      min={1}
                      max={5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Familles d'arômes dominants
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {[
                      { value: 'fruity', label: 'Fruité', icon: <SpaIcon /> },
                      { value: 'floral', label: 'Floral', icon: <LocalFloristIcon /> },
                      { value: 'woody', label: 'Boisé', icon: <ForestIcon /> },
                      { value: 'spicy', label: 'Épicé', icon: <GrainIcon /> },
                      { value: 'animal', label: 'Animal', icon: <PetsIcon /> },
                      { value: 'mineral', label: 'Minéral', icon: <OpacityIcon /> }
                    ].map((aroma) => (
                      <Chip
                        key={aroma.value}
                        label={aroma.label}
                        icon={aroma.icon}
                        variant={formData.aroma_families.includes(aroma.value) ? "filled" : "outlined"}
                        onClick={() => handleAromaFamilyToggle(aroma.value)}
                        sx={{ borderRadius: 2, mb: 1 }}
                      />
                    ))}
                  </Box>
                  <AromaWheel
                    wineType={currentWineType || externalWine.type || 'red'}
                    selectedAromas={selectedAromas}
                    onChange={(aromas) => {
                      setSelectedAromas(aromas);
                      handleChange('specific_aromas', aromas.join(', '));
                    }}
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Paper>

          {/* Évaluation gustative */}
          <Paper 
            elevation={0}
            sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
          >
            <Box 
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', py: 1 }}
              onClick={() => toggleSection('palate')}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <LiquorIcon sx={{ mr: 1 }} /> Bouche
              </Typography>
              <IconButton size="small">
                {expandedSections.palate ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={expandedSections.palate}>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Attaque (molle ←→ franche)
                    </Typography>
                    <Slider
                      value={formData.attack}
                      onChange={(_, value) => handleChange('attack', value)}
                      step={1}
                      marks
                      min={1}
                      max={5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Acide (acide ←→ rond)
                    </Typography>
                    <Slider
                      value={formData.acidity}
                      onChange={(_, value) => handleChange('acidity', value)}
                      step={1}
                      marks
                      min={1}
                      max={5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  {shouldShowSection('tannin') && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" gutterBottom>
                        Tanins (souples ←→ marqués)
                      </Typography>
                      <Slider
                        value={formData.tannin}
                        onChange={(_, value) => handleChange('tannin', value)}
                        step={1}
                        marks
                        min={1}
                        max={5}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Alcool (léger ←→ puissant)
                    </Typography>
                    <Slider
                      value={formData.alcohol}
                      onChange={(_, value) => handleChange('alcohol', value)}
                      step={1}
                      marks
                      min={1}
                      max={5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Corps (léger ←→ onctueux)
                    </Typography>
                    <Slider
                      value={formData.body}
                      onChange={(_, value) => handleChange('body', value)}
                      step={1}
                      marks
                      min={1}
                      max={5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Longueur en bouche (1 à 10 sec)
                    </Typography>
                    <Slider
                      value={formData.length}
                      onChange={(_, value) => handleChange('length', value)}
                      step={1}
                      marks
                      min={1}
                      max={10}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Collapse>
          </Paper>

          {/* Accords mets & vins */}
          <Paper 
            elevation={0}
            sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
          >
            <Box 
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', py: 1 }}
              onClick={() => toggleSection('pairing')}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <WineBarIcon sx={{ mr: 1 }} /> Accords mets & vins
              </Typography>
              <IconButton size="small">
                {expandedSections.pairing ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={expandedSections.pairing}>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Plat dégusté"
                    placeholder="Ex : Entrecôte grillée, Risotto aux champignons..."
                    value={formData.food_pairing}
                    onChange={(e) => handleChange('food_pairing', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Qualité de l'accord
                    </Typography>
                    <Rating
                      value={formData.pairing_rating}
                      onChange={(_, value) => handleChange('pairing_rating', value)}
                      precision={0.5}
                    />
                  </Box>
                </Grid>
                {currentWineType && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <TipsAndUpdatesIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Suggestion : Recherchez des accords pour ce vin dans la section "Accords mets-vins"
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Collapse>
          </Paper>

          {/* Appréciation globale */}
          <Paper 
            elevation={0}
            sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
          >
            <Box 
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', py: 1 }}
              onClick={() => toggleSection('overall')}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <BookmarkIcon sx={{ mr: 1 }} /> Appréciation globale
              </Typography>
              <IconButton size="small">
                {expandedSections.overall ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={expandedSections.overall}>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2">
                      Note personnelle
                    </Typography>
                    <Rating
                      value={formData.overall_rating}
                      onChange={(_, value) => handleChange('overall_rating', value)}
                      precision={0.5}
                      size="large"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_favorite}
                        onChange={(e) => handleChange('is_favorite', e.target.checked)}
                      />
                    }
                    label="Coup de cœur"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="evolution-phase-label">Phase d'évolution</InputLabel>
                    <Select
                      labelId="evolution-phase-label"
                      value={formData.evolution_phase}
                      label="Phase d'évolution"
                      onChange={(e) => handleChange('evolution_phase', e.target.value)}
                    >
                      <MenuItem value="youth">Jeunesse - À attendre</MenuItem>
                      <MenuItem value="development">Développement - En progression</MenuItem>
                      <MenuItem value="peak">Apogée - Prêt à boire maintenant</MenuItem>
                      <MenuItem value="decline">Déclin - À consommer rapidement</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Commentaires"
                    placeholder="Vos impressions générales sur ce vin..."
                    value={formData.comments}
                    onChange={(e) => handleChange('comments', e.target.value)}
                    multiline
                    rows={3}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Paper>

          {/* Boutons d'action */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{ borderRadius: 2 }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ borderRadius: 2 }}
            >
              Enregistrer la dégustation
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Notifications */}
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
          sx={{ borderRadius: 2 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TastingForm;
