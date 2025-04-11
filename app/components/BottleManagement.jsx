'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Stack, Tooltip, Divider, Alert, Snackbar,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import fr from 'date-fns/locale/fr';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import WineBarIcon from '@mui/icons-material/WineBar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { supabase } from '../utils/supabase';

// Statuts possibles pour les bouteilles
const BOTTLE_STATUSES = {
  in_stock: { label: 'En stock', color: 'success' },
  consumed: { label: 'Consommée', color: 'error' },
  gifted: { label: 'Offerte', color: 'warning' },
  lost: { label: 'Perdue', color: 'default' }
};

// Composant principal de gestion des bouteilles
export default function BottleManagement({ wineId }) {
  const [bottles, setBottles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [positions, setPositions] = useState([]);
  const [availablePositions, setAvailablePositions] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [consumeDialogOpen, setConsumeDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [addMultipleDialogOpen, setAddMultipleDialogOpen] = useState(false);
  const [selectedBottle, setSelectedBottle] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // États pour le dialogue d'ajout de bouteille
  const [newBottleData, setNewBottleData] = useState({
    acquisition_date: null,
    position_id: null
  });
  
  // États pour le dialogue d'ajout multiple
  const [multipleBottleData, setMultipleBottleData] = useState({
    count: 1,
    acquisition_date: null
  });
  
  // États pour le dialogue de consommation
  const [consumeData, setConsumeData] = useState({
    consumption_date: new Date(),
    tasting_note: ''
  });
  
  // États pour le dialogue de déplacement
  const [moveData, setMoveData] = useState({
    position_id: null
  });

  // Charger les bouteilles et les emplacements
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Récupérer les bouteilles pour ce vin
        const { data: bottlesData, error: bottlesError } = await supabase
          .from('bottle')
          .select(`
            id, 
            status, 
            acquisition_date, 
            consumption_date, 
            tasting_note,
            position_id,
            position:position_id (
              id, 
              row_position, 
              column_position,
              storage_location:storage_location_id (
                id, 
                name
              )
            )
          `)
          .eq('wine_id', wineId)
          .order('created_at', { ascending: false });
        
        if (bottlesError) throw bottlesError;
        setBottles(bottlesData || []);
        
        // Récupérer tous les emplacements de stockage
        const { data: locationData, error: locationError } = await supabase
          .from('storage_location')
          .select('*')
          .order('name');
        
        if (locationError) throw locationError;
        setLocations(locationData || []);
        
        // Récupérer toutes les positions
        const { data: positionData, error: positionError } = await supabase
          .from('position')
          .select(`
            id, 
            row_position, 
            column_position, 
            storage_location_id,
            storage_location:storage_location_id (
              name
            )
          `);
        
        if (positionError) throw positionError;
        setPositions(positionData || []);
        
        // Identifier les positions disponibles (sans bouteille)
        const { data: occupiedPositionsData, error: occupiedError } = await supabase
        .from('bottle')
        .select('position_id')
        .not('position_id', 'is', null)
        .eq('status', 'in_stock');
      
      if (occupiedError) throw occupiedError;
      
      const { data: occupiedWinePositionsData, error: occupiedWineError } = await supabase
      .from('wine')
      .select('position_id')
      .not('position_id', 'is', null);
    
      if (occupiedWineError) throw occupiedWineError;

        
        const occupiedPositionIds = new Set(
          occupiedPositionsData?.map(item => item.position_id) || []
        );
        
        const available = positionData?.filter(pos => !occupiedPositionIds.has(pos.id)) || [];
        setAvailablePositions(available);
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
    
    if (wineId) fetchData();
  }, [wineId]);

  // Formater les emplacements pour l'affichage dans les menus déroulants
  const formatPositionLabel = (position) => {
    if (!position) return 'Non spécifié';
    const locationName = position.storage_location?.name || 'Emplacement inconnu';
    return `${locationName} (${position.row_position}, ${position.column_position})`;
  };

  // Ajouter une nouvelle bouteille
  const handleAddBottle = async () => {
    try {
      // Obtenir l'utilisateur actuel
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error("Utilisateur non authentifié");
      }

      const { data: bottleData, error: bottleError } = await supabase
        .from('bottle')
        .insert([{
          wine_id: wineId,
          status: 'in_stock',
          acquisition_date: newBottleData.acquisition_date,
          position_id: newBottleData.position_id || null,
          user_id: userData.user.id
        }])
        .select();
      
      if (bottleError) throw bottleError;
      
      // Mise à jour de l'interface
      if (bottleData && bottleData[0]) {
        const newBottle = bottleData[0];
        
        // Si une position a été définie, ajouter les informations de position
        if (newBottle.position_id) {
          const position = positions.find(p => p.id === newBottle.position_id);
          if (position) {
            newBottle.position = position;
          }
        }
        
        setBottles([newBottle, ...bottles]);
        
        // Mettre à jour les positions disponibles
        if (newBottle.position_id) {
          setAvailablePositions(availablePositions.filter(p => p.id !== newBottle.position_id));
        }
      }
      
      setDialogOpen(false);
      setNewBottleData({ acquisition_date: null, position_id: null });
      
      setNotification({
        open: true,
        message: 'Bouteille ajoutée avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la bouteille:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };

  // Ajouter plusieurs bouteilles à la fois
  const handleAddMultipleBottles = async () => {
    try {
      // Obtenir l'utilisateur actuel
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error("Utilisateur non authentifié");
      }

      const count = parseInt(multipleBottleData.count);
      if (isNaN(count) || count <= 0) {
        throw new Error('Le nombre de bouteilles doit être un entier positif');
      }
      
      // Préparer les données pour l'insertion
      const bottlesToAdd = Array(count).fill().map(() => ({
        wine_id: wineId,
        status: 'in_stock',
        acquisition_date: multipleBottleData.acquisition_date,
        user_id: userData.user.id
      }));
      
      const { data: bottleData, error: bottleError } = await supabase
        .from('bottle')
        .insert(bottlesToAdd)
        .select();
      
      if (bottleError) throw bottleError;
      
      // Recharger toutes les bouteilles pour simplifier
      const { data: updatedBottles, error: fetchError } = await supabase
        .from('bottle')
        .select(`
          id, 
          status, 
          acquisition_date, 
          consumption_date, 
          tasting_note,
          position_id,
          position:position_id (
            id, 
            row_position, 
            column_position,
            storage_location:storage_location_id (
              id, 
              name
            )
          )
        `)
        .eq('wine_id', wineId)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setBottles(updatedBottles || []);
      
      setAddMultipleDialogOpen(false);
      setMultipleBottleData({ count: 1, acquisition_date: null });
      
      setNotification({
        open: true,
        message: `${count} bouteilles ajoutées avec succès`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de bouteilles:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };

  // Marquer une bouteille comme consommée
  const handleConsumeBottle = async () => {
    if (!selectedBottle) return;
    
    try {
      const { error } = await supabase
        .from('bottle')
        .update({
          status: 'consumed',
          consumption_date: consumeData.consumption_date,
          tasting_note: consumeData.tasting_note,
          position_id: null // Libérer l'emplacement
        })
        .eq('id', selectedBottle.id);
      
      if (error) throw error;
      
      // Mise à jour de l'interface
      const updatedBottles = bottles.map(bottle => 
        bottle.id === selectedBottle.id 
          ? { 
              ...bottle, 
              status: 'consumed', 
              consumption_date: consumeData.consumption_date,
              tasting_note: consumeData.tasting_note,
              position_id: null,
              position: null 
            } 
          : bottle
      );
      
      setBottles(updatedBottles);
      
      // Si la bouteille avait une position, la rendre disponible
      if (selectedBottle.position_id) {
        const position = positions.find(p => p.id === selectedBottle.position_id);
        if (position) {
          setAvailablePositions([...availablePositions, position]);
        }
      }
      
      setConsumeDialogOpen(false);
      setSelectedBottle(null);
      setConsumeData({ consumption_date: new Date(), tasting_note: '' });
      
      setNotification({
        open: true,
        message: 'Bouteille marquée comme consommée',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la consommation de la bouteille:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };

  // Marquer une bouteille comme offerte
  const handleGiftBottle = async (bottle) => {
    try {
      const { error } = await supabase
        .from('bottle')
        .update({
          status: 'gifted',
          position_id: null // Libérer l'emplacement
        })
        .eq('id', bottle.id);
      
      if (error) throw error;
      
      // Mise à jour de l'interface
      const updatedBottles = bottles.map(b => 
        b.id === bottle.id 
          ? { ...b, status: 'gifted', position_id: null, position: null } 
          : b
      );
      
      setBottles(updatedBottles);
      
      // Si la bouteille avait une position, la rendre disponible
      if (bottle.position_id) {
        const position = positions.find(p => p.id === bottle.position_id);
        if (position) {
          setAvailablePositions([...availablePositions, position]);
        }
      }
      
      setNotification({
        open: true,
        message: 'Bouteille marquée comme offerte',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };

  // Déplacer une bouteille vers un nouvel emplacement
  const handleMoveBottle = async () => {
    if (!selectedBottle) return;
    
    try {
      const { error } = await supabase
        .from('bottle')
        .update({
          position_id: moveData.position_id
        })
        .eq('id', selectedBottle.id);
      
      if (error) throw error;
      
      // Mise à jour de l'interface
      const newPosition = positions.find(p => p.id === moveData.position_id);
      
      const updatedBottles = bottles.map(bottle => 
        bottle.id === selectedBottle.id 
          ? { ...bottle, position_id: moveData.position_id, position: newPosition } 
          : bottle
      );
      
      setBottles(updatedBottles);
      
      // Mettre à jour les positions disponibles
      const oldPositionId = selectedBottle.position_id;
      if (oldPositionId) {
        const oldPosition = positions.find(p => p.id === oldPositionId);
        if (oldPosition) {
          setAvailablePositions([...availablePositions, oldPosition]);
        }
      }
      
      setAvailablePositions(availablePositions.filter(p => p.id !== moveData.position_id));
      
      setMoveDialogOpen(false);
      setSelectedBottle(null);
      setMoveData({ position_id: null });
      
      setNotification({
        open: true,
        message: 'Bouteille déplacée avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors du déplacement de la bouteille:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };

  // Supprimer une bouteille
  const handleDeleteBottle = async (bottle) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette bouteille ?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('bottle')
        .delete()
        .eq('id', bottle.id);
      
      if (error) throw error;
      
      // Mise à jour de l'interface
      setBottles(bottles.filter(b => b.id !== bottle.id));
      
      // Si la bouteille avait une position, la rendre disponible
      if (bottle.position_id) {
        const position = positions.find(p => p.id === bottle.position_id);
        if (position) {
          setAvailablePositions([...availablePositions, position]);
        }
      }
      
      setNotification({
        open: true,
        message: 'Bouteille supprimée avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la bouteille:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };

  // Fonction pour optimiser le placement des bouteilles
  const handleOptimizePlacement = async () => {
    try {
      // Récupérer les bouteilles sans position
      const bottlesWithoutPosition = bottles.filter(
        bottle => bottle.status === 'in_stock' && !bottle.position_id
      );
      
      if (bottlesWithoutPosition.length === 0) {
        setNotification({
          open: true,
          message: 'Aucune bouteille à placer',
          severity: 'info'
        });
        return;
      }
      
      if (availablePositions.length === 0) {
        setNotification({
          open: true,
          message: 'Aucun emplacement disponible',
          severity: 'warning'
        });
        return;
      }
      
      // Regrouper les positions par emplacement
      const locationGroups = {};
      availablePositions.forEach(position => {
        const locationId = position.storage_location_id;
        if (!locationGroups[locationId]) {
          locationGroups[locationId] = [];
        }
        locationGroups[locationId].push(position);
      });
      
      // Trier les emplacements par nombre de positions disponibles (décroissant)
      const sortedLocations = Object.keys(locationGroups).sort(
        (a, b) => locationGroups[b].length - locationGroups[a].length
      );
      
      // Placer les bouteilles en privilégiant les emplacements avec le plus de places
      const placements = [];
      let bottleIndex = 0;
      
      for (const locationId of sortedLocations) {
        const positionsInLocation = locationGroups[locationId];
        
        for (const position of positionsInLocation) {
          if (bottleIndex >= bottlesWithoutPosition.length) break;
          
          const bottle = bottlesWithoutPosition[bottleIndex];
          placements.push({
            bottleId: bottle.id,
            positionId: position.id
          });
          
          bottleIndex++;
        }
        
        if (bottleIndex >= bottlesWithoutPosition.length) break;
      }
      
      // Effectuer les mises à jour en base de données
      for (const placement of placements) {
        const { error } = await supabase
          .from('bottle')
          .update({ position_id: placement.positionId })
          .eq('id', placement.bottleId);
        
        if (error) throw error;
      }
      
      // Recharger les données
      const { data: updatedBottles, error: fetchError } = await supabase
        .from('bottle')
        .select(`
          id, 
          status, 
          acquisition_date, 
          consumption_date, 
          tasting_note,
          position_id,
          position:position_id (
            id, 
            row_position, 
            column_position,
            storage_location:storage_location_id (
              id, 
              name
            )
          )
        `)
        .eq('wine_id', wineId)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setBottles(updatedBottles || []);
      
      // Mettre à jour les positions disponibles
      const usedPositionIds = new Set(placements.map(p => p.positionId));
      setAvailablePositions(availablePositions.filter(p => !usedPositionIds.has(p.id)));
      
      setNotification({
        open: true,
        message: `${placements.length} bouteilles placées avec succès`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de l\'optimisation du placement:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };

  // Fonction pour l'optimisation avancée avec IA
  const handleAdvancedOptimization = async () => {
    try {
      setNotification({
        open: true,
        message: "Optimisation IA en cours de développement",
        severity: 'info'
      });
      
      // À implémenter une fois que le fichier utils/bottleOptimization.js est créé
      /*
      const result = await advancedOptimizePlacement();
      
      if (result.success) {
        // Recharger les données
        const { data: updatedBottles, error: fetchError } = await supabase
          .from('bottle')
          .select(`
            id, 
            status, 
            acquisition_date, 
            consumption_date, 
            tasting_note,
            position_id,
            position:position_id (
              id, 
              row_position, 
              column_position,
              storage_location:storage_location_id (
                id, 
                name
              )
            )
          `)
          .eq('wine_id', wineId)
          .order('created_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        setBottles(updatedBottles || []);
        
        setNotification({
          open: true,
          message: result.message,
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: result.error || 'Erreur lors de l\'optimisation',
          severity: 'error'
        });
      }
      */
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };

  // Compter les bouteilles par statut
  const bottleStats = {
    total: bottles.length,
    in_stock: bottles.filter(b => b.status === 'in_stock').length,
    consumed: bottles.filter(b => b.status === 'consumed').length,
    gifted: bottles.filter(b => b.status === 'gifted').length,
    lost: bottles.filter(b => b.status === 'lost').length,
    positioned: bottles.filter(b => b.status === 'in_stock' && b.position_id).length,
    unpositioned: bottles.filter(b => b.status === 'in_stock' && !b.position_id).length
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête avec statistiques */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Gestion des bouteilles
        </Typography>
        
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip 
            icon={<WineBarIcon />} 
            label={`${bottleStats.total} bouteilles au total`} 
            color="default" 
            variant="outlined"
          />
          <Chip 
            label={`${bottleStats.in_stock} en stock`} 
            color="success" 
            variant="outlined"
          />
          <Chip 
            label={`${bottleStats.consumed} consommées`} 
            color="error" 
            variant="outlined"
          />
          <Chip 
            label={`${bottleStats.gifted} offertes`} 
            color="warning" 
            variant="outlined"
          />
        </Stack>
        
        {bottleStats.in_stock > 0 && (
          <Stack direction="row" spacing={1}>
            <Chip 
              icon={<LocationOnIcon />}
              label={`${bottleStats.positioned} placées`} 
              color="info" 
              variant="outlined"
            />
            {bottleStats.unpositioned > 0 && (
              <Chip 
                label={`${bottleStats.unpositioned} non placées`} 
                color="default" 
                variant="outlined"
              />
            )}
          </Stack>
        )}
      </Box>
      
      {/* Boutons d'action */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Ajouter une bouteille
        </Button>
        
        <Button 
          variant="outlined" 
          startIcon={<AddIcon />}
          onClick={() => setAddMultipleDialogOpen(true)}
        >
          Ajouter plusieurs
        </Button>
        
        {bottleStats.unpositioned > 0 && availablePositions.length > 0 && (
          <>
            <Button 
              variant="outlined" 
              startIcon={<EditLocationIcon />}
              onClick={handleOptimizePlacement}
            >
              Optimiser le placement
            </Button>
            
            <Button 
              variant="outlined" 
              startIcon={<AutoFixHighIcon />}
              onClick={handleAdvancedOptimization}
              sx={{ ml: 1 }}
            >
              Optimisation IA
            </Button>
          </>
        )}
      </Stack>
      
      {bottles.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucune bouteille enregistrée pour ce vin.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Statut</TableCell>
                <TableCell>Acquisition</TableCell>
                <TableCell>Emplacement</TableCell>
                <TableCell>Informations</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bottles.map((bottle) => {
                const statusInfo = BOTTLE_STATUSES[bottle.status] || { label: bottle.status, color: 'default' };
                
                return (
                  <TableRow key={bottle.id} hover>
                    <TableCell>
                      <Chip 
                        label={statusInfo.label} 
                        color={statusInfo.color} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {bottle.acquisition_date 
                        ? new Date(bottle.acquisition_date).toLocaleDateString('fr-FR')
                        : 'Non spécifiée'}
                    </TableCell>
                    <TableCell>
                      {bottle.status === 'in_stock' ? (
                        bottle.position 
                          ? (
                            <Tooltip title="Voir l'emplacement">
                              <Chip
                                icon={<LocationOnIcon />}
                                label={formatPositionLabel(bottle.position)}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            </Tooltip>
                          )
                          : (
                            <Chip
                              label="Non placée"
                              size="small"
                              variant="outlined"
                            />
                          )
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {bottle.status === 'consumed' && (
                        <Box>
                          <Typography variant="caption" display="block">
                            Consommée le: {bottle.consumption_date 
                              ? new Date(bottle.consumption_date).toLocaleDateString('fr-FR')
                              : 'N/A'}
                          </Typography>
                          {bottle.tasting_note && (
                            <Tooltip title={bottle.tasting_note}>
                              <Chip
                                icon={<RestaurantIcon />}
                                label="Note de dégustation"
                                size="small"
                                variant="outlined"
                              />
                            </Tooltip>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {bottle.status === 'in_stock' && (
                          <>
                            <Tooltip title="Déplacer">
                              <IconButton 
                                size="small" 
                                color="info"
                                onClick={() => {
                                  setSelectedBottle(bottle);
                                  setMoveDialogOpen(true);
                                }}
                              >
                                <EditLocationIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Consommer">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => {
                                  setSelectedBottle(bottle);
                                  setConsumeDialogOpen(true);
                                }}
                              >
                                <RestaurantIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Marquer comme offerte">
                              <IconButton 
                                size="small" 
                                color="warning"
                                onClick={() => handleGiftBottle(bottle)}
                              >
                                <CardGiftcardIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteBottle(bottle)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Dialogue d'ajout de bouteille */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Ajouter une bouteille</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Box sx={{ pt: 1 }}>
              <DatePicker
                label="Date d'acquisition"
                value={newBottleData.acquisition_date}
                onChange={(date) => setNewBottleData({...newBottleData, acquisition_date: date})}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </Box>
          </LocalizationProvider>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Emplacement (optionnel)</InputLabel>
            <Select
              value={newBottleData.position_id || ''}
              label="Emplacement (optionnel)"
              onChange={(e) => setNewBottleData({...newBottleData, position_id: e.target.value || null})}
              displayEmpty
            >
              <MenuItem value="">Non spécifié</MenuItem>
              <Divider />
              {locations.map(location => [
                <MenuItem key={`header-${location.id}`} disabled sx={{ opacity: 0.7 }}>
                  {location.name}
                </MenuItem>,
                ...availablePositions
                  .filter(position => position.storage_location_id === location.id)
                  .map(position => (
                    <MenuItem key={position.id} value={position.id}>
                      {location.name} - Position ({position.row_position}, {position.column_position})
                    </MenuItem>
                  ))
              ])}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={handleAddBottle}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue d'ajout multiple */}
      <Dialog 
        open={addMultipleDialogOpen} 
        onClose={() => setAddMultipleDialogOpen(false)}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Ajouter plusieurs bouteilles</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nombre de bouteilles"
              type="number"
              value={multipleBottleData.count}
              onChange={(e) => setMultipleBottleData({
                ...multipleBottleData, 
                count: parseInt(e.target.value) || 1
              })}
              InputProps={{ inputProps: { min: 1 } }}
              margin="normal"
            />
          </Box>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Box sx={{ pt: 1 }}>
              <DatePicker
                label="Date d'acquisition (pour toutes)"
                value={multipleBottleData.acquisition_date}
                onChange={(date) => setMultipleBottleData({
                  ...multipleBottleData, 
                  acquisition_date: date
                })}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </Box>
          </LocalizationProvider>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            Les bouteilles seront ajoutées sans emplacement. Vous pourrez les placer individuellement 
            ou utiliser la fonction d'optimisation du placement.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMultipleDialogOpen(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={handleAddMultipleBottles}
          >
            Ajouter {multipleBottleData.count} bouteille{multipleBottleData.count > 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de consommation */}
      <Dialog 
        open={consumeDialogOpen} 
        onClose={() => setConsumeDialogOpen(false)}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Marquer comme consommée</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Box sx={{ pt: 1 }}>
              <DatePicker
                label="Date de consommation"
                value={consumeData.consumption_date}
                onChange={(date) => setConsumeData({...consumeData, consumption_date: date})}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </Box>
          </LocalizationProvider>
          
          <TextField
            label="Notes de dégustation"
            multiline
            rows={4}
            value={consumeData.tasting_note}
            onChange={(e) => setConsumeData({...consumeData, tasting_note: e.target.value})}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConsumeDialogOpen(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleConsumeBottle}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de déplacement */}
      <Dialog 
        open={moveDialogOpen} 
        onClose={() => setMoveDialogOpen(false)}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Déplacer la bouteille</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Nouvel emplacement</InputLabel>
            <Select
              value={moveData.position_id || ''}
              label="Nouvel emplacement"
              onChange={(e) => setMoveData({...moveData, position_id: e.target.value || null})}
              displayEmpty
            >
              <MenuItem value="" disabled>Sélectionnez un emplacement</MenuItem>
              <Divider />
              {locations.map(location => [
                <MenuItem key={`header-${location.id}`} disabled sx={{ opacity: 0.7 }}>
                  {location.name}
                </MenuItem>,
                ...availablePositions
                  .filter(position => position.storage_location_id === location.id)
                  .map(position => (
                    <MenuItem key={position.id} value={position.id}>
                      {location.name} - Position ({position.row_position}, {position.column_position})
                    </MenuItem>
                  ))
              ])}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialogOpen(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={handleMoveBottle}
            disabled={!moveData.position_id}
          >
            Déplacer
          </Button>
        </DialogActions>
      </Dialog>
      
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
          sx={{ borderRadius: 2 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}