// app/spirits/details/[id]/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, CircularProgress, 
  Button, useTheme, alpha, Chip, 
  Grid, List, ListItem, 
  ListItemText, IconButton, Alert, Tabs, Tab
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import PlaceIcon from '@mui/icons-material/Place';
import EuroIcon from '@mui/icons-material/Euro';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PrintIcon from '@mui/icons-material/Print';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import Navbar from '@/components/Navbar';
import { Breadcrumbs } from '@/components/ui/Navigation';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSpiritData } from '../../hooks/useSpiritData';
import { useMixologyData } from '../../hooks/useMixologyData';
import { Cocktail } from '@/utils/types/cocktail.types';
import CocktailCard from '../../components/CocktailCard';

export default function SpiritDetailsPage() {
  // Utiliser useParams pour obtenir l'ID directement
  const params = useParams();
  const id = params.id as string;
  
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const { 
    spirits, 
    selectedSpirit, 
    setSelectedSpirit,
    loading: spiritLoading, 
    deleteSpirit,
    fetchSpirits
  } = useSpiritData();
  
  const {
    getCocktailsForSpirit,
    updateCocktail
  } = useMixologyData();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [cocktailsLoading, setCocktailsLoading] = useState(false);
  
  // Récupérer les détails du spiritueux
  useEffect(() => {
    const loadSpirit = async () => {
      // Vérifier si les spiritueux sont déjà chargés
      if (spirits.length > 0) {
        const foundSpirit = spirits.find(s => s.id === id);
        if (foundSpirit) {
          setSelectedSpirit(foundSpirit);
          return;
        }
      }
      
      // Si non, charger tous les spiritueux
      await fetchSpirits();
    };
    
    loadSpirit();
  }, [id, spirits, fetchSpirits, setSelectedSpirit]);
  
  // Charger les cocktails associés
  useEffect(() => {
    const loadCocktails = async () => {
      if (!selectedSpirit) return;
      
      setCocktailsLoading(true);
      try {
        const spiritCocktails = await getCocktailsForSpirit(selectedSpirit);
        setCocktails(spiritCocktails);
      } catch (error) {
        console.error('Erreur lors du chargement des cocktails:', error);
      } finally {
        setCocktailsLoading(false);
      }
    };
    
    if (activeTab === 1) {
      loadCocktails();
    }
  }, [selectedSpirit, activeTab, getCocktailsForSpirit]);
  
  // Gérer la suppression du spiritueux
  const handleDelete = async () => {
    // Demander confirmation
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce spiritueux ?')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const success = await deleteSpirit(id);
      
      if (success) {
        router.push('/spirits');
      } else {
        throw new Error('Erreur lors de la suppression du spiritueux');
      }
    } catch (err) {
      setError('Erreur lors de la suppression du spiritueux');
      console.error('Erreur suppression spiritueux:', err);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Gérer le changement de favoris pour un cocktail
  const handleToggleCocktailFavorite = async (cocktailId: string, value: boolean) => {
    try {
      await updateCocktail(cocktailId, { isFavorite: value });
      // Mettre à jour l'état local
      setCocktails(prevCocktails => 
        prevCocktails.map(c => 
          c.id === cocktailId ? { ...c, isFavorite: value } : c
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour des favoris:', error);
    }
  };
  
  // Traduire le type de spiritueux en français
  const getSpiritTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'whisky': 'Whisky',
      'rum': 'Rhum',
      'gin': 'Gin',
      'vodka': 'Vodka',
      'tequila': 'Tequila',
      'brandy': 'Brandy',
      'liqueur': 'Liqueur',
      'other': 'Autre'
    };
    
    return typeMap[type] || 'Autre';
  };
  
  // Obtenir la couleur associée au type de spiritueux
  const getSpiritTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'whisky': '#cd7f32',
      'rum': '#8b4513',
      'gin': '#add8e6',
      'vodka': '#f5f5f5',
      'tequila': '#ffdb58',
      'brandy': '#964b00',
      'liqueur': '#ff69b4',
      'other': '#aaaaaa'
    };
    
    return colorMap[type] || '#aaaaaa';
  };
  
  // Imprimer la fiche
  const handlePrint = () => {
    window.print();
  };
  
  // Formater le niveau de remplissage
  const getFillLevelLabel = (level: string): string => {
    const levelMap: Record<string, string> = {
      'full': 'Pleine (100%)',
      'threeFourths': 'Trois quarts (75%)',
      'half': 'Moitié (50%)',
      'oneFourth': 'Un quart (25%)',
      'empty': 'Vide (0%)'
    };
    
    return levelMap[level] || 'Inconnu';
  };
  
  // Afficher un écran de chargement
  if (spiritLoading || !selectedSpirit) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Breadcrumbs />
        
        {/* En-tête avec boutons d'action */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={3}
          className="no-print" // Ne pas imprimer cette partie
        >
          <Button
            component={Link}
            href="/spirits"
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 2 }}
          >
            Retour
          </Button>
          
          <Box display="flex" gap={1}>
            <IconButton
              color="primary"
              component={Link}
              href={`/spirits/edit/${id}`}
              title="Modifier"
            >
              <EditIcon />
            </IconButton>
            
            <IconButton
              color="primary"
              onClick={handlePrint}
              title="Imprimer la fiche"
            >
              <PrintIcon />
            </IconButton>
            
            <IconButton
              color="error"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Supprimer"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* Affichage des erreurs */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} className="no-print">
            {error}
          </Alert>
        )}
        
        {/* En-tête du spiritueux */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 0, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
            overflow: 'hidden',
            mb: 3
          }}
        >
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              minHeight: '200px'
            }}
          >
            {/* Image de la bouteille ou placeholder */}
            <Box 
              sx={{ 
                width: { xs: '100%', md: '30%' },
                minHeight: '200px',
                bgcolor: alpha(getSpiritTypeColor(selectedSpirit.type), isDarkMode ? 0.2 : 0.1),
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              {selectedSpirit.bottleImage ? (
                <Box 
                  component="img"
                  src={selectedSpirit.bottleImage}
                  alt={selectedSpirit.name}
                  sx={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    p: 2
                  }}
                />
              ) : (
                <Box 
                  sx={{ 
                    height: 150,
                    width: 60,
                    borderRadius: '10px 10px 4px 4px',
                    border: `1px solid ${theme.palette.divider}`,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column-reverse'
                  }}
                >
                  <Box 
                    sx={{ 
                      height: selectedSpirit.storage.fillLevel === 'full' ? '100%' 
                        : selectedSpirit.storage.fillLevel === 'threeFourths' ? '75%'
                        : selectedSpirit.storage.fillLevel === 'half' ? '50%'
                        : selectedSpirit.storage.fillLevel === 'oneFourth' ? '25%'
                        : '0%',
                      width: '100%',
                      backgroundColor: getSpiritTypeColor(selectedSpirit.type),
                      opacity: 0.8
                    }}
                  />
                </Box>
              )}
              
              {/* Badge de type */}
              <Chip
                label={getSpiritTypeLabel(selectedSpirit.type)}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  bgcolor: alpha(getSpiritTypeColor(selectedSpirit.type), 0.8),
                  color: selectedSpirit.type === 'vodka' ? 'black' : 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
            
            {/* Informations du spiritueux */}
            <Box 
              sx={{ 
                width: { xs: '100%', md: '70%' },
                p: 3,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ fontWeight: 'bold' }}
              >
                {selectedSpirit.name}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {selectedSpirit.subType && (
                  <Chip 
                    label={selectedSpirit.subType}
                    variant="outlined"
                  />
                )}
                
                {selectedSpirit.age && (
                  <Chip 
                    label={`${selectedSpirit.age} ans`}
                    variant="outlined"
                  />
                )}
                
                {selectedSpirit.vintage && (
                  <Chip 
                    label={`Millésime ${selectedSpirit.vintage}`}
                    variant="outlined"
                  />
                )}
                
                <Chip 
                  label={`${selectedSpirit.abv}%`}
                  variant="outlined"
                  color="primary"
                />
              </Box>
              
              <Typography variant="body1" paragraph>
                <PlaceIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'text.secondary' }} />
                {selectedSpirit.origin.distillery && (
                  <strong>{selectedSpirit.origin.distillery}, </strong>
                )}
                {selectedSpirit.origin.region && (
                  <span>{selectedSpirit.origin.region}, </span>
                )}
                <span>{selectedSpirit.origin.country}</span>
              </Typography>
              
              <Typography variant="body1">
                <CalendarTodayIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'text.secondary' }} />
                <span>Acquis le {new Date(selectedSpirit.acquisition.date).toLocaleDateString()}</span>
                {selectedSpirit.acquisition.price && (
                  <>
                    <EuroIcon sx={{ ml: 2, mr: 1, verticalAlign: 'middle', color: 'text.secondary' }} />
                    <span>{selectedSpirit.acquisition.price} €</span>
                  </>
                )}
              </Typography>
              
              <Typography variant="body1" sx={{ mt: 1 }}>
                <WaterDropIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'text.secondary' }} />
                <span>Niveau: {getFillLevelLabel(selectedSpirit.storage.fillLevel)}</span>
              </Typography>
            </Box>
          </Box>
        </Paper>
        
        {/* Onglets */}
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
            overflow: 'hidden',
            mb: 3
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={(_e, val) => setActiveTab(val)}
            sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Détails" />
            <Tab label="Cocktails" />
            {selectedSpirit.notes && <Tab label="Notes" />}
          </Tabs>
          
          {/* Onglet Détails */}
          {activeTab === 0 && (
            <Box p={3}>
              <Grid container spacing={3}>
                {/* Caractéristiques */}
                {(selectedSpirit.details.color || 
                  selectedSpirit.details.finish || 
                  selectedSpirit.details.tastingNotes || 
                  selectedSpirit.details.ingredients) && (
                  <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
                    <Typography variant="h6" gutterBottom>
                      Caractéristiques
                    </Typography>
                    
                    <List>
                      {selectedSpirit.details.color && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Couleur"
                            secondary={selectedSpirit.details.color}
                          />
                        </ListItem>
                      )}
                      
                      {selectedSpirit.details.finish && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Finition"
                            secondary={selectedSpirit.details.finish}
                          />
                        </ListItem>
                      )}
                      
                      {selectedSpirit.details.ingredients && selectedSpirit.details.ingredients.length > 0 && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Ingrédients"
                            secondary={
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                {selectedSpirit.details.ingredients.map((ingredient, idx) => (
                                  <Chip
                                    key={idx}
                                    label={ingredient}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                  />
                                ))}
                              </Box>
                            }
                          />
                        </ListItem>
                      )}
                    </List>
                  </Grid>
                )}
                
                {/* Notes de dégustation */}
                {selectedSpirit.details.tastingNotes && selectedSpirit.details.tastingNotes.length > 0 && (
                  <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
                    <Typography variant="h6" gutterBottom>
                      Notes de dégustation
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedSpirit.details.tastingNotes.map((note, idx) => (
                        <Chip
                          key={idx}
                          label={note}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
                
                {/* Tags personnalisés */}
                {selectedSpirit.customTags && selectedSpirit.customTags.length > 0 && (
                  <Grid component="div" sx={{ width: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Tags
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedSpirit.customTags.map((tag, idx) => (
                        <Chip
                          key={idx}
                          label={tag}
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
          
          {/* Onglet Cocktails */}
          {activeTab === 1 && (
            <Box p={3}>
              {cocktailsLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : cocktails.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Aucun cocktail trouvé
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Vous n&apos;avez pas encore de cocktails utilisant ce spiritueux.
                  </Typography>
                  <Button
                    component={Link}
                    href="/spirits/mixology/create"
                    variant="contained"
                    startIcon={<LocalBarIcon />}
                  >
                    Créer un cocktail
                  </Button>
                </Box>
              ) : (
                <>
                  <Typography variant="body1" paragraph>
                    Cocktails utilisant {selectedSpirit.name}:
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {cocktails.map(cocktail => (
                      <Grid component="div" key={cocktail.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                        <CocktailCard 
                          cocktail={cocktail}
                          onToggleFavorite={handleToggleCocktailFavorite}
                          availableSpirits={spirits}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </Box>
          )}
          
          {/* Onglet Notes */}
          {activeTab === 2 && selectedSpirit.notes && (
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Notes personnelles
              </Typography>
              
              <Typography paragraph>
                {selectedSpirit.notes}
              </Typography>
            </Box>
          )}
        </Paper>
        
        {/* Styles pour l'impression */}
        <style jsx global>{`
          @media print {
            .no-print {
              display: none !important;
            }
            
            body {
              color: black;
              background: white;
            }
            
            @page {
              size: A4;
              margin: 1.5cm;
            }
            
            h1 {
              font-size: 24pt !important;
            }
            
            h2, h3, h4, h5, h6 {
              page-break-after: avoid;
            }
          }
        `}</style>
      </Container>
    </>
  );
}