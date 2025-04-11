'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Paper, Button, 
  Divider, IconButton, Chip, Rating, Avatar,
  CircularProgress, Tooltip, Card, CardContent, Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WineBarIcon from '@mui/icons-material/WineBar';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import SpaIcon from '@mui/icons-material/Spa';
import ForestIcon from '@mui/icons-material/Forest';
import GrainIcon from '@mui/icons-material/Grain';
import PetsIcon from '@mui/icons-material/Pets';
import OpacityIcon from '@mui/icons-material/Opacity';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LiquorIcon from '@mui/icons-material/Liquor';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import Navbar from '../../components/Navbar';
import { supabase } from '../../utils/supabase';

// Convertit une valeur de l'échelle 1-5 en description textuelle
const getTextRating = (value, labels) => {
  const index = Math.round(value) - 1;
  return labels[index] || 'Non évalué';
};

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

// Obtient le type de vin à partir de la nuance de couleur
const getWineTypeFromColor = (colorId) => {
  if (!colorId) return null;
  
  // Couleurs rouges
  if (['purple', 'ruby', 'garnet', 'tawny', 'mahogany'].includes(colorId)) {
    return 'red';
  }
  // Couleurs blanches
  else if (['pale_yellow', 'straw_yellow', 'gold', 'amber', 'brown'].includes(colorId)) {
    return 'white';
  }
  // Couleurs rosées
  else if (['pale_pink', 'salmon', 'raspberry', 'coral'].includes(colorId)) {
    return 'rose';
  }
  // Couleurs orange
  else if (['pale_orange', 'medium_orange', 'deep_orange', 'amber_orange'].includes(colorId)) {
    return 'orange';
  }
  // Effervescents
  else if (['pale_sparkling', 'straw_sparkling', 'rose_sparkling', 'amber_sparkling'].includes(colorId)) {
    return 'sparkling';
  }
  
  return null;
};

// Définition des couleurs et descriptions pour affichage
const wineColorInfo = {
  // Rouge
  purple: { name: 'Pourpre', description: 'Vin rouge très jeune', color: '#4B0082' },
  ruby: { name: 'Rubis', description: 'Vin rouge jeune et vif', color: '#E0115F' },
  garnet: { name: 'Grenat', description: 'Vin rouge d\'âge moyen', color: '#C41E3A' },
  tawny: { name: 'Tuilé', description: 'Vin rouge évolué', color: '#A52A2A' },
  mahogany: { name: 'Acajou', description: 'Vin rouge âgé', color: '#800000' },
  
  // Blanc
  pale_yellow: { name: 'Jaune pâle', description: 'Vin blanc très jeune', color: '#FFFFF0' },
  straw_yellow: { name: 'Jaune paille', description: 'Vin blanc jeune', color: '#F0E68C' },
  gold: { name: 'Doré', description: 'Vin blanc d\'âge moyen', color: '#DAA520' },
  amber: { name: 'Ambré', description: 'Vin blanc évolué', color: '#D2B48C' },
  brown: { name: 'Brun doré', description: 'Vin blanc âgé', color: '#B8860B' },
  
  // Rosé
  pale_pink: { name: 'Rose pâle', description: 'Rosé très pâle', color: '#FFE4E1' },
  salmon: { name: 'Saumon', description: 'Rosé saumoné', color: '#FF9E9E' },
  raspberry: { name: 'Framboise', description: 'Rosé vif', color: '#FF69B4' },
  coral: { name: 'Corail', description: 'Rosé intense', color: '#FF7F50' },
  
  // Orange
  pale_orange: { name: 'Orange pâle', description: 'Vin orange léger', color: '#FFDAB9' },
  medium_orange: { name: 'Orange moyen', description: 'Vin orange d\'intensité moyenne', color: '#FFA07A' },
  deep_orange: { name: 'Orange profond', description: 'Vin orange intense', color: '#FF8C00' },
  amber_orange: { name: 'Ambre orangé', description: 'Vin orange évolué', color: '#CD853F' },
  
  // Effervescent
  pale_sparkling: { name: 'Effervescent pâle', description: 'Effervescent très pâle', color: '#F0FFFF' },
  straw_sparkling: { name: 'Effervescent doré', description: 'Effervescent aux reflets dorés', color: '#EEE8AA' },
  rose_sparkling: { name: 'Effervescent rosé', description: 'Effervescent rosé', color: '#FFB6C1' },
  amber_sparkling: { name: 'Effervescent ambré', description: 'Effervescent évolué', color: '#FFDEAD' }
};

// Composant de page de détail d'une dégustation
export default function TastingDetailPage({ params }) {
  const theme = useTheme();
  const router = useRouter();
  const { id } = params; // ID de la dégustation
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tastingData, setTastingData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  // Récupération des données de dégustation
  useEffect(() => {
    const fetchTastingData = async () => {
      try {
        setLoading(true);
        
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
          router.push('/login');
          return;
        }
        
        // Recherche de la dégustation
        const { data, error } = await supabase
          .from('tasting_notes')
          .select(`
            *,
            wine:wine_id (
              id, name, vintage, color, domain, region, appellation
            )
          `)
          .eq('id', id)
          .single();
          
        if (error) throw error;
        if (!data) throw new Error('Dégustation non trouvée');
        
        // Vérifier que l'utilisateur est bien le propriétaire
        if (data.user_id !== authData.user.id) {
          throw new Error('Vous n\'êtes pas autorisé à consulter cette dégustation');
        }
        
        setTastingData(data);
      } catch (error) {
        console.error('Erreur lors du chargement de la dégustation:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTastingData();
  }, [id, router]);
  
  // Suppression d'une dégustation
  const handleDelete = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('tasting_notes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Redirection vers la liste des dégustations
      router.push('/tasting-notes');
    } catch (error) {
      console.error('Erreur lors de la suppression de la dégustation:', error);
      setError(error.message);
      setLoading(false);
    }
  };
  
  // Gestion de l'édition (redirection vers le formulaire)
  const handleEdit = () => {
    router.push(`/tasting-notes/edit/${id}`);
  };
  
  // Affichage d'un radar chart avec Canvas pour visualiser le profil
  const TastingRadarChart = ({ data }) => {
    const canvasRef = React.useRef(null);
    
    useEffect(() => {
      if (!canvasRef.current || !data) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Configuration du graphique
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;
      
      // Données à afficher
      const attributes = [
        { name: 'Intensité', value: data.color_intensity },
        { name: 'Acidité', value: data.acidity },
        { name: data.tannin ? 'Tanins' : 'Douceur', value: data.tannin || 3 },
        { name: 'Corps', value: data.body },
        { name: 'Alcool', value: data.alcohol },
        { name: 'Longueur', value: data.length > 5 ? 5 : data.length / 2 } // Normalisé sur 5
      ];
      
      const numAttributes = attributes.length;
      
      // Effacer le canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dessiner les lignes de fond
      ctx.strokeStyle = 'rgba(200,200,200,0.3)';
      ctx.fillStyle = 'rgba(200,200,200,0.1)';
      
      // Cercles concentriques
      for (let i = 1; i <= 5; i++) {
        const r = (radius / 5) * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
        ctx.stroke();
      }
      
      // Lignes radiales
      for (let i = 0; i < numAttributes; i++) {
        const angle = (i / numAttributes) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + radius * Math.cos(angle),
          centerY + radius * Math.sin(angle)
        );
        ctx.stroke();
        
        // Étiquettes
        const labelRadius = radius + 20;
        ctx.fillStyle = theme.palette.text.secondary;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          attributes[i].name,
          centerX + labelRadius * Math.cos(angle),
          centerY + labelRadius * Math.sin(angle)
        );
      }
      
      // Dessiner le polygone des données
      ctx.beginPath();
      for (let i = 0; i < numAttributes; i++) {
        const angle = (i / numAttributes) * 2 * Math.PI;
        const value = attributes[i].value;
        const pointRadius = (radius / 5) * value;
        
        const x = centerX + pointRadius * Math.cos(angle);
        const y = centerY + pointRadius * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      
      // Remplir avec une couleur semi-transparente
      ctx.fillStyle = 'rgba(140, 20, 20, 0.6)';
      ctx.fill();
      
      // Contour du polygone
      ctx.strokeStyle = 'rgba(140, 20, 20, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Points aux sommets
      ctx.fillStyle = 'rgba(140, 20, 20, 1)';
      for (let i = 0; i < numAttributes; i++) {
        const angle = (i / numAttributes) * 2 * Math.PI;
        const value = attributes[i].value;
        const pointRadius = (radius / 5) * value;
        
        const x = centerX + pointRadius * Math.cos(angle);
        const y = centerY + pointRadius * Math.sin(angle);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
      
    }, [data, theme.palette.text.secondary]);
    
    return (
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={300} 
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    );
  };
  
  // Si le chargement est en cours, afficher un loader
  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }
  
  // Si une erreur s'est produite, l'afficher
  if (error) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button 
            component={Link} 
            href="/tasting-notes" 
            startIcon={<ArrowBackIcon />}
            variant="contained"
          >
            Retour à la liste
          </Button>
        </Container>
      </>
    );
  }
  
  // Si les données de dégustation sont disponibles, les afficher
  if (!tastingData) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="warning">
            Aucune donnée de dégustation trouvée.
          </Alert>
          <Button 
            component={Link} 
            href="/tasting-notes" 
            startIcon={<ArrowBackIcon />}
            variant="contained"
            sx={{ mt: 2 }}
          >
            Retour à la liste
          </Button>
        </Container>
      </>
    );
  }
  
  // Récupérer les arômes spécifiques en tableau
  const specificAromasArray = tastingData.specific_aromas ? 
    tastingData.specific_aromas.split(',').map(a => a.trim()) : 
    [];
  
  // Déterminer le type de vin à partir de la couleur
  const wineType = getWineTypeFromColor(tastingData.color);
  
  // Informations sur la couleur sélectionnée
  const colorInfo = wineColorInfo[tastingData.color] || { 
    name: 'Non spécifiée', 
    description: '', 
    color: '#ccc' 
  };
  
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        {/* Bouton de retour et titre */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button 
            component={Link} 
            href="/tasting-notes" 
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 2 }}
          >
            Retour
          </Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              startIcon={<EditIcon />}
              variant="outlined"
              onClick={handleEdit}
              sx={{ borderRadius: 2 }}
            >
              Modifier
            </Button>
            
            {deleteConfirm ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="error">
                  Confirmer ?
                </Typography>
                <Button 
                  variant="contained" 
                  color="error"
                  size="small"
                  onClick={handleDelete}
                  sx={{ borderRadius: 2 }}
                >
                  Oui
                </Button>
                <Button 
                  variant="outlined"
                  size="small"
                  onClick={() => setDeleteConfirm(false)}
                  sx={{ borderRadius: 2 }}
                >
                  Non
                </Button>
              </Box>
            ) : (
              <Button 
                startIcon={<DeleteIcon />}
                variant="outlined"
                color="error"
                onClick={() => setDeleteConfirm(true)}
                sx={{ borderRadius: 2 }}
              >
                Supprimer
              </Button>
            )}
          </Box>
        </Box>
        
        {/* En-tête avec informations générales */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2, 
            border: '1px solid', 
            borderColor: 'divider',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Badge coup de cœur */}
          {tastingData.is_favorite && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                bgcolor: theme.palette.error.main,
                color: 'white',
                p: '4px 12px',
                transform: 'rotate(45deg) translateX(20px) translateY(-10px)',
                width: 150,
                textAlign: 'center',
                boxShadow: 1,
                zIndex: 1
              }}
            >
              <Typography variant="caption" fontWeight="bold">
                COUP DE CŒUR
              </Typography>
            </Box>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 500 }}>
                {tastingData.wine ? (
                  <>
                    {tastingData.wine.name}
                    {tastingData.wine.vintage && ` ${tastingData.wine.vintage}`}
                  </>
                ) : (
                  <>
                    {tastingData.wine_external?.name || 'Vin non spécifié'}
                    {tastingData.wine_external?.vintage && ` ${tastingData.wine_external.vintage}`}
                  </>
                )}
              </Typography>
              
              {tastingData.wine && (
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {[
                    tastingData.wine.domain,
                    tastingData.wine.appellation,
                    tastingData.wine.region
                  ].filter(Boolean).join(' • ')}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Rating value={tastingData.overall_rating} precision={0.5} readOnly />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({tastingData.overall_rating})
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Chip 
                  icon={<CalendarMonthIcon />} 
                  label={new Date(tastingData.date).toLocaleDateString()}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
                
                {tastingData.location && (
                  <Chip 
                    icon={<LocationOnIcon />} 
                    label={tastingData.location}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                )}
                
                {tastingData.with_who && (
                  <Chip 
                    icon={<PersonIcon />} 
                    label={tastingData.with_who}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                )}
              </Box>
              
              {tastingData.occasion && (
                <Typography variant="body1" paragraph>
                  <strong>Occasion :</strong> {tastingData.occasion}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                {tastingData.serving_temperature && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Température : {tastingData.serving_temperature}°C
                    </Typography>
                  </Box>
                )}
                
                {tastingData.aeration_time && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Aération : {tastingData.aeration_time} min
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    width: '100%',
                    maxWidth: 250,
                    position: 'relative'
                  }}
                >
                  {/* Représentation du verre de vin avec la couleur */}
                  <Box sx={{ position: 'relative', width: 80, height: 120, mb: 2 }}>
                    {/* Corps du verre */}
                    <Box sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 20,
                      width: 40,
                      height: 80,
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.5)',
                      boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                    }}>
                      {/* Contenu du verre (vin) */}
                      <Box sx={{ 
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '95%',
                        backgroundColor: colorInfo.color,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                      }} />
                      
                      {/* Reflet */}
                      <Box sx={{ 
                        position: 'absolute',
                        top: 5,
                        left: 5,
                        width: 10,
                        height: '60%',
                        background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0))',
                        borderRadius: '50%',
                        transform: 'rotate(20deg)',
                      }} />
                    </Box>
                    
                    {/* Pied du verre */}
                    <Box sx={{ 
                      position: 'absolute',
                      bottom: 0,
                      left: 35,
                      width: 10,
                      height: 30,
                      backgroundColor: 'rgba(200,200,200,0.3)',
                    }} />
                    
                    {/* Base du verre */}
                    <Box sx={{ 
                      position: 'absolute',
                      bottom: 0,
                      left: 20,
                      width: 40,
                      height: 5,
                      backgroundColor: 'rgba(200,200,200,0.3)',
                      borderRadius: '50%',
                    }} />
                  </Box>
                  
                  {/* Nom de la couleur */}
                  <Typography variant="subtitle1" align="center">
                    {colorInfo.name}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" align="center">
                    {colorInfo.description}
                  </Typography>
                  
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      Intensité:
                    </Typography>
                    <Rating 
                      value={tastingData.color_intensity} 
                      readOnly 
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      Limpidité:
                    </Typography>
                    <Rating 
                      value={tastingData.clarity} 
                      readOnly 
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      Larmes:
                    </Typography>
                    <Rating 
                      value={tastingData.tears} 
                      readOnly 
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Détails de la dégustation en 3 sections */}
        <Grid container spacing={3}>
          {/* Colonne 1: Nez */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SpaIcon sx={{ mr: 1 }} /> Nez
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Intensité aromatique
                </Typography>
                <Rating 
                  value={tastingData.nose_intensity} 
                  readOnly 
                  size="medium"
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {getTextRating(tastingData.nose_intensity, [
                    'Très faible', 'Faible', 'Moyenne', 'Prononcée', 'Intense'
                  ])}
                </Typography>
              </Box>
              
              {tastingData.aroma_families && tastingData.aroma_families.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Familles d'arômes
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {tastingData.aroma_families.map((family) => {
                      let icon;
                      let label;
                      
                      switch(family) {
                        case 'fruity':
                          icon = <SpaIcon />;
                          label = 'Fruité';
                          break;
                        case 'floral':
                          icon = <LocalFloristIcon />;
                          label = 'Floral';
                          break;
                        case 'woody':
                          icon = <ForestIcon />;
                          label = 'Boisé';
                          break;
                        case 'spicy':
                          icon = <GrainIcon />;
                          label = 'Épicé';
                          break;
                        case 'animal':
                          icon = <PetsIcon />;
                          label = 'Animal';
                          break;
                        case 'mineral':
                          icon = <OpacityIcon />;
                          label = 'Minéral';
                          break;
                        default:
                          icon = <SpaIcon />;
                          label = family;
                      }
                      
                      return (
                        <Chip
                          key={family}
                          icon={icon}
                          label={label}
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 2 }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
              
              {specificAromasArray.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Arômes spécifiques
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {specificAromasArray.map((aroma) => (
                      <Chip
                        key={aroma}
                        label={aroma}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Colonne 2: Bouche */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <LiquorIcon sx={{ mr: 1 }} /> Bouche
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Attaque
                  </Typography>
                  <Typography variant="body2">
                    {getTextRating(tastingData.attack, [
                      'Très molle', 'Molle', 'Moyenne', 'Franche', 'Très franche'
                    ])}
                  </Typography>
                </Box>
                <Box sx={{ 
                  height: 6, 
                  bgcolor: 'rgba(0,0,0,0.1)', 
                  borderRadius: 3, 
                  position: 'relative',
                  mb: 2
                }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    height: '100%', 
                    width: `${(tastingData.attack / 5) * 100}%`,
                    borderRadius: 3,
                    bgcolor: theme.palette.primary.main
                  }} />
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Acidité
                  </Typography>
                  <Typography variant="body2">
                    {getTextRating(tastingData.acidity, [
                      'Très faible', 'Faible', 'Équilibrée', 'Vive', 'Mordante'
                    ])}
                  </Typography>
                </Box>
                <Box sx={{ 
                  height: 6, 
                  bgcolor: 'rgba(0,0,0,0.1)', 
                  borderRadius: 3, 
                  position: 'relative',
                  mb: 2
                }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    height: '100%', 
                    width: `${(tastingData.acidity / 5) * 100}%`,
                    borderRadius: 3,
                    bgcolor: theme.palette.primary.main
                  }} />
                </Box>
              </Box>
              
              {wineType === 'red' && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tanins
                    </Typography>
                    <Typography variant="body2">
                      {getTextRating(tastingData.tannin, [
                        'Très souples', 'Souples', 'Présents', 'Fermes', 'Astringents'
                      ])}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    height: 6, 
                    bgcolor: 'rgba(0,0,0,0.1)', 
                    borderRadius: 3, 
                    position: 'relative',
                    mb: 2
                  }}>
                    <Box sx={{ 
                      position: 'absolute', 
                      left: 0, 
                      top: 0, 
                      height: '100%', 
                      width: `${(tastingData.tannin / 5) * 100}%`,
                      borderRadius: 3,
                      bgcolor: theme.palette.primary.main
                    }} />
                  </Box>
                </Box>
              )}
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Alcool
                  </Typography>
                  <Typography variant="body2">
                    {getTextRating(tastingData.alcohol, [
                      'Très léger', 'Léger', 'Équilibré', 'Chaleureux', 'Puissant'
                    ])}
                  </Typography>
                </Box>
                <Box sx={{ 
                  height: 6, 
                  bgcolor: 'rgba(0,0,0,0.1)', 
                  borderRadius: 3, 
                  position: 'relative',
                  mb: 2
                }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    height: '100%', 
                    width: `${(tastingData.alcohol / 5) * 100}%`,
                    borderRadius: 3,
                    bgcolor: theme.palette.primary.main
                  }} />
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Corps
                  </Typography>
                  <Typography variant="body2">
                    {getTextRating(tastingData.body, [
                      'Très léger', 'Léger', 'Moyen', 'Corpulent', 'Très corpulent'
                    ])}
                  </Typography>
                </Box>
                <Box sx={{ 
                  height: 6, 
                  bgcolor: 'rgba(0,0,0,0.1)', 
                  borderRadius: 3, 
                  position: 'relative',
                  mb: 2
                }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    height: '100%', 
                    width: `${(tastingData.body / 5) * 100}%`,
                    borderRadius: 3,
                    bgcolor: theme.palette.primary.main
                  }} />
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Longueur
                  </Typography>
                  <Typography variant="body2">
                    {tastingData.length} secondes
                  </Typography>
                </Box>
                <Box sx={{ 
                  height: 6, 
                  bgcolor: 'rgba(0,0,0,0.1)', 
                  borderRadius: 3, 
                  position: 'relative',
                  mb: 2
                }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    height: '100%', 
                    width: `${(tastingData.length / 10) * 100}%`,
                    borderRadius: 3,
                    bgcolor: theme.palette.primary.main
                  }} />
                </Box>
              </Box>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <TastingRadarChart data={tastingData} />
              </Box>
            </Paper>
          </Grid>
          
          {/* Colonne 3: Appréciation et accords */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <BookmarkIcon sx={{ mr: 1 }} /> Appréciation globale
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  Note:
                </Typography>
                <Rating 
                  value={tastingData.overall_rating} 
                  readOnly 
                  precision={0.5}
                  size="large"
                />
                <Typography variant="body2" color="text.secondary">
                  ({tastingData.overall_rating}/5)
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                  Phase d'évolution:
                </Typography>
                <Chip
                  label={
                    tastingData.evolution_phase === 'youth' ? 'Jeunesse - À attendre' :
                    tastingData.evolution_phase === 'development' ? 'Développement - En progression' :
                    tastingData.evolution_phase === 'peak' ? 'Apogée - Prêt à boire maintenant' :
                    tastingData.evolution_phase === 'decline' ? 'Déclin - À consommer rapidement' :
                    'Non spécifiée'
                  }
                  color={
                    tastingData.evolution_phase === 'youth' ? 'info' :
                    tastingData.evolution_phase === 'development' ? 'primary' :
                    tastingData.evolution_phase === 'peak' ? 'success' :
                    tastingData.evolution_phase === 'decline' ? 'warning' :
                    'default'
                  }
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
              </Box>
              
              {tastingData.food_pairing && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1, display: 'flex', alignItems: 'center' }}>
                    <RestaurantIcon sx={{ mr: 1, fontSize: 20 }} /> Accord mets-vin:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {tastingData.food_pairing}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      Qualité de l'accord:
                    </Typography>
                    <Rating 
                      value={tastingData.pairing_rating} 
                      readOnly 
                      size="small"
                    />
                  </Box>
                </Box>
              )}
              
              {tastingData.comments && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                    Commentaires:
                  </Typography>
                  <Paper 
                    variant="outlined"
                    sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(0,0,0,0.02)', 
                      borderRadius: 2,
                      borderStyle: 'dashed'
                    }}
                  >
                    <Typography variant="body2">
                      {tastingData.comments}
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<WineBarIcon />}
                component={Link}
                href={tastingData.wine ? `/wines/${tastingData.wine.id}` : '/wines'}
                sx={{ 
                  mt: 2, 
                  borderRadius: 2,
                  display: tastingData.wine ? 'flex' : 'none'
                }}
              >
                Voir la fiche du vin
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}