'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Badge,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
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
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { useTheme } from '@mui/material/styles';

// Types utilisés dans l'application
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
  wine?: Wine; // Wine peut être undefined si la jointure ne retourne rien
};

type MaturityAlert = {
  id: string;
  wine_id: string;
  status: 'peak' | 'approaching' | 'past';
  created_at: string;
  read: boolean;
  wine?: Partial<Wine>;
  bottle_count?: number;
};

// Types pour les réponses Supabase (sans utiliser any)
type BottleResponse = {
  id: string;
  wine_id: string;
  position_id: string | null;
  status: string;
  acquisition_date: string | null;
  label: string | null;
  wine: Wine | Wine[] | null;
};

type MaturityAlertResponse = {
  id: string;
  wine_id: string;
  status: 'peak' | 'approaching' | 'past';
  created_at: string;
  read: boolean;
  wine: Partial<Wine> | Partial<Wine>[] | null;
};

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

  // Couleurs utilisées pour les graphiques
  const COLORS = {
    red: '#B71C1C',
    white: '#FFF59D',
    rose: '#F8BBD0',
    sparkling: '#B3E5FC',
    fortified: '#8D6E63'
  };

  // Récupération des données via Supabase
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Auth error or no user:', userError);
        router.push('/login');
        return;
      }

      // Récupération des bouteilles et vins associés
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
        .eq('user_id', user.id);

      if (bottlesError) throw bottlesError;

      const bottleResponses = (bottlesData ?? []) as BottleResponse[];
      setBottles(
        bottleResponses.map(bottle => ({
          ...bottle,
          wine: Array.isArray(bottle.wine)
            ? bottle.wine[0]
            : bottle.wine ?? undefined
        }))
      );

      // Récupération des alertes de maturité
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      const alertResponses = (alertsData ?? []) as MaturityAlertResponse[];
      const alertsWithBottleCounts = alertResponses.map(alert => {
        const bottleCount = bottleResponses.filter(b => b.wine_id === alert.wine_id).length || 0;
        return {
          ...alert,
          bottle_count: bottleCount,
          wine: Array.isArray(alert.wine)
            ? alert.wine[0]
            : alert.wine ?? undefined
        };
      });

      setMaturityAlerts(alertsWithBottleCounts as MaturityAlert[]);
      const unreadCount = alertResponses.filter(alert => !alert.read).length || 0;
      setAlertsCount(unreadCount);
      setLoading(false);
    } catch (err: unknown) {
      console.error('Exception fetching data:', err);
      if (err instanceof Error) {
        setError(`Erreur de chargement: ${err.message}`);
      } else {
        setError('Une erreur inconnue est survenue lors du chargement des données.');
      }
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Marquer une alerte comme lue
  const handleMarkAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('maturity_alerts')
        .update({ read: true })
        .eq('id', alertId);
      if (error) throw error;
      setMaturityAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      );
      setAlertsCount(prevCount => (prevCount > 0 ? prevCount - 1 : 0));
      setNotification({
        open: true,
        message: 'Alerte marquée comme lue',
        severity: 'success'
      });
    } catch (err: unknown) {
      console.error('Erreur lors du marquage comme lu:', err);
      if (err instanceof Error) {
        setNotification({
          open: true,
          message: `Erreur: ${err.message}`,
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

  // Analyse des notes de vin pour détecter certaines occasions
  const analyzeWineNotes = (notes: string | null): string[] => {
    const occasions: string[] = [];
    if (!notes) return occasions;
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

  // Extraction de l'estimation de garde à partir des notes
  const extractAgeability = (notes: string | null): { min: number; max: number } | null => {
    if (!notes) return null;
    const ageabilityRegex = /(?:potentiel de )?garde (?:de |pendant |d'environ )?(\d+)(?:\s*[-à]\s*(\d+))?\s*ans/i;
    const match = notes.match(ageabilityRegex);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = match[2] ? parseInt(match[2], 10) : min + Math.floor(min / 2);
      return { min, max };
    }
    return null;
  };

  const getMaturityStatus = (
    vintage: number | null,
    notes: string | null
  ): 'young' | 'approaching' | 'peak' | 'past' | 'unknown' => {
    if (!vintage || !notes) return 'unknown';
    const ageability = extractAgeability(notes);
    if (!ageability) return 'unknown';
    const currentYear = new Date().getFullYear();
    const age = currentYear - vintage;
    if (age < ageability.min) return 'young';
    if (age >= ageability.min && age < ageability.min + (ageability.max - ageability.min) / 2)
      return 'approaching';
    if (age >= ageability.min + (ageability.max - ageability.min) / 2 && age <= ageability.max)
      return 'peak';
    if (age > ageability.max) return 'past';
    return 'unknown';
  };

  // Préparation des données pour le graphique de répartition par couleur
  const prepareColorDistributionData = () => {
    const colorCounts = bottles.reduce((acc, bottle) => {
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

  // Préparation des données pour la répartition par région
  const prepareRegionDistributionData = () => {
    const regionCounts = bottles.reduce((acc, bottle) => {
      const region = bottle.wine?.region || 'Inconnue';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([region, count]) => ({
        name: region,
        count
      }));
  };

  // Préparation des données pour la répartition par millésime
  const prepareVintageDistributionData = () => {
    const vintageCounts = bottles.reduce((acc, bottle) => {
      const vintage = bottle.wine?.vintage;
      if (vintage && vintage > 0) {
        acc[vintage] = (acc[vintage] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);
    return Object.entries(vintageCounts)
      .map(([vintage, count]) => ({
        vintage: parseInt(vintage, 10),
        count
      }))
      .sort((a, b) => a.vintage - b.vintage);
  };

  // Suggestions de vins en fonction de l'occasion
  const suggestWinesForOccasion = (occasion: 'aperitif' | 'dinner' | 'celebration' | 'dessert'): Bottle[] => {
    const suggestedWines: Bottle[] = [];
    const defaultRecommendations: Record<string, { colors: string[]; minAge?: number; maxAge?: number }> = {
      aperitif: { colors: ['white', 'sparkling', 'rose'], maxAge: 5 },
      dinner: { colors: ['red', 'white'], minAge: 2 },
      celebration: { colors: ['sparkling', 'white'], minAge: 1 },
      dessert: { colors: ['white', 'fortified', 'rose'], minAge: 1 }
    };
    const currentYear = new Date().getFullYear();
    bottles.forEach(bottle => {
      if (!bottle.wine || !bottle.wine.notes) return;
      const occasionsInNotes = analyzeWineNotes(bottle.wine.notes);
      if (occasionsInNotes.includes(occasion)) {
        suggestedWines.push(bottle);
      }
    });
    const needed = 5 - suggestedWines.length;
    if (needed > 0) {
      const defaultRecs = defaultRecommendations[occasion];
      bottles.forEach(bottle => {
        if (suggestedWines.some(b => b.id === bottle.id) || !bottle.wine) return;
        const color = bottle.wine.color;
        const vintage = bottle.wine.vintage;
        if (color && defaultRecs.colors.includes(color)) {
          let matchesAge = true;
          if (vintage) {
            const age = currentYear - vintage;
            if (defaultRecs.minAge !== undefined && age < defaultRecs.minAge) {
              matchesAge = false;
            }
            if (defaultRecs.maxAge !== undefined && age > defaultRecs.maxAge) {
              matchesAge = false;
            }
          }
          if (matchesAge && suggestedWines.length < 5) {
            suggestedWines.push(bottle);
          }
        }
      });
    }
    return suggestedWines.slice(0, 5);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const getMaturityStatusColor = (status: string): string => {
    switch (status) {
      case 'peak': return theme.palette.success.main;
      case 'approaching': return theme.palette.warning.main;
      case 'past': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getMaturityStatusLabel = (status: string): string => {
    switch (status) {
      case 'peak': return 'Apogée';
      case 'approaching': return 'Approchant';
      case 'past': return 'Dépassé';
      default: return 'Inconnu';
    }
  };

  const getMaturityData = () => {
    const maturityCounts: Record<'young' | 'approaching' | 'peak' | 'past' | 'unknown', number> = {
      young: 0,
      approaching: 0,
      peak: 0,
      past: 0,
      unknown: 0
    };
    bottles.forEach(bottle => {
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
    ].filter(item => item.value > 0);
  };

  const renderAlertsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
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
                opacity: alert.read ? 0.7 : 1,
                alignItems: 'flex-start'
              }}
            >
              <ListItemIcon sx={{ mt: 1 }}>
                <AlarmIcon sx={{ color: getMaturityStatusColor(alert.status) }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" flexWrap="wrap">
                    <Typography variant="subtitle1" component="span" sx={{ mr: 1 }}>
                      {alert.wine?.name || 'Vin inconnu'} {alert.wine?.vintage && `(${alert.wine.vintage})`}
                    </Typography>
                    <Chip
                      label={getMaturityStatusLabel(alert.status)}
                      size="small"
                      sx={{
                        bgcolor: getMaturityStatusColor(alert.status),
                        color: 'white',
                        fontWeight: 500,
                        height: 'auto',
                        lineHeight: 1.5
                      }}
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" component="span" display="block">
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
              {!alert.read && (
                <ListItemSecondaryAction sx={{ right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                  <Tooltip title="Marquer comme lu">
                    <IconButton edge="end" onClick={() => handleMarkAsRead(alert.id)} size="small">
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

  const renderAnalyticsTab = () => {
    const colorData = prepareColorDistributionData();
    const maturityData = getMaturityData();
    const regionData = prepareRegionDistributionData();
    const vintageData = prepareVintageDistributionData();

    if (loading)
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      );

    return (
      <Box>
        <Grid container spacing={3}>
          {colorData.length > 0 && (
            <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Répartition par couleur
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={colorData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
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
          {maturityData.length > 0 && (
            <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Statut de maturité
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={maturityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
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
          {regionData.length > 0 && (
            <Grid component="div" sx={{ width: { xs: '100%' } }}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Top 10 des régions
                </Typography>
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
          {vintageData.length > 0 && (
            <Grid component="div" sx={{ width: { xs: '100%' } }}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Répartition par millésime
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vintageData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vintage" angle={-45} textAnchor="end" height={50} interval={0} tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} />
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

  const renderSuggestionsTab = () => {
    const aperitifWines = suggestWinesForOccasion('aperitif');
    const dinnerWines = suggestWinesForOccasion('dinner');
    const celebrationWines = suggestWinesForOccasion('celebration');
    const dessertWines = suggestWinesForOccasion('dessert');

    if (loading)
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      );

    const renderSuggestionItem = (bottle: Bottle) => {
      const wineColorMap = {
        red: '#B71C1C',
        white: '#FFF59D',
        rose: '#F8BBD0',
        sparkling: '#B3E5FC',
        fortified: '#8D6E63',
        unknown: '#AAAAAA'
      };
      const colorHex = bottle.wine?.color
        ? wineColorMap[bottle.wine.color as keyof typeof wineColorMap]
        : wineColorMap.unknown;
      const colorLabelMap = {
        red: 'Rouge',
        white: 'Blanc',
        rose: 'Rosé',
        sparkling: 'Effervescent',
        fortified: 'Fortifié',
        unknown: 'Inconnu'
      };
      const colorLabel = bottle.wine?.color
        ? colorLabelMap[bottle.wine.color as keyof typeof colorLabelMap]
        : colorLabelMap.unknown;

      return (
        <ListItem
          key={bottle.id}
          component={Link}
          href={`/wines/${bottle.wine_id}`}
          sx={{
            display: 'block',
            textAlign: 'left',
            mb: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            p: 2,
            textDecoration: 'none',
            color: 'inherit',
            '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.04) }
          }}
        >
          <Typography variant="subtitle1">
            {bottle.wine?.name || 'Vin inconnu'} {bottle.wine?.vintage && `(${bottle.wine.vintage})`}
          </Typography>
          <Box display="flex" alignItems="center" mt={0.5}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: colorHex,
                mr: 1,
                border: '1px solid rgba(0,0,0,0.1)'
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
        <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <LocalBarIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
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
          <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
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
          <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
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
          <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
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
            <Typography variant="h6" gutterBottom>
              Votre cave semble vide
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Ajoutez quelques bouteilles pour débloquer les analyses et suggestions personnalisées.
            </Typography>
            <Button variant="contained" component={Link} href="/storage/add" sx={{ mt: 2 }}>
              Ajouter une bouteille
            </Button>
          </Paper>
        ) : (
          <Box sx={{ width: '100%', mt: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabIndex} onChange={handleTabChange} aria-label="analyses tabs" variant="scrollable" scrollButtons="auto">
                <Tab
                  icon={<NotificationsIcon />}
                  iconPosition="start"
                  label={
                    <Badge
                      badgeContent={alertsCount}
                      color="error"
                      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                      sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 16, minWidth: 16, p: '0 4px' } }}
                    >
                      Alertes
                    </Badge>
                  }
                  sx={{ minHeight: 48 }}
                />
                <Tab icon={<PieChartIcon />} iconPosition="start" label="Analyses" sx={{ minHeight: 48 }} />
                <Tab icon={<WineBarIcon />} iconPosition="start" label="Suggestions" sx={{ minHeight: 48 }} />
              </Tabs>
            </Box>
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
          <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} variant="filled" sx={{ width: '100%', borderRadius: 1 }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}
