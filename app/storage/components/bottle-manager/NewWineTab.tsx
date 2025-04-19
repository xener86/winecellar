// app/storage/components/bottle-manager/NewWineTab.tsx
import React, { useState } from 'react';
import {
  Typography, Box, TextField, Button, CircularProgress,
  InputAdornment, Paper, Grid, Divider, Alert, Chip,
  FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Fade
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { supabase } from '@/utils/supabase'; 
import WineAIService from '@/services/WineAIService';
import { CommonTabProps, WineData } from '@/utils/types';
import { getWineColorInfo } from './utils';

const NewWineTab: React.FC<CommonTabProps> = ({ 
  position, 
  apiKey, 
  onSuccess, 
  showNotification 
}) => {
  // États pour la gestion du vin
  const [newWineSearchTerm, setNewWineSearchTerm] = useState('');
  const [newWineLoading, setNewWineLoading] = useState(false);
  const [newWineError, setNewWineError] = useState('');
  const [newWineData, setNewWineData] = useState<WineData | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  // Recherche de vin par IA
  const handleSearchWineAI = async () => {
    if (!newWineSearchTerm.trim() || !apiKey) return;
    
    setNewWineLoading(true);
    setNewWineError('');
    setNewWineData(null);
    
    try {
      const wineAIService = new WineAIService();
      const wineInfo = await wineAIService.getWineInfo(newWineSearchTerm, {
        apiKey,
        apiProvider: 'openai', // Ou 'mistral' selon la configuration
        language: 'fr'
      });
      
      if (!wineInfo) {
        throw new Error("Aucune information n'a pu être trouvée pour ce vin");
      }
      
      // Transformer les données reçues au format attendu par le composant
      const formattedData: WineData = {
        name: wineInfo.name || newWineSearchTerm,
        vintage: wineInfo.vintage ?? null,
        region: wineInfo.region || '',
        appellation: wineInfo.appellation || '',
        domain: wineInfo.domain || '',
        color: wineInfo.color || 'red',
        alcohol_percentage: wineInfo.alcohol_percentage || null,
        grapes: wineInfo.grapes || [],
        notes: wineInfo.tasting_notes ? 
          (typeof wineInfo.tasting_notes === 'string' ? 
            wineInfo.tasting_notes : 
            `Apparence: ${wineInfo.tasting_notes.appearance || ''}\nNez: ${wineInfo.tasting_notes.nose || ''}\nPalais: ${wineInfo.tasting_notes.palate || ''}\nFinale: ${wineInfo.tasting_notes.finish || ''}`)
          : ''
      };
      
      setNewWineData(formattedData);
      
    } catch (error: unknown) {
      console.error('Erreur lors de la requête AI:', error instanceof Error ? error.message : error);
      setNewWineError(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue lors de la communication avec l\'API'}`);
    } finally {
      setNewWineLoading(false);
    }
  };

  // Modifier manuellement les données suggérées par l'IA
  const handleNewWineDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    if (!newWineData) return;
    
    const { name, value } = e.target;
    setNewWineData(prev => {
      if (!prev) return null;
      
      const updated = { ...prev };
      const key = name as keyof WineData;
      
      if (key === 'vintage' || key === 'alcohol_percentage') {
        const numVal = value === '' ? null : Number(value);
        if (key === 'vintage') {
          updated.vintage = numVal;
        } else {
          updated.alcohol_percentage = numVal;
        }
      } else if (key === 'color' || key === 'name' || key === 'region' || 
                 key === 'appellation' || key === 'domain' || key === 'notes') {
        updated[key] = value;
      } 
      // Pour grapes, nous aurions besoin d'une gestion spécifique
      
      return updated;
    });
  };

  // Ajouter un nouveau vin et une nouvelle bouteille
  const handleAddNewWine = async () => {
    if (!position || !newWineData) return;
    
    setNewWineLoading(true);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Utilisateur non connecté');
      
      // 1. Créer le vin
      const wineDataToSave = {
        name: newWineData.name,
        vintage: newWineData.vintage,
        region: newWineData.region || null,
        appellation: newWineData.appellation || null,
        domain: newWineData.domain || null,
        color: newWineData.color,
        alcohol_percentage: newWineData.alcohol_percentage,
        notes: newWineData.notes,
        user_id: user.id,
      };
      
      const { data: wineResponse, error: wineError } = await supabase
        .from('wine')
        .insert([wineDataToSave])
        .select();
      
      if (wineError) throw wineError;
      
      if (!wineResponse || wineResponse.length === 0) {
        throw new Error('Erreur lors de la création du vin');
      }
      
      const wineId = wineResponse[0].id;
      
      // 2. Ajouter les cépages si disponibles
      if (newWineData.grapes && newWineData.grapes.length > 0) {
        for (const grapeName of newWineData.grapes) {
          if (!grapeName.trim()) continue;
          
          // Vérifier si le cépage existe
          const { data: existingGrape } = await supabase
            .from('grape')
            .select('id')
            .eq('name', grapeName)
            .single();
          
          let grapeId;
          
          if (existingGrape) {
            grapeId = existingGrape.id;
          } else {
            // Créer le cépage s'il n'existe pas
            const { data: newGrape, error: grapeError } = await supabase
              .from('grape')
              .insert([{ name: grapeName }])
              .select();
            
            if (grapeError) continue;
            
            grapeId = newGrape?.[0]?.id;
          }
          
          if (grapeId) {
            // Associer le cépage au vin
            await supabase
              .from('wine_grape')
              .insert([{ 
                wine_id: wineId, 
                grape_id: grapeId,
                percentage: null
              }]);
          }
        }
      }
      
      // 3. Créer la bouteille et la placer directement
      const { error: bottleError } = await supabase
        .from('bottle')
        .insert([{
          wine_id: wineId,
          position_id: position.id,
          status: 'in_stock',
          acquisition_date: new Date().toISOString().split('T')[0],
          user_id: user.id,
          consumption_date: null,  // Ajout des champs requis pour éviter TS2345
          tasting_note: null
        }]);
      
      if (bottleError) throw bottleError;
      
      showNotification('Vin et bouteille ajoutés avec succès', 'success');
      onSuccess();
    } catch (error: unknown) {
      console.error('Erreur lors de l\'ajout du vin:', error instanceof Error ? error.message : error);
      showNotification(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`, 'error');
    } finally {
      setNewWineLoading(false);
    }
  };

  // Rendu du formulaire de modification manuelle des données de l'IA
  const renderAIEditForm = () => {
    if (!newWineData) return null;
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Modifier les informations du vin
        </Typography>
        <Grid container spacing={2}>
          <Grid component="div" sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Nom du vin"
              name="name"
              value={newWineData.name}
              onChange={handleNewWineDataChange}
              required
            />
          </Grid>
          <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
            <FormControl fullWidth>
              <InputLabel>Couleur</InputLabel>
              <Select
                name="color"
                value={newWineData.color}
                label="Couleur"
                onChange={handleNewWineDataChange}
              >
                <MenuItem value="red">Rouge</MenuItem>
                <MenuItem value="white">Blanc</MenuItem>
                <MenuItem value="rose">Rosé</MenuItem>
                <MenuItem value="sparkling">Effervescent</MenuItem>
                <MenuItem value="fortified">Fortifié</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
            <TextField
              fullWidth
              label="Millésime"
              name="vintage"
              type="number"
              value={newWineData.vintage || ''}
              onChange={handleNewWineDataChange}
              inputProps={{ min: 1900, max: new Date().getFullYear() }}
            />
          </Grid>
          <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
            <TextField
              fullWidth
              label="Domaine"
              name="domain"
              value={newWineData.domain || ''}
              onChange={handleNewWineDataChange}
            />
          </Grid>
          <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
            <TextField
              fullWidth
              label="Région"
              name="region"
              value={newWineData.region || ''}
              onChange={handleNewWineDataChange}
            />
          </Grid>
          <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
            <TextField
              fullWidth
              label="Appellation"
              name="appellation"
              value={newWineData.appellation || ''}
              onChange={handleNewWineDataChange}
            />
          </Grid>
          <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
            <TextField
              fullWidth
              label="Degré d'alcool (%)"
              name="alcohol_percentage"
              type="number"
              value={newWineData.alcohol_percentage || ''}
              onChange={handleNewWineDataChange}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Nom du vin à rechercher"
          placeholder="Ex: Château Margaux 2015"
          value={newWineSearchTerm}
          onChange={(e) => setNewWineSearchTerm(e.target.value)}
          helperText="Entrez le nom du vin et son millésime pour une meilleure précision"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <Button
          fullWidth
          variant="contained"
          startIcon={newWineLoading ? <CircularProgress size={24} color="inherit" /> : <AutoAwesomeIcon />}
          onClick={handleSearchWineAI}
          disabled={newWineLoading || !newWineSearchTerm.trim() || !apiKey}
          sx={{ height: 56, borderRadius: 2 }}
        >
          Rechercher avec l&apos;IA
        </Button>
        
        {!apiKey && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Clé API OpenAI non configurée. Veuillez la configurer dans les paramètres pour utiliser cette fonctionnalité.
          </Alert>
        )}
      </Box>
      
      {newWineError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {newWineError}
        </Alert>
      )}
      
      {newWineData && (
        <Fade in={true}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {newWineData.name} {newWineData.vintage && `(${newWineData.vintage})`}
              </Typography>
              <Chip 
                label={getWineColorInfo(newWineData.color).label}
                sx={{ 
                  bgcolor: getWineColorInfo(newWineData.color).bgColor,
                  color: getWineColorInfo(newWineData.color).textColor,
                }}
              />
            </Box>
            
            <Grid container spacing={2}>
              <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
                <Typography variant="body2" color="text.secondary">
                  Domaine
                </Typography>
                <Typography variant="body1">
                  {newWineData.domain || '-'}
                </Typography>
              </Grid>
              <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
                <Typography variant="body2" color="text.secondary">
                  Région
                </Typography>
                <Typography variant="body1">
                  {newWineData.region || '-'}
                </Typography>
              </Grid>
              {newWineData.appellation && (
                <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
                  <Typography variant="body2" color="text.secondary">
                    Appellation
                  </Typography>
                  <Typography variant="body1">
                    {newWineData.appellation}
                  </Typography>
                </Grid>
              )}
              {newWineData.alcohol_percentage && (
                <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
                  <Typography variant="body2" color="text.secondary">
                    Alcool
                  </Typography>
                  <Typography variant="body1">
                    {newWineData.alcohol_percentage}%
                  </Typography>
                </Grid>
              )}
            </Grid>
            
            {newWineData.grapes && newWineData.grapes.length > 0 && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                  Cépages
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {newWineData.grapes.map((grape, index) => (
                    <Chip key={index} label={grape} size="small" variant="outlined" />
                  ))}
                </Box>
              </>
            )}
            
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                variant="text"
                onClick={() => setPreviewExpanded(!previewExpanded)}
              >
                {previewExpanded ? 'Masquer les détails' : 'Voir plus de détails'}
              </Button>
            </Box>
            
            {previewExpanded && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {newWineData.notes}
                </Typography>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            {renderAIEditForm()}
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={newWineLoading ? <CircularProgress size={20} /> : <AddCircleOutlineIcon />}
                onClick={handleAddNewWine}
                disabled={newWineLoading || !newWineData.name}
                sx={{ borderRadius: 2 }}
              >
                Créer et placer cette bouteille
              </Button>
            </Box>
          </Paper>
        </Fade>
      )}
    </Box>
  );
};

export default NewWineTab;