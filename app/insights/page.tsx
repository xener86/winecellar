'use client';

// Correction 1: Importer useCallback
import React, { useState, useEffect, useCallback } from 'react'; 
import { 
  Container, Typography, Box, Grid, Paper, Button, CircularProgress, 
  Tabs, Tab, 
  Chip,
  IconButton, Alert, Snackbar, Badge, Tooltip, List, ListItem,
  ListItemText, ListItemIcon, ListItemSecondaryAction
} from '@mui/material';
// Correction 1: useRouter doit être importé depuis 'next/navigation' pour App Router ('use client')
import { useRouter } from 'next/navigation'; 
import { alpha } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AlarmIcon from '@mui/icons-material/Alarm';
import WineBarIcon from '@mui/icons-material/WineBar';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PieChartIcon from '@mui/icons-material/PieChart';
import CelebrationIcon from '@mui/icons-material/Celebration';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { supabase } from '../utils/supabase';

// Import des composants de graphiques
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend
} from 'recharts';

// Types
type Wine = {
  id: string;
  name: string;
  color: string;
  vintage: number | null;
  domain: string | null;
  region: string | null;
  appellation: string | null;
  alcohol_percentage: number | null;
  notes: string | null;
};

type Bottle = {
  id: string;
  wine_id: string;
  position_id: string | null;
  status: string;
  acquisition_date: string | null;
  label: string | null;
  wine?: Wine; // Wine can be optional if join fails or not selected
};

// Update MaturityAlert to handle optional wine
type MaturityAlert = {
  id: string;
  wine_id: string;
  status: 'peak' | 'approaching' | 'past';
  created_at: string;
  read: boolean;
  wine?: Partial<Wine>; // Make wine optional and partial
  bottle_count?: number;
};


import { useTheme } from '@mui/material/styles';

export default function InsightsPage() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [maturityAlerts, setMaturityAlerts] = useState<MaturityAlert[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info'
  });

  // Couleurs pour les graphiques
  const COLORS = {
    red: '#B71C1C',
    white: '#FFF59D',
    rose: '#F8BBD0',
    sparkling: '#B3E5FC',
    fortified: '#8D6E63'
  };

  // Correction 1: Définir fetchData avec useCallback
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      // Vérifier l'authentification
      const { data: { user }, error: userError } = await supabase.auth.getUser(); // Destructure user directly
      if (userError || !user) {
        console.error('Auth error or no user:', userError);
        router.push('/login');
        return;
      }

      // Récupérer les bouteilles et leurs vins associés
      const { data: bottlesData, error: bottlesError } = await supabase
        .from('bottle')
        .select(`
          id, 
          wine_id, 
          position_id, 
          status, 
          acquisition_date,
          label,
          wine:wine_id (
            id, 
            name, 
            color, 
            vintage, 
            domain,
            region,
            appellation,
            alcohol_percentage,
            notes
          )
        `)
        .eq('status', 'in_stock')
        .eq('user_id', user.id); // Use user.id safely

      if (bottlesError) throw bottlesError;
      // Ensure wine is always an object, even if null from the query
      setBottles(
         (bottlesData || []).map(bottle => ({
           ...bottle,
           wine: bottle.wine || undefined // Handle null wine relation
         }))
       );


      // Récupérer les alertes de maturité
      const { data: alertsData, error: alertsError } = await supabase
        .from('maturity_alerts')
        .select(`
          id,
          wine_id,
          status,
          created_at,
          read,
          wine:wine_id (
            id, 
            name, 
            color, 
            vintage, 
            domain,
            region,
            appellation
          )
        `)
        .eq('user_id', user.id) // Use user.id safely
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;
      
      // Pour chaque alerte, compter le nombre de bouteilles concernées
      const currentBottlesData = bottlesData || []; // Use fetched bottles data
      const alertsWithBottleCounts = alertsData?.map(alert => {
          const bottleCount = currentBottlesData.filter(b => b.wine_id === alert.wine_id).length || 0;
          return {
            ...alert,
            bottle_count: bottleCount,
            // Ensure wine is an object, even if the join resulted in null/undefined
            wine: alert.wine || undefined 
          };
        }) || [];
      
      setMaturityAlerts(alertsWithBottleCounts as MaturityAlert[]); // Assert type after processing
      
      // Compter les alertes non lues
      const unreadCount = alertsData?.filter(alert => !alert.read).length || 0;
      setAlertsCount(unreadCount);
      
      setLoading(false);
    } catch (error: unknown) {
      console.error('Exception fetching data:', error);
      if (error instanceof Error) {
        setError(`Erreur de chargement: ${error.message}`);
      } else {
        setError('Une erreur inconnue est survenue lors du chargement des données.');
      }
      setLoading(false);
    }
  // Correction 1: Ajouter les dépendances stables (router) ou laisser vide si aucune dépendance externe n'est utilisée.
  // Les setters useState sont stables et n'ont pas besoin d'être listés.
  }, [router]); 

  // Correction 1: Utiliser fetchData dans le tableau de dépendances
  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // Marquage d'une alerte comme lue
  const handleMarkAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('maturity_alerts')
        .update({ read: true })
        .eq('id', alertId);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setMaturityAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      );
      
      // Mettre à jour le compteur d'alertes
      setAlertsCount(prevCount => (prevCount > 0 ? prevCount - 1 : 0));
      
      setNotification({
        open: true,
        message: 'Alerte marquée comme lue',
        severity: 'success'
      });
    } catch (error: unknown) {
      console.error('Erreur lors du marquage comme lu:', error);
      if (error instanceof Error) {
        setNotification({
          open: true,
          message: `Erreur: ${error.message}`,
          severity: 'error'
        });
      } else {
        setNotification({
          open: true,
          message: 'Erreur: Une erreur inconnue est survenue',
          severity: 'error'
        });
      }
    }
  };

  // Analyser les notes pour détecter les occasions potentielles
  const analyzeWineNotes = (notes: string | null): string[] => { // Allow null notes
    const occasions: string[] = [];
    
    if (!notes) return occasions;
    
    // Mots-clés associés à différentes occasions
    const occasionKeywords = {
        dinner: ['dîner', 'repas', 'gastronomique', 'plat principal', 'viande', 'poisson'],
        celebration: ['fête', 'célébration', 'occasion spéciale', 'événement', 'anniversaire', 'mariage'],
        dessert: ['dessert', 'sucré', 'pâtisserie', 'fromage', 'fin de repas'],
        aperitif: ['apéritif', 'entrée', 'tapas', 'amuse-bouche'],
        bbq: ['barbecue', 'bbq', 'grillade', 'grillé']
      };
      
      const notesLower = notes.toLowerCase();
      
      Object.entries(occasionKeywords).forEach(([occasion, keywords]) => {
        if (keywords.some(keyword => notesLower.includes(keyword))) {
          occasions.push(occasion);
        }
      });
      
      return occasions;
    };
    
    // Extraire l'estimation de garde à partir des notes
    const extractAgeability = (notes: string | null): { min: number, max: number } | null => { // Allow null notes
      if (!notes) return null;
      
      // Recherche de patrons comme "potentiel de garde de 5 à 10 ans" ou "garde 3-5 ans"
      // Correction: Utiliser d'environ au lieu de d['']environ pour plus de clarté
      const ageabilityRegex = /(?:potentiel de )?garde (?:de |pendant |d'environ )?(\d+)(?:\s*[-à]\s*(\d+))?\s*ans/i;
      const match = notes.match(ageabilityRegex);
      
      if (match) {
        const min = parseInt(match[1], 10); // Add radix 10
        const max = match[2] ? parseInt(match[2], 10) : min + Math.floor(min / 2); // Si pas de max, estimer
        return { min, max };
      }
      
      return null;
    };
  
    // Déterminer le statut de maturité d'un vin en fonction de son millésime et de sa garde
    const getMaturityStatus = (vintage: number | null, notes: string | null): 'young' | 'approaching' | 'peak' | 'past' | 'unknown' => {
      if (!vintage || !notes) return 'unknown';
      
      const ageability = extractAgeability(notes);
      if (!ageability) return 'unknown';
      
      const currentYear = new Date().getFullYear();
      const age = currentYear - vintage;
      
      // Adjust thresholds slightly for more intuitive ranges
      if (age < ageability.min) return 'young'; // Strictly less than min age
      if (age >= ageability.min && age < (ageability.min + (ageability.max - ageability.min) / 2)) return 'approaching'; // From min up to midpoint
      if (age >= (ageability.min + (ageability.max - ageability.min) / 2) && age <= ageability.max) return 'peak'; // From midpoint up to max
      if (age > ageability.max) return 'past';
      
      return 'unknown'; // Should not be reached if ageability exists
    };
  
    // Préparer les données pour le graphique de répartition par couleur
    const prepareColorDistributionData = () => {
      const colorCounts = bottles.reduce((acc, bottle) => {
        // Handle cases where bottle.wine might be undefined
        const color = bottle.wine?.color || 'unknown'; 
        acc[color] = (acc[color] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(colorCounts).map(([color, value]) => {
        let colorLabel = 'Inconnu';
        switch (color) {
          case 'red': colorLabel = 'Rouge'; break;
          case 'white': colorLabel = 'Blanc'; break;
          case 'rose': colorLabel = 'Rosé'; break;
          case 'sparkling': colorLabel = 'Effervescent'; break;
          case 'fortified': colorLabel = 'Fortifié'; break;
        }
        
        return { name: colorLabel, value, color };
      });
    };
  
    // Préparer les données pour le graphique de répartition par région
    const prepareRegionDistributionData = () => {
      const regionCounts = bottles.reduce((acc, bottle) => {
        // Handle cases where bottle.wine or bottle.wine.region might be undefined/null
        const region = bottle.wine?.region || 'Inconnue'; 
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(regionCounts)
        .sort((a, b) => b[1] - a[1]) // Trier par nombre décroissant
        .slice(0, 10) // Prendre les 10 premières régions
        .map(([region, count]) => ({
          name: region,
          count
        }));
    };
  
    // Préparer les données pour le graphique de répartition par millésime
    const prepareVintageDistributionData = () => {
      const vintageCounts = bottles.reduce((acc, bottle) => {
        // Handle cases where bottle.wine or bottle.wine.vintage might be undefined/null
        const vintage = bottle.wine?.vintage; 
        if (vintage && vintage > 0) { // Check if vintage is a positive number
          acc[vintage] = (acc[vintage] || 0) + 1;
        }
        return acc;
      }, {} as Record<number, number>);
      
      return Object.entries(vintageCounts)
        .map(([vintage, count]) => ({
          vintage: parseInt(vintage, 10), // Add radix 10
          count
        }))
        .sort((a, b) => a.vintage - b.vintage);
    };
  
    // Suggérer des vins pour différentes occasions en fonction de leur type et des notes
    const suggestWinesForOccasion = (occasion: 'aperitif' | 'dinner' | 'celebration' | 'dessert'): Bottle[] => {
      const suggestedWines: Bottle[] = [];
      
      // Vins recommandés par défaut selon le type d'occasion
      const defaultRecommendations: Record<string, { colors: string[], minAge?: number, maxAge?: number }> = {
        'aperitif': { colors: ['white', 'sparkling', 'rose'], maxAge: 5 }, // Allow slightly older whites/sparkling
        'dinner': { colors: ['red', 'white'], minAge: 2 },
        'celebration': { colors: ['sparkling', 'white'], minAge: 1 }, // Added white as option
        'dessert': { colors: ['white', 'fortified', 'rose'], minAge: 1 } // Added rose
      };
      
      const currentYear = new Date().getFullYear();
      
      // Première passe: chercher les vins qui ont des notes mentionnant explicitement l'occasion
      bottles.forEach(bottle => {
        if (!bottle.wine || !bottle.wine.notes) return; // Skip if no wine or no notes
        
        const occasionsInNotes = analyzeWineNotes(bottle.wine.notes);
        if (occasionsInNotes.includes(occasion)) {
          suggestedWines.push(bottle);
        }
      });
      
      // Si pas assez de suggestions, compléter avec les recommandations par défaut
      const needed = 5 - suggestedWines.length; // Aim for 5 suggestions total
      if (needed > 0) {
        const defaultRecs = defaultRecommendations[occasion];
        
        bottles.forEach(bottle => {
          // Avoid duplicates and ensure wine data exists
          if (suggestedWines.some(b => b.id === bottle.id) || !bottle.wine) return; 
          
          const color = bottle.wine.color;
          const vintage = bottle.wine.vintage;
          
          if (color && defaultRecs.colors.includes(color)) {
            let matchesAge = true; // Assume age matches unless proven otherwise
            
            if (vintage) { // Only check age if vintage exists
              const age = currentYear - vintage;
              if (defaultRecs.minAge !== undefined && age < defaultRecs.minAge) {
                matchesAge = false;
              }
              if (defaultRecs.maxAge !== undefined && age > defaultRecs.maxAge) {
                matchesAge = false;
              }
            } else if (defaultRecs.minAge || defaultRecs.maxAge) {
              // If age criteria exist but vintage is unknown, don't include by default
              // matchesAge = false; // Or decide based on your preference
            }
            
            if (matchesAge && suggestedWines.length < 5) { // Check total length limit
              suggestedWines.push(bottle);
            }
          }
        });
      }
      
      // Trier les suggestions (simple sort for now, can be refined)
      // Example: Prioritize wines explicitly matching notes, then by color, then vintage?
      return suggestedWines.slice(0, 5); // Ensure max 5 suggestions
    };
  
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setTabIndex(newValue);
    };
  
    // Couleur selon le statut de maturité
    const getMaturityStatusColor = (status: string): string => { // Add return type
      switch (status) {
        case 'peak': return theme.palette.success.main;
        case 'approaching': return theme.palette.warning.main;
        case 'past': return theme.palette.error.main;
        default: return theme.palette.grey[500];
      }
    };
  
    // Libellé selon le statut de maturité
    const getMaturityStatusLabel = (status: string): string => { // Add return type
      switch (status) {
        case 'peak': return 'Apogée';
        case 'approaching': return 'Approchant';
        case 'past': return 'Dépassé';
        default: return 'Inconnu';
      }
    };
  
    // Formater les données pour l'affichage de maturité
    const getMaturityData = () => {
      const maturityCounts: Record<'young' | 'approaching' | 'peak' | 'past' | 'unknown', number> = {
        young: 0,
        approaching: 0,
        peak: 0,
        past: 0,
        unknown: 0
      };
      
      bottles.forEach(bottle => {
        // Ensure wine and necessary properties exist
        if (bottle.wine?.vintage && bottle.wine?.notes) { 
          const status = getMaturityStatus(bottle.wine.vintage, bottle.wine.notes);
          maturityCounts[status]++;
        } else {
          maturityCounts.unknown++;
        }
      });
      
      return [
        { name: 'Jeune', value: maturityCounts.young, color: theme.palette.info.light },
        { name: 'Bientôt à maturité', value: maturityCounts.approaching, color: theme.palette.warning.main },
        { name: 'À maturité', value: maturityCounts.peak, color: theme.palette.success.main },
        { name: 'Passé', value: maturityCounts.past, color: theme.palette.error.main },
        { name: 'Indéterminé', value: maturityCounts.unknown, color: theme.palette.grey[400] }
      ].filter(item => item.value > 0); // Optionally filter out zero values
    };
    
    // Composant pour le rendu des alertes
    const renderAlertsTab = () => (
      <Box>
        <Typography variant="h6" gutterBottom>
          {/* Badge now wraps the text directly for better alignment */}
          <Badge badgeContent={alertsCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 }, mr: alertsCount > 0 ? 1 : 0 }}>
             Alertes de maturité
          </Badge>
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
             <CircularProgress />
           </Box>
        ) : maturityAlerts.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Aucune alerte de maturité pour le moment.
          </Alert>
        ) : (
          <List sx={{ width: '100%' }}>
            {maturityAlerts.map(alert => (
              <ListItem 
                key={alert.id}
                sx={{ 
                  mb: 2, 
                  border: '1px solid',
                  borderColor: alert.read ? 'divider' : getMaturityStatusColor(alert.status),
                  borderRadius: 2,
                  bgcolor: alert.read ? 'transparent' : alpha(getMaturityStatusColor(alert.status), 0.05),
                  opacity: alert.read ? 0.7 : 1, // Dim read alerts
                  alignItems: 'flex-start' // Align items top
                }}
              >
                <ListItemIcon sx={{ mt: 1 }}> {/* Adjust icon margin */}
                  <AlarmIcon sx={{ color: getMaturityStatusColor(alert.status) }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" flexWrap="wrap"> {/* Allow wrapping */}
                      <Typography variant="subtitle1" component="span" sx={{ mr: 1 }}>
                        {/* Safely access wine properties */}
                        {alert.wine?.name || 'Vin inconnu'} {alert.wine?.vintage && `(${alert.wine.vintage})`}
                      </Typography>
                      <Chip 
                        label={getMaturityStatusLabel(alert.status)} 
                        size="small"
                        sx={{ 
                          bgcolor: getMaturityStatusColor(alert.status),
                          color: 'white',
                          fontWeight: 500,
                          height: 'auto', // Adjust height auto
                          lineHeight: 1.5 // Adjust line height
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" component="span" display="block"> {/* Use block for better spacing */}
                        {alert.bottle_count ?? '?'} bouteille(s) 
                        {alert.wine?.domain && ` • ${alert.wine.domain}`}
                        {alert.wine?.region && ` • ${alert.wine.region}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="span">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </Typography>
                    </>
                  }
                />
                {!alert.read && ( // Show button only if unread
                  <ListItemSecondaryAction sx={{ right: 8, top: '50%', transform: 'translateY(-50%)' }}> {/* Adjust position */}
                      <Tooltip title="Marquer comme lu">
                        <IconButton 
                          edge="end" 
                          onClick={() => handleMarkAsRead(alert.id)}
                          size="small"
                        >
                          <MarkEmailReadIcon />
                        </IconButton>
                      </Tooltip>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    );
  
    // Composant pour le rendu des analyses
    const renderAnalyticsTab = () => {
        const colorData = prepareColorDistributionData();
        const maturityData = getMaturityData();
        const regionData = prepareRegionDistributionData();
        const vintageData = prepareVintageDistributionData();

        if (loading) return <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>;

        return (
          <Box>
            <Grid container spacing={3}>
              {/* Distribution par couleur */}
              {colorData.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>Répartition par couleur</Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={colorData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} outerRadius={80} fill="#8884d8" dataKey="value">
                            {colorData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[entry.color as keyof typeof COLORS] || '#777777'} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => [`${value} bouteille(s)`, '']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              )}
              
              {/* Distribution par maturité */}
              {maturityData.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>Statut de maturité</Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={maturityData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} outerRadius={80} fill="#8884d8" dataKey="value">
                            {maturityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => [`${value} bouteille(s)`, '']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              )}
              
              {/* Distribution par région */}
              {regionData.length > 0 && (
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>Top 10 des régions</Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={regionData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                          <RechartsTooltip formatter={(value) => [`${value} bouteille(s)`, '']} />
                          <Bar dataKey="count" fill={theme.palette.primary.main} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              )}
              
              {/* Distribution par millésime */}
              {vintageData.length > 0 && (
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>Répartition par millésime</Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vintageData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="vintage" angle={-45} textAnchor="end" height={50} interval={0} tick={{ fontSize: 10 }} />
                          <YAxis allowDecimals={false}/>
                          <RechartsTooltip formatter={(value, name, props) => [`${value} bouteille(s)`, `Millésime ${props.payload.vintage}`]} />
                          <Bar dataKey="count" fill={theme.palette.primary.main} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        );
    };
      
  
    // Composant pour le rendu des suggestions
    const renderSuggestionsTab = () => {
      const aperitifWines = suggestWinesForOccasion('aperitif');
      const dinnerWines = suggestWinesForOccasion('dinner');
      const celebrationWines = suggestWinesForOccasion('celebration');
      const dessertWines = suggestWinesForOccasion('dessert');

      if (loading) return <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>;

      // Helper to render suggestion list items
      const renderSuggestionItem = (bottle: Bottle) => {
        // Define colors mapping locally or import from a constants file
        const wineColorMap = {
          red: '#B71C1C', white: '#FFF59D', rose: '#F8BBD0', 
          sparkling: '#B3E5FC', fortified: '#8D6E63', unknown: '#AAAAAA'
        };
        const colorHex = bottle.wine?.color ? wineColorMap[bottle.wine.color as keyof typeof wineColorMap] : wineColorMap.unknown;
        
        const colorLabelMap = {
          red: 'Rouge', white: 'Blanc', rose: 'Rosé', 
          sparkling: 'Effervescent', fortified: 'Fortifié', unknown: 'Inconnu'
        };
        const colorLabel = bottle.wine?.color ? colorLabelMap[bottle.wine.color as keyof typeof colorLabelMap] : colorLabelMap.unknown;


        return (
           <ListItem 
             key={bottle.id}
             component={Link} // Use Link component
             href={`/wines/${bottle.wine_id}`} // Use Link href
             sx={{ 
               display: 'block',
               textAlign: 'left',
               mb: 1, 
               borderRadius: 2,
               border: '1px solid',
               borderColor: 'divider',
               p: 2,
               textDecoration: 'none', // Remove underline from Link
               color: 'inherit', // Inherit text color
               '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.04)} // Subtle hover effect
             }}
           >
             <Typography variant="subtitle1">
               {bottle.wine?.name || 'Vin inconnu'} {bottle.wine?.vintage && `(${bottle.wine.vintage})`}
             </Typography>
             <Box display="flex" alignItems="center" mt={0.5}>
               <Box 
                 sx={{ 
                   width: 12, height: 12, borderRadius: '50%', 
                   bgcolor: colorHex,
                   mr: 1, border: '1px solid rgba(0,0,0,0.1)' // Add subtle border for light colors
                 }} 
               />
               <Typography variant="body2" color="text.secondary">
                 {colorLabel}
                 {bottle.wine?.domain && ` • ${bottle.wine.domain}`}
               </Typography>
             </Box>
           </ListItem>
         );
       };

      return (
        <Box>
          <Grid container spacing={3}>
            {/* Suggestions pour l'apéritif */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <LocalBarIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  {/* Correction 2: Utiliser &apos; pour l'apostrophe */}
                  <Typography variant="h6">Pour l&apos;apéritif</Typography> 
                </Box>
                <List sx={{ width: '100%' }}>
                  {aperitifWines.length > 0 ? (
                    aperitifWines.map(renderSuggestionItem)
                  ) : (
                    <Alert severity="info">Aucune suggestion disponible.</Alert>
                  )}
                </List>
              </Paper>
            </Grid>
            
            {/* Suggestions pour le dîner */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <RestaurantIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6">Pour le dîner</Typography>
                </Box>
                <List sx={{ width: '100%' }}>
                  {dinnerWines.length > 0 ? (
                    dinnerWines.map(renderSuggestionItem)
                  ) : (
                    <Alert severity="info">Aucune suggestion disponible.</Alert>
                  )}
                </List>
              </Paper>
            </Grid>
            
            {/* Suggestions pour les occasions spéciales */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <CelebrationIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6">Pour les occasions spéciales</Typography>
                </Box>
                <List sx={{ width: '100%' }}>
                  {celebrationWines.length > 0 ? (
                    celebrationWines.map(renderSuggestionItem)
                  ) : (
                    <Alert severity="info">Aucune suggestion disponible.</Alert>
                  )}
                </List>
              </Paper>
            </Grid>
            
            {/* Suggestions pour le dessert */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <BubbleChartIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6">Pour le dessert</Typography>
                </Box>
                <List sx={{ width: '100%' }}>
                  {dessertWines.length > 0 ? (
                    dessertWines.map(renderSuggestionItem)
                  ) : (
                    <Alert severity="info">Aucune suggestion disponible.</Alert>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      );
    };
        
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="500" gutterBottom>
            Analyses & Suggestions
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Explorez votre collection, recevez des alertes de maturité et découvrez des suggestions pour chaque occasion.
          </Typography>
          
          {/* Moved Loading/Error/Empty state outside Tabs for clarity */}
          {loading ? (
             <Box display="flex" justifyContent="center" my={4}>
               <CircularProgress />
             </Box>
           ) : error ? (
             <Alert severity="error" sx={{ my: 2 }}>
               {error}
             </Alert>
           ) : bottles.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2, mt: 3 }}>
              <Typography variant="h6" gutterBottom>Votre cave semble vide</Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Ajoutez quelques bouteilles pour débloquer les analyses et suggestions personnalisées.
              </Typography>
              <Button 
                variant="contained" 
                component={Link} 
                href="/storage/add" // Link to add page might be more direct
                sx={{ mt: 2 }}
              >
                Ajouter une bouteille
              </Button>
            </Paper>
           ) : (
             <Box sx={{ width: '100%', mt: 3 }}> {/* Add margin top */}
               <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                 <Tabs 
                   value={tabIndex} 
                   onChange={handleTabChange}
                   aria-label="analyses tabs"
                   variant="scrollable" // Make tabs scrollable on small screens
                   scrollButtons="auto" // Show scroll buttons automatically
                 >
                   <Tab 
                     icon={<NotificationsIcon />} 
                     iconPosition="start" // Place icon before label
                     label={
                       <Badge 
                         badgeContent={alertsCount} 
                         color="error"
                         anchorOrigin={{ vertical: 'top', horizontal: 'right' }} // Better position
                         sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 16, minWidth: 16, p: '0 4px' } }} // Smaller badge
                       >
                         Alertes
                       </Badge>
                     } 
                     sx={{ minHeight: 48 }} // Ensure consistent tab height
                   />
                   <Tab icon={<PieChartIcon />} iconPosition="start" label="Analyses" sx={{ minHeight: 48 }}/>
                   <Tab icon={<WineBarIcon />} iconPosition="start" label="Suggestions" sx={{ minHeight: 48 }}/>
                 </Tabs>
               </Box>
               
               {/* Render tab content based on index */}
               {tabIndex === 0 && renderAlertsTab()}
               {tabIndex === 1 && renderAnalyticsTab()}
               {tabIndex === 2 && renderSuggestionsTab()}
             </Box>
           )}
           
           <Snackbar
             open={notification.open}
             autoHideDuration={6000}
             onClose={() => setNotification({ ...notification, open: false })}
             anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
           >
             <Alert 
               onClose={() => setNotification({ ...notification, open: false })} 
               severity={notification.severity}
               variant="filled" // Use filled variant for better visibility
               sx={{ width: '100%', borderRadius: 1 }} // Slightly adjust border radius
             >
               {notification.message}
             </Alert>
           </Snackbar>
         </Container>
       </>
     );
}