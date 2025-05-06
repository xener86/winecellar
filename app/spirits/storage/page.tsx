// app/spirits/storage/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Button, 
  Paper, CircularProgress, useTheme, Chip, IconButton,
  Alert, alpha, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import Navbar from '@/components/Navbar';
import { Breadcrumbs } from '@/components/ui/Navigation';
import { useSpiritData } from '../hooks/useSpiritData';
import { SpiritStorageLocation } from '@/utils/types/spirit.types';
import SpiritsGrid from './components/SpiritsGrid';
import AddStorageModal from './components/AddStorageModal';

export default function StoragePage() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const { 
    spirits, 
    storageLocations,
    loading, 
    fetchSpirits,
    fetchStorageLocations
  } = useSpiritData();
  
  const [selectedLocation, setSelectedLocation] = useState<SpiritStorageLocation | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Rafraîchir les données au chargement
  useEffect(() => {
    fetchStorageLocations();
    fetchSpirits();
  }, [fetchStorageLocations, fetchSpirits]);
  
  // Définir l'emplacement sélectionné par défaut
  useEffect(() => {
    if (storageLocations.length > 0 && !selectedLocation) {
      setSelectedLocation(storageLocations[0]);
    }
  }, [storageLocations, selectedLocation]);
  
  // Compter les bouteilles par emplacement
  const countBottlesByLocation = (locationId: string): number => {
    return spirits.filter(s => s.storage.locationId === locationId).length;
  };
  
  // Obtenir la couleur associée au type d'emplacement
  const getStorageTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'bar': '#e65100',
      'cabinet': '#2e7d32',
      'display': '#1565c0',
      'cellar': '#5d4037',
      'other': '#607d8b'
    };
    
    return colorMap[type] || '#607d8b';
  };
  
  // Traduire le type d'emplacement en français
  const getStorageTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'bar': 'Bar',
      'cabinet': 'Armoire',
      'display': 'Vitrine',
      'cellar': 'Cave',
      'other': 'Autre'
    };
    
    return typeMap[type] || 'Autre';
  };
  
  // Gérer la suppression d'un emplacement
  const handleDeleteLocation = async (id: string) => {
    // Vérifier si l'emplacement contient des bouteilles
    const bottleCount = countBottlesByLocation(id);
    if (bottleCount > 0) {
      setError(`Impossible de supprimer cet emplacement, il contient ${bottleCount} bouteille(s)`);
      return;
    }
    
    // Demander confirmation
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet emplacement ?')) {
      return;
    }
    
    try {
      // Supprimer l'emplacement via le service
      // (à implémenter dans useSpiritData.ts)
      // await deleteStorageLocation(id);
      
      // Temporairement, afficher juste un message
      setSuccess('Fonctionnalité en cours d\'implémentation');
      
      // Rafraîchir les données
      await fetchStorageLocations();
      
      // Si l'emplacement supprimé était sélectionné, sélectionner le premier
      if (selectedLocation?.id === id && storageLocations.length > 0) {
        setSelectedLocation(storageLocations[0]);
      }
    } catch (err) {
      setError('Erreur lors de la suppression de l\'emplacement');
      console.error('Erreur suppression emplacement:', err);
    }
  };
  
  // Afficher le chargement
  if (loading) {
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
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Emplacements de Stockage
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setIsAddModalOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Ajouter un emplacement
          </Button>
        </Box>
        
        {/* Affichage des notifications */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        {/* Cas où aucun emplacement n'existe */}
        {storageLocations.length === 0 ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'
            }}
          >
            <WarehouseIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Aucun emplacement de stockage
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Créez votre premier emplacement pour organiser vos spiritueux !
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Ajouter un emplacement
            </Button>
          </Paper>
        ) : (
          <>
            {/* Liste des emplacements */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {storageLocations.map(location => (
                <Grid component="div" key={location.id} sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: location.id === selectedLocation?.id 
                        ? alpha(getStorageTypeColor(location.type), isDarkMode ? 0.2 : 0.1)
                        : isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 2
                      }
                    }}
                    onClick={() => setSelectedLocation(location)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: getStorageTypeColor(location.type),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}
                      >
                        <WarehouseIcon />
                      </Box>
                      
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLocation(location);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLocation(location.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="h6" gutterBottom>
                      {location.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip 
                        label={getStorageTypeLabel(location.type)} 
                        size="small"
                        sx={{ 
                          bgcolor: alpha(getStorageTypeColor(location.type), 0.2),
                          color: getStorageTypeColor(location.type),
                          fontWeight: 'medium'
                        }}
                      />
                      
                      <Typography variant="body2" color="text.secondary">
                        {countBottlesByLocation(location.id)} bouteille(s)
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            
            {/* Contenu de l'emplacement sélectionné */}
            {selectedLocation && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: getStorageTypeColor(selectedLocation.type),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        mr: 2
                      }}
                    >
                      <WarehouseIcon />
                    </Box>
                    
                    <Box>
                      <Typography variant="h5">
                        {selectedLocation.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getStorageTypeLabel(selectedLocation.type)}
                        {selectedLocation.description && ` - ${selectedLocation.description}`}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Chip 
                    label={`${countBottlesByLocation(selectedLocation.id)} bouteille(s)`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                {/* Grille des bouteilles */}
                <SpiritsGrid 
                  storageLocation={selectedLocation}
                  spirits={spirits.filter(s => s.storage.locationId === selectedLocation.id)}
                />
              </Paper>
            )}
          </>
        )}
        
        {/* Modals */}
        <AddStorageModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            setSuccess('Emplacement ajouté avec succès');
            fetchStorageLocations();
          }}
        />
        
        {isEditModalOpen && selectedLocation && (
          <AddStorageModal
            open={isEditModalOpen}
            initialData={selectedLocation}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={() => {
              setIsEditModalOpen(false);
              setSuccess('Emplacement mis à jour avec succès');
              fetchStorageLocations();
            }}
          />
        )}
        
      </Container>
    </>
  );
}