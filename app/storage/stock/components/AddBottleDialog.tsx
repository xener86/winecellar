// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect, ElementType, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Tab, Tabs, Box, TextField, InputAdornment,
  List, ListItem, ListItemIcon, ListItemText, CircularProgress,
  Alert, Typography, Divider, Grid, Chip, Paper, Fade
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import WineBarIcon from '@mui/icons-material/WineBar';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Importation à corriger - ce module doit être créé
import { supabase } from '../../../utils/supabase';

// Types
type Position = {
  id: string;
  storage_location_id: string;
  row_position: number;
  column_position: number;
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

interface WineData {
  name: string;
  vintage: number | null;
  region: string;
  appellation: string;
  domain: string;
  color: string;
  alcohol_percentage: number | null;
  grapes: string[];
  notes: string;
}

// Fonction pour parser les informations du vin depuis la réponse de l'IA
const parseWineData = (aiResponse: string): WineData => {
  const wineData: WineData = {
    name: '',
    vintage: null,
    region: '',
    appellation: '',
    domain: '',
    color: '',
    alcohol_percentage: null,
    grapes: [],
    notes: '',
  };

  // Extraction du nom et millésime
  const nameRegex = /\*\*Nom du vin\*\* : (.*?) \*\*Millésime\*\* : (\d{4})/;
  const nameMatch = aiResponse.match(nameRegex);
  if (nameMatch) {
    wineData.name = nameMatch[1].trim();
    wineData.vintage = parseInt(nameMatch[2]);
  }

  // Extraction de l'appellation et région
  const appellationRegex = /\*\*Appellation\*\* : (.*?) \*\*Région\*\* : (.*?) \*\*Type\*\*/;
  const appellationMatch = aiResponse.match(appellationRegex);
  if (appellationMatch) {
    const fullAppellation = appellationMatch[1].trim();
    // Extraire l'appellation sans l'AOC/AOP si présent
    wineData.appellation = fullAppellation.split('(')[0].trim();
    wineData.region = appellationMatch[2].trim();
  }

  // Extraction du domaine
  const domaineRegex = /\*\*Domaine\*\* : (.*?)$/m;
  const domaineMatch = aiResponse.match(domaineRegex);
  if (domaineMatch) {
    wineData.domain = domaineMatch[1].trim();
  }

  // Extraction de la couleur
  const typeRegex = /\*\*Type\*\* : Vin (.*?) \*\*Alcool\*\*/;
  const typeMatch = aiResponse.match(typeRegex);
  if (typeMatch) {
    const colorFrench = typeMatch[1].toLowerCase().trim();
    // Conversion de la couleur en anglais pour correspondre au schéma de la BDD
    const colorMap: Record<string, string> = {
      'rouge': 'red',
      'blanc': 'white',
      'rosé': 'rose',
      'effervescent': 'sparkling',
      'fortifié': 'fortified',
      'mousseux': 'sparkling',
      'champagne': 'sparkling'
    };
    wineData.color = colorMap[colorFrench] || colorFrench;
  }

  // Extraction du pourcentage d'alcool
  const alcoholRegex = /\*\*Alcool\*\* : .*?(\d+[,.]?\d*).*?%/;
  const alcoholMatch = aiResponse.match(alcoholRegex);
  if (alcoholMatch) {
    wineData.alcohol_percentage = parseFloat(alcoholMatch[1].replace(',', '.'));
  }

  // Extraction des cépages
  const grapesSection = aiResponse.split('🧬 Cépages :')[1]?.split('👁️ Robe')[0];
  if (grapesSection) {
    const grapesList = grapesSection.split('*').filter(item => item.trim() !== '');
    wineData.grapes = grapesList.map(grape => 
      grape.trim().replace(/\(.+\)/g, '').trim() // Enlève les commentaires entre parenthèses
    ).filter(grape => grape !== '');
  }

  // Construction des notes de dégustation
  let notes = "";
  
  // Robe
  const robeSection = aiResponse.split('👁️ Robe :')[1]?.split('👃 Nez')[0];
  if (robeSection) {
    notes += "ROBE :\n";
    const robePoints = robeSection.split('*').filter(item => item.trim() !== '');
    notes += robePoints.map(point => point.trim()).join('\n') + "\n\n";
  }
  
  // Nez
  const nezSection = aiResponse.split('👃 Nez :')[1]?.split('👄 Bouche')[0];
  if (nezSection) {
    notes += "NEZ :\n";
    const nezPoints = nezSection.split('*').filter(item => item.trim() !== '');
    notes += nezPoints.map(point => point.trim()).join('\n') + "\n\n";
  }
  
  // Bouche
  const boucheSection = aiResponse.split('👄 Bouche :')[1]?.split('🕰️ Potentiel de garde')[0];
  if (boucheSection) {
    notes += "BOUCHE :\n";
    const bouchePoints = boucheSection.split('*').filter(item => item.trim() !== '');
    notes += bouchePoints.map(point => point.trim()).join('\n') + "\n\n";
  }
  
  // Potentiel de garde
  const gardeSection = aiResponse.split('🕰️ Potentiel de garde :')[1]?.split('🍽️ Accords mets & vin')[0];
  if (gardeSection) {
    notes += "POTENTIEL DE GARDE :\n" + gardeSection.trim() + "\n\n";
  }
  
  // Accords mets & vin
  const accordsSection = aiResponse.split('🍽️ Accords mets & vin :')[1];
  if (accordsSection) {
    notes += "ACCORDS METS & VIN :\n";
    const accordsPoints = accordsSection.split('*').filter(item => item.trim() !== '');
    notes += accordsPoints.map(point => point.trim()).join('\n');
  }
  
  wineData.notes = notes.trim();

  return wineData;
};

// Interface pour les propriétés du composant
interface AddBottleDialogProps {
  open: boolean;
  onClose: () => void;
  position: Position | null;
  onBottleAdded: () => void;
  apiKey?: string;
}

// Interface pour gérer les erreurs
interface ErrorType {
  message: string;
}

export default function AddBottleDialog({ 
  open, onClose, position, onBottleAdded, apiKey = ''
}: AddBottleDialogProps) {
  const theme = useTheme();
  const [tabIndex, setTabIndex] = useState(0);
  const [wineSearchTerm, setWineSearchTerm] = useState('');
  const [availableWines, setAvailableWines] = useState<Wine[]>([]);
  const [winesLoading, setWinesLoading] = useState(false);

  // États pour l'onglet IA
  const [newWineSearchTerm, setNewWineSearchTerm] = useState('');
  const [newWineLoading, setNewWineLoading] = useState(false);
  const [newWineError, setNewWineError] = useState('');
  const [newWineData, setNewWineData] = useState<WineData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [aiResponse, setAiResponse] = useState('');
  const [previewExpanded, setPreviewExpanded] = useState(false);

  const fetchAvailableWines = useCallback(async (searchTerm = '') => {
    if (!open) return;
    
    setWinesLoading(true);
    try {
      let query = supabase
        .from('wine')
        .select(`
          id, 
          name, 
          color, 
          vintage, 
          domain,
          region,
          appellation,
          alcohol_percentage
        `)
        .order('name');
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data: wines, error: winesError } = await query;
      
      if (winesError) throw winesError;
      
      // Récupérer les bouteilles en stock non placées
      const { data: bottles, error: bottlesError } = await supabase
        .from('bottle')
        .select('id, wine_id')
        .eq('status', 'in_stock')
        .is('position_id', null);
      
      if (bottlesError) throw bottlesError;
      
      // Filtrer pour ne garder que les vins qui ont des bouteilles en stock non placées
      const wineIdsWithAvailableBottles = bottles?.map((b: { wine_id: string }) => b.wine_id) || [];
      const filteredWines = wines?.filter((wine: Wine) => 
        wineIdsWithAvailableBottles.includes(wine.id)
      ) || [];
      
      setAvailableWines(filteredWines);
    } catch (error: unknown) {
      const typedError = error as ErrorType;
      console.error('Erreur lors de la récupération des vins:', typedError.message);
    } finally {
      setWinesLoading(false);
    }
  }, [open]);

  // Récupérer les vins disponibles en stock (non placés)
  useEffect(() => {
    if (open && tabIndex === 0) {
      fetchAvailableWines();
    }
  }, [open, tabIndex, fetchAvailableWines]);

  // Recherche de vin par IA
  const handleSearchWineAI = async () => {
    if (!newWineSearchTerm.trim()) return;
    
    setNewWineLoading(true);
    setNewWineError('');
    setNewWineData(null);
    setAiResponse('');
    
    try {
      // Configuration de la requête API OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "Tu es un sommelier expert. Crée une fiche détaillée pour un vin avec le format exact suivant :\n\n🍷 Fiche de dégustation : [Nom complet du vin avec millésime]\n**Nom du vin** : [Nom du vin sans le millésime] **Millésime** : [Année] **Appellation** : [Appellation] (AOC/AOP), [Région générale] **Région** : [Région détaillée] **Type** : Vin [couleur] **Alcool** : Environ [pourcentage] % vol **Domaine** : [Nom du domaine]\n🧬 Cépages :\n* [Cépage principal]\n* [Cépage secondaire]\n* [Autres cépages si applicable]\n👁️ Robe :\n* [Description de la couleur et de l'aspect]\n👃 Nez :\n* Première impression : [arômes immédiats]\n* Second nez : [arômes après aération]\n👄 Bouche :\n* Attaque : [premières sensations]\n* [Structure, équilibre, tanins]\n* [Autres caractéristiques]\n* Finale : [persistance et saveurs finales]\n🕰️ Potentiel de garde :\n* [Estimation de la période optimale de consommation]\n🍽️ Accords mets & vin :\n* [Suggestion d'accompagnement 1]\n* [Suggestion d'accompagnement 2]\n* [Suggestion d'accompagnement 3]\n* [Plat traditionnel associé]"
            },
            {
              role: "user",
              content: newWineSearchTerm
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API OpenAI: ${response.status}`);
      }
      
      const data = await response.json();
      const aiResponseText = data.choices[0].message.content;
      
      setAiResponse(aiResponseText);
      
      // Parser les données du vin
      const parsedData = parseWineData(aiResponseText);
      setNewWineData(parsedData);
      
    } catch (error: unknown) {
      const typedError = error as ErrorType;
      console.error('Erreur lors de la requête AI:', typedError.message);
      setNewWineError(`Erreur: ${typedError.message || 'Une erreur est survenue lors de la communication avec l\'API'}`);
    } finally {
      setNewWineLoading(false);
    }
  };

  // Ajouter une bouteille existante à une position
  const handlePlaceExistingBottle = async (wineId: string) => {
    if (!position) return;
    
    try {
      // Trouver une bouteille disponible pour ce vin
      const { data: availableBottles, error: bottlesError } = await supabase
        .from('bottle')
        .select('id')
        .eq('wine_id', wineId)
        .eq('status', 'in_stock')
        .is('position_id', null)
        .limit(1);
      
      if (bottlesError) throw bottlesError;
      
      if (!availableBottles || availableBottles.length === 0) {
        throw new Error('Aucune bouteille disponible pour ce vin');
      }
      
      // Mettre à jour la position de la bouteille
      const { error: updateError } = await supabase
        .from('bottle')
        .update({ position_id: position.id })
        .eq('id', availableBottles[0].id);
      
      if (updateError) throw updateError;
      
      onBottleAdded();
      onClose();
    } catch (error: unknown) {
      const typedError = error as ErrorType;
      console.error('Erreur lors du placement de la bouteille:', typedError.message);
      setNewWineError(`Erreur: ${typedError.message || 'Une erreur est survenue'}`);
    }
  };

  // Ajouter un nouveau vin et placer une bouteille
  const handleAddNewWine = async () => {
    if (!position || !newWineData) return;
    
    setNewWineLoading(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Utilisateur non connecté');
      }
      
      // 1. Créer le vin
      const wineDataToSave = {
        name: newWineData.name,
        vintage: newWineData.vintage,
        region: newWineData.region,
        appellation: newWineData.appellation,
        domain: newWineData.domain,
        color: newWineData.color,
        alcohol_percentage: newWineData.alcohol_percentage,
        notes: newWineData.notes,
        user_id: userData.user.id,
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
      
      // 2. Ajouter les cépages si nécessaire
      if (newWineData.grapes && newWineData.grapes.length > 0) {
        for (const grapeName of newWineData.grapes) {
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
          user_id: userData.user.id
        }]);
      
      if (bottleError) throw bottleError;
      
      onBottleAdded();
      onClose();
    } catch (error: unknown) {
      const typedError = error as ErrorType;
      console.error('Erreur lors de l\'ajout du vin:', typedError.message);
      setNewWineError(`Erreur: ${typedError.message || 'Une erreur est survenue'}`);
    } finally {
      setNewWineLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    // Réinitialiser les erreurs lors du changement d'onglet
    setNewWineError('');
  };

  const getWineColorInfo = (color: string) => {
    const colors: Record<string, { label: string, bgColor: string, textColor: string }> = {
      'red': { label: 'Rouge', bgColor: 'rgba(139, 0, 0, 0.9)', textColor: '#fff' },
      'white': { label: 'Blanc', bgColor: 'rgba(245, 245, 220, 0.9)', textColor: '#000' },
      'rose': { label: 'Rosé', bgColor: 'rgba(255, 182, 193, 0.9)', textColor: '#000' },
      'sparkling': { label: 'Effervescent', bgColor: 'rgba(176, 196, 222, 0.9)', textColor: '#000' },
      'fortified': { label: 'Fortifié', bgColor: 'rgba(139, 69, 19, 0.9)', textColor: '#fff' }
    };
    
    return colors[color] || { label: 'Inconnu', bgColor: '#607D8B', textColor: '#fff' };
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Ajouter une bouteille
            {position && (
              <Typography component="span" variant="subtitle1" color="text.secondary" sx={{ ml: 1 }}>
                - Position {position.row_position}/{position.column_position}
              </Typography>
            )}
          </Typography>
          <Button 
            color="inherit"
            onClick={onClose}
            sx={{ minWidth: 'auto', p: 1 }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          sx={{ mb: 3 }}
        >
          <Tab label="Bouteille existante" />
          <Tab label="Nouvelle bouteille (IA)" />
        </Tabs>
        
        {tabIndex === 0 ? (
          // Onglet bouteille existante
          <Box>
            <TextField
              fullWidth
              label="Rechercher un vin"
              value={wineSearchTerm}
              onChange={(e) => {
                setWineSearchTerm(e.target.value);
                fetchAvailableWines(e.target.value);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            
            {winesLoading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Paper 
                variant="outlined" 
                sx={{ 
                  maxHeight: 350, 
                  overflow: 'auto',
                  borderRadius: 2
                }}
              >
                <List sx={{ p: 0 }}>
                  {availableWines.map((wine) => (
                    <ListItem 
                      key={wine.id} 
                      onClick={() => handlePlaceExistingBottle(wine.id)}
                      divider
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        }
                      }}
                    >
                      <ListItemIcon>
                        <Box 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '50%', 
                            bgcolor: getWineColorInfo(wine.color).bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: getWineColorInfo(wine.color).textColor
                          }}
                        >
                          <WineBarIcon />
                        </Box>
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="subtitle1">
                            {wine.name} {wine.vintage && `(${wine.vintage})`}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" component="span">
                            {wine.domain && `${wine.domain} • `}
                            {getWineColorInfo(wine.color).label}
                            {wine.region && ` • ${wine.region}`}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                  {availableWines.length === 0 && !winesLoading && (
                    <ListItem>
                      <ListItemText 
                        primary={
                          <Typography color="text.secondary" align="center">
                            Aucune bouteille disponible en stock
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" align="center">
                            Utilisez l&apos;onglet &quot;Nouvelle bouteille&quot; pour en ajouter une
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            )}
          </Box>
        ) : (
          // Onglet nouvelle bouteille (IA)
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
                      <SearchIcon sx={{ color: 'text.secondary' }} />
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
                  Clé API OpenAI non configurée. Veuillez la configurer dans les paramètres.
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
                  <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
                      <Typography variant="body2" color="text.secondary">
                        Domaine
                      </Typography>
                      <Typography variant="body1">
                        {newWineData.domain || '-'}
                      </Typography>
                    </Grid>
                    <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
                    <Typography variant="body2" color="text.secondary">
                        Région
                      </Typography>
                      <Typography variant="body1">
                        {newWineData.region || '-'}
                      </Typography>
                    </Grid>
                    {newWineData.appellation && (
                  <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
                        <Typography variant="body2" color="text.secondary">
                          Appellation
                        </Typography>
                        <Typography variant="body1">
                          {newWineData.appellation}
                        </Typography>
                      </Grid>
                    )}
                    {newWineData.alcohol_percentage && (
                  <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
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
                </Paper>
              </Fade>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Annuler
        </Button>
        {tabIndex === 1 && newWineData && (
          <Button 
            onClick={handleAddNewWine} 
            variant="contained" 
            color="primary"
            disabled={newWineLoading}
            startIcon={newWineLoading ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutlineIcon />}
            sx={{ borderRadius: 2 }}
          >
            Créer et placer cette bouteille
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}