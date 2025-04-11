'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Paper, Button, CircularProgress,
  TextField, Tabs, Tab, Chip, Divider, IconButton, Badge, Snackbar,
  Alert, FormControlLabel, Switch, Rating
} from '@mui/material';
import WineBarIcon from '@mui/icons-material/WineBar';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import BarChartIcon from '@mui/icons-material/BarChart';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import TastingForm from '../components/TastingForm';
import { supabase } from '../utils/supabase';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Fonction utilitaire pour obtenir la couleur d'un type de vin
const getWineColor = (color) => {
  switch (color) {
    case 'red': return '#8B0000';
    case 'white': return '#F5F5DC';
    case 'rose': return '#F8BBD0';
    case 'orange': return '#FF8C00';
    case 'sparkling': return '#81D4FA';
    default: return '#607D8B';
  }
};

export default function TastingNotesPage() {
  const router = useRouter();
  
  // États principaux
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tastingNotes, setTastingNotes] = useState([]);
  const [pendingTastings, setPendingTastings] = useState([]);
  const [favoriteTastings, setFavoriteTastings] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [showNewTastingForm, setShowNewTastingForm] = useState(false);
  
  // Récupérer les données au chargement
  useEffect(() => {
    fetchTastingData();
  }, []);
  
  // Récupération des données
  const fetchTastingData = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push('/login');
        return;
      }

      // Dégustations enregistrées
      const { data: tastingData, error: tastingError } = await supabase
        .from('tasting_notes')
        .select(`
          id, wine_id, date, location, occasion, with_who, serving_temperature, aeration_time,
          color, color_intensity, clarity, tears, nose_intensity, aroma_families, specific_aromas,
          attack, acidity, tannin, alcohol, body, length, food_pairing, pairing_rating, overall_rating,
          is_favorite, comments,
          wine:wine_id (
            id, name, vintage, color, domain, region, appellation
          )
        `)
        .eq('user_id', authData.user.id)
        .order('date', { ascending: false });

      if (tastingError) throw tastingError;
      setTastingNotes(tastingData || []);
      setFavoriteTastings((tastingData || []).filter(note => note.is_favorite));

      // Dégustations en attente
      const { data: pendingData, error: pendingError } = await supabase
        .from('pending_tastings')
        .select(`
          id, wine_id, priority, notes,
          wine:wine_id (
            id, name, vintage, color, domain, region, appellation
          )
        `)
        .eq('user_id', authData.user.id)
        .order('priority', { ascending: false });

      if (pendingError) throw pendingError;
      setPendingTastings(pendingData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Gestion du changement d'onglet
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  
  // Gestion de la soumission du formulaire
  const handleTastingSubmit = async (formData) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const finalTastingData = {
        ...formData,
        user_id: userData.user.id,
        created_at: new Date()
      };

      const { error } = await supabase
        .from('tasting_notes')
        .insert([finalTastingData]);
        
      if (error) throw error;

      // Si dégustation depuis la liste d'attente, on supprime l'entrée
      if (formData.pending_id) {
        await supabase
          .from('pending_tastings')
          .delete()
          .eq('id', formData.pending_id);
      }

      fetchTastingData();
      setShowNewTastingForm(false);
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
      setLoading(false);
    }
  };
  
  // Rendu d'une carte de dégustation
  const renderTastingNoteCard = (note) => {
    const aromas = note.specific_aromas ? note.specific_aromas.split(',').map(a => a.trim()) : [];
    
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3,
          borderRadius: 2, 
          height: '100%',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': { 
            transform: 'translateY(-4px)', 
            boxShadow: 3,
            cursor: 'pointer'
          }
        }}
        onClick={() => router.push(`/tasting-notes/${note.id}`)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarMonthIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {new Date(note.date).toLocaleDateString()}
            </Typography>
          </Box>
          {note.is_favorite && <BookmarkIcon color="primary" />}
        </Box>

        <Box sx={{ display: 'flex', mb: 2 }}>
          <Box 
            sx={{ 
              width: 16, 
              height: 16, 
              borderRadius: '50%', 
              bgcolor: getWineColor(note.wine?.color || 'red'),
              mr: 1,
              mt: 0.5
            }} 
          />
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
              {note.wine?.name || 'Vin inconnu'} {note.wine?.vintage && `(${note.wine.vintage})`}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {note.wine?.appellation || note.wine?.region || 'Région inconnue'}
            </Typography>
            <Rating value={note.overall_rating} precision={0.5} readOnly size="small" />
          </Box>
        </Box>

        {aromas.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              "{aromas.slice(0, 3).join(', ')}{aromas.length > 3 ? '...' : ''}"
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Acidité
            </Typography>
            <Box sx={{ 
              height: 4, 
              bgcolor: 'rgba(0,0,0,0.1)', 
              borderRadius: 1,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box 
                sx={{ 
                  height: '100%', 
                  width: `${note.acidity * 20}%`, 
                  bgcolor: 'primary.main',
                  borderRadius: 1
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Corps
            </Typography>
            <Box sx={{ 
              height: 4, 
              bgcolor: 'rgba(0,0,0,0.1)', 
              borderRadius: 1,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box 
                sx={{ 
                  height: '100%', 
                  width: `${note.body * 20}%`, 
                  bgcolor: 'primary.main',
                  borderRadius: 1
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={4}>
          <Typography variant="caption" color="text.secondary">
              Tanins
            </Typography>
            <Box sx={{ 
              height: 4, 
              bgcolor: 'rgba(0,0,0,0.1)', 
              borderRadius: 1,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box 
                sx={{ 
                  height: '100%', 
                  width: `${note.tannin * 20}%`, 
                  bgcolor: 'primary.main',
                  borderRadius: 1
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {note.food_pairing && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <RestaurantIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Accord mets-vins
              </Typography>
            </Box>
            <Typography variant="body2" noWrap>
              {note.food_pairing}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="text"
            size="small"
            endIcon={<VisibilityIcon />}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/tasting-notes/${note.id}`);
            }}
          >
            Voir détails
          </Button>
        </Box>
      </Paper>
    );
  };

  // Rendu de la page
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        {/* En-tête */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="500">
            Notes de Dégustation
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowNewTastingForm(true)}
            sx={{ borderRadius: 2 }}
          >
            Nouvelle dégustation
          </Button>
        </Box>

        {/* Affichage principal : liste ou formulaire */}
        {!showNewTastingForm ? (
          <Paper
            elevation={0}
            sx={{
              p: 0,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              mb: 4
            }}
          >
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiTab-root': { py: 2 }
              }}
            >
              <Tab 
                label="Dégustations récentes" 
                icon={<WineBarIcon />} 
                iconPosition="start"
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <span>À déguster</span>
                    {pendingTastings.length > 0 && (
                      <Badge badgeContent={pendingTastings.length} color="primary" sx={{ ml: 1 }} />
                    )}
                  </Box>
                }
                icon={<HourglassEmptyIcon />} 
                iconPosition="start"
              />
              <Tab 
                label="Favoris" 
                icon={<BookmarkIcon />} 
                iconPosition="start"
              />
              <Tab 
                label="Statistiques" 
                icon={<BarChartIcon />} 
                iconPosition="start"
              />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Dégustations récentes */}
              {tabIndex === 0 && (
                <>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : tastingNotes.length > 0 ? (
                    <Grid container spacing={3}>
                      {tastingNotes.map((note) => (
                        <Grid item xs={12} md={6} lg={4} key={note.id}>
                          {renderTastingNoteCard(note)}
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="h6" gutterBottom>
                        Aucune dégustation enregistrée
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Commencez par ajouter une note de dégustation pour un vin de votre cave.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowNewTastingForm(true)}
                        sx={{ mt: 2, borderRadius: 2 }}
                      >
                        Nouvelle dégustation
                      </Button>
                    </Box>
                  )}
                </>
              )}

              {/* Vins à déguster */}
              {tabIndex === 1 && (
                <>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : pendingTastings.length > 0 ? (
                    <Grid container spacing={3}>
                      {pendingTastings.map((pending) => (
                        <Grid item xs={12} md={6} lg={4} key={pending.id}>
                          <Paper 
                            variant="outlined" 
                            sx={{ 
                              p: 3,
                              borderRadius: 2, 
                              height: '100%',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 3
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Box 
                                sx={{ 
                                  width: 16, 
                                  height: 16, 
                                  borderRadius: '50%', 
                                  bgcolor: getWineColor(pending.wine?.color || 'red'),
                                  mr: 1
                                }} 
                              />
                              <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                                {pending.wine?.name || 'Vin inconnu'} {pending.wine?.vintage && `(${pending.wine.vintage})`}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {pending.wine?.appellation || pending.wine?.region || 'Région inconnue'}
                            </Typography>
                            {pending.notes && (
                              <Typography variant="body2" paragraph>
                                {pending.notes}
                              </Typography>
                            )}
                            <Chip 
                              label={
                                pending.priority === 3 ? "Priorité haute" : 
                                pending.priority === 2 ? "Priorité moyenne" : 
                                "Priorité normale"
                              }
                              color={
                                pending.priority === 3 ? "error" : 
                                pending.priority === 2 ? "warning" : 
                                "default"
                              }
                              size="small"
                              variant="outlined"
                              sx={{ borderRadius: 2, mb: 2 }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                onClick={() => handleRemoveFromPendingTastings(pending.id)}
                                sx={{ borderRadius: 2 }}
                              >
                                Supprimer
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleStartTastingFromPending(pending)}
                                sx={{ borderRadius: 2 }}
                              >
                                Démarrer la dégustation
                              </Button>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="h6" gutterBottom>
                        Aucun vin en attente de dégustation
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Ajoutez des vins à votre liste de dégustation pour les essayer plus tard.
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              {/* Dégustations favorites */}
              {tabIndex === 2 && (
                <>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : favoriteTastings.length > 0 ? (
                    <Grid container spacing={3}>
                      {favoriteTastings.map((note) => (
                        <Grid item xs={12} md={6} lg={4} key={note.id}>
                          {renderTastingNoteCard(note)}
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="h6" gutterBottom>
                        Aucune dégustation favorite
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Marquez vos dégustations préférées comme favorites pour les retrouver ici.
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              {/* Statistiques */}
              {tabIndex === 3 && (
                <>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Répartition des dégustations par type de vin
                          </Typography>
                          <Box 
                            sx={{ 
                              height: 250, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              bgcolor: 'rgba(0,0,0,0.02)',
                              borderRadius: 1,
                              cursor: 'pointer'
                            }}
                            onClick={() => router.push('/statistics')}
                          >
                            <Typography variant="body2" color="text.secondary">
                              [Graphique de répartition] - Voir détails
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Évolution de vos notes par année
                          </Typography>
                          <Box 
                            sx={{ 
                              height: 250, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              bgcolor: 'rgba(0,0,0,0.02)',
                              borderRadius: 1,
                              cursor: 'pointer'
                            }}
                            onClick={() => router.push('/statistics')}
                          >
                            <Typography variant="body2" color="text.secondary">
                              [Graphique d'évolution] - Voir détails
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  )}
                </>
              )}
            </Box>
          </Paper>
        ) : (
          // Formulaire de dégustation
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => setShowNewTastingForm(false)}
                sx={{ mr: 2 }}
              >
                Retour
              </Button>
              <Typography variant="h5">
                Nouvelle dégustation
              </Typography>
            </Box>
            
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                mb: 4
              }}
            >
              {/* Intégration du composant de formulaire */}
              <TastingForm 
                onSubmit={handleTastingSubmit}
                onCancel={() => setShowNewTastingForm(false)}
              />
            </Paper>
          </Box>
        )}
      </Container>

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
    </>
  );
};