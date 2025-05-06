// app/storage/stock/components/AddBottleModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
  Slider,
  Alert,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  InputAdornment,
  Fade
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import WineBarIcon from '@mui/icons-material/WineBar';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { supabase } from '../../../utils/supabase';

// Types
interface Wine {
  id: string;
  name: string;
  color: 'red' | 'white' | 'rose' | 'sparkling' | 'fortified';
  vintage?: number | null;
  domain?: string | null;
  region?: string | null;
  appellation?: string | null;
  alcohol_percentage?: number | null;
}

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

interface AddBottleModalProps {
  open: boolean;
  onClose: () => void;
  crateId: string;
  onBottleAdded: () => void;
  apiKey?: string;
  currentCapacity?: number;
  maxCapacity?: number;
}

const AddBottleModal: React.FC<AddBottleModalProps> = ({
  open,
  onClose,
  crateId,
  onBottleAdded,
  apiKey = '',
  currentCapacity = 0,
  maxCapacity = 6
}) => {
  const theme = useTheme();
  
  // État des onglets
  const [tabIndex, setTabIndex] = useState(0);
  
  // États communs
  const [loading, setLoading] = useState(false);
  const [availableSpace, setAvailableSpace] = useState(maxCapacity - currentCapacity);
  
  // États pour le vin existant
  const [wines, setWines] = useState<Wine[]>([]);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  // États pour l'IA
  const [newWineSearchTerm, setNewWineSearchTerm] = useState('');
  const [newWineLoading, setNewWineLoading] = useState(false);
  const [newWineError, setNewWineError] = useState('');
  const [newWineData, setNewWineData] = useState<WineData | null>(null);
  const [newWineQuantity, setNewWineQuantity] = useState(1);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  
  // États pour nouveau vin manuel
  const [newWine, setNewWine] = useState<Omit<Wine, 'id'>>({
    name: '',
    color: 'red',
    vintage: new Date().getFullYear(),
    domain: '',
    region: '',
    appellation: '',
    alcohol_percentage: null
  });
  const [manualWineQuantity, setManualWineQuantity] = useState(1);

  // Calculer l'espace disponible
  useEffect(() => {
    if (open) {
      setAvailableSpace(maxCapacity - currentCapacity);
    }
  }, [open, maxCapacity, currentCapacity]);

  // Rechercher les vins existants
  const fetchWines = useCallback(async () => {
    if (!open) return;
    
    setLoading(true);
    try {
      let query = supabase.from('wine').select('*');
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,domain.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      
      setWines(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des vins:', error);
    } finally {
      setLoading(false);
    }
  }, [open, searchTerm]);

  // Charger les vins au montage
  useEffect(() => {
    if (open && tabIndex === 0) {
      fetchWines();
    }
  }, [open, tabIndex, fetchWines]);

  // Console log pour déboguer la clé API
  useEffect(() => {
    console.log("État de apiKey:", apiKey ? "Disponible" : "Non disponible");
  }, [apiKey]);

  // Fonction pour parser les données du vin depuis la réponse de l'IA
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

  // Changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    setNewWineError('');
  };

  // Ajouter un vin existant
  const handleAddExistingWine = async () => {
    if (!selectedWine) return;
    
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Utilisateur non connecté');

      // Créer un tableau de bouteilles à ajouter
      const bottlesToAdd = Array(quantity).fill(null).map(() => ({
        wine_id: selectedWine.id,
        crate_id: crateId,
        status: 'in_stock',
        acquisition_date: new Date().toISOString().split('T')[0],
        user_id: user.id
      }));

      const { error } = await supabase.from('bottle').insert(bottlesToAdd);
      if (error) throw error;

      onBottleAdded();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error("Erreur ajout bouteille:", message);
      alert(`Erreur: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // Rechercher un vin avec l'IA
  const handleSearchWineAI = async () => {
    if (!newWineSearchTerm.trim() || !apiKey) return;
    
    setNewWineLoading(true);
    setNewWineError('');
    setNewWineData(null);
    
    try {
      console.log("Envoi de la requête à l'API OpenAI avec la clé:", apiKey ? "Disponible" : "Non disponible");
      
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
      
      // Parser les données du vin
      const parsedData = parseWineData(aiResponseText);
      setNewWineData(parsedData);
      
    } catch (error) {
      const typedError = error as Error;
      console.error('Erreur lors de la requête AI:', typedError.message);
      setNewWineError(`Erreur: ${typedError.message || 'Une erreur est survenue lors de la communication avec l\'API'}`);
    } finally {
      setNewWineLoading(false);
    }
  };

  // Ajouter un nouveau vin via IA
  const handleAddNewWineAI = async () => {
    if (!newWineData) return;
    
    setNewWineLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');
      
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
      
      // 3. Créer les bouteilles et les placer directement
      const bottlesToAdd = Array(newWineQuantity).fill(null).map(() => ({
        wine_id: wineId,
        crate_id: crateId,
        status: 'in_stock',
        acquisition_date: new Date().toISOString().split('T')[0],
        user_id: user.id
      }));

      const { error: bottleError } = await supabase
        .from('bottle')
        .insert(bottlesToAdd);
      
      if (bottleError) throw bottleError;
      
      onBottleAdded();
      handleClose();
    } catch (error) {
      const typedError = error as Error;
      console.error('Erreur lors de l\'ajout du vin:', typedError.message);
      setNewWineError(`Erreur: ${typedError.message || 'Une erreur est survenue'}`);
    } finally {
      setNewWineLoading(false);
    }
  };

  // Gérer les changements pour le nouveau vin manuel
  const handleNewWineChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    if(name) {
      setNewWine(prev => ({
        ...prev,
        [name]: (name === 'vintage' || name === 'alcohol_percentage') 
              ? (value === '' ? null : name === 'vintage' ? parseInt(value) : parseFloat(value)) 
              : value
      }));
    }
  };

  // Ajouter un nouveau vin manuel
  const handleAddManualWine = async () => {
    if (!newWine.name) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Créer le nouveau vin
      const { data: wineData, error: wineError } = await supabase
        .from('wine')
        .insert({
          name: newWine.name,
          color: newWine.color,
          vintage: typeof newWine.vintage === 'number' ? newWine.vintage : null,
          domain: newWine.domain || null,
          region: newWine.region || null,
          appellation: newWine.appellation || null,
          alcohol_percentage: newWine.alcohol_percentage,
          user_id: user.id
        })
        .select()
        .single();

      if (wineError) throw wineError;
      if (!wineData) throw new Error("La création du vin n'a pas retourné de données.");

      // Créer les bouteilles associées
      const bottlesToAdd = Array(manualWineQuantity).fill(null).map(() => ({
        wine_id: wineData.id,
        crate_id: crateId,
        status: 'in_stock',
        acquisition_date: new Date().toISOString().split('T')[0],
        user_id: user.id
      }));

      const { error: bottleError } = await supabase
        .from('bottle')
        .insert(bottlesToAdd);
        
      if (bottleError) throw bottleError;

      onBottleAdded();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur création vin/bouteille:', message);
      alert(`Erreur: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fermer et réinitialiser
  const handleClose = () => {
    setSelectedWine(null);
    setNewWine({
      name: '', color: 'red', vintage: new Date().getFullYear(), 
      domain: '', region: '', appellation: '', alcohol_percentage: null
    });
    setSearchTerm('');
    setTabIndex(0);
    setQuantity(1);
    setNewWineQuantity(1);
    setManualWineQuantity(1);
    setNewWineData(null);
    setNewWineSearchTerm('');
    onClose();
  };

  // Obtenir informations sur la couleur
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
      onClose={loading || newWineLoading ? undefined : handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Ajouter des bouteilles
            <Typography component="span" variant="subtitle1" color="text.secondary" sx={{ ml: 1 }}>
              (Espace disponible: {availableSpace} bouteilles)
            </Typography>
          </Typography>
          <IconButton 
            onClick={loading || newWineLoading ? undefined : handleClose}
            disabled={loading || newWineLoading}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          sx={{ mb: 3 }}
          variant="fullWidth"
        >
          <Tab label="Vin existant" />
          <Tab label="IA Sommelier" />
          <Tab label="Nouveau vin manuel" />
        </Tabs>

        {tabIndex === 0 && (
          // Onglet vin existant
          <Box>
            <Typography variant="body2" paragraph>
              Ajoutez une ou plusieurs bouteilles d&apos;un vin déjà référencé dans votre cave.
            </Typography>

            <TextField
              fullWidth
              label="Rechercher un vin"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchWines()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: loading && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />

            <Paper 
              variant="outlined" 
              sx={{ 
                maxHeight: 250, 
                overflow: 'auto',
                borderRadius: 2,
                mb: 3
              }}
            >
              <List sx={{ p: 0 }}>
                {wines.length === 0 ? (
                  <ListItem>
                    <ListItemText 
                      primary={
                        loading 
                          ? "Chargement des vins..." 
                          : "Aucun vin trouvé. Essayez de modifier votre recherche."
                      }
                    />
                  </ListItem>
                ) : (
                  wines.map((wine) => (
                    <ListItem 
                      key={wine.id} 
                      onClick={() => setSelectedWine(wine.id === selectedWine?.id ? null : wine)}
                      divider
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                        backgroundColor: wine.id === selectedWine?.id 
                          ? theme.palette.action.selected 
                          : 'transparent'
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
                  ))
                )}
              </List>
            </Paper>

            {selectedWine && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Nombre de bouteilles à ajouter
                </Typography>
                
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Slider
                    value={quantity}
                    onChange={(_e, newValue) => setQuantity(newValue as number)}
                    step={1}
                    marks
                    min={1}
                    max={Math.min(availableSpace, 6)}
                    valueLabelDisplay="auto"
                    sx={{ flexGrow: 1 }}
                  />
                  <TextField
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= Math.min(availableSpace, 6)) {
                        setQuantity(val);
                      }
                    }}
                    inputProps={{ min: 1, max: Math.min(availableSpace, 6) }}
                    sx={{ width: 80 }}
                  />
                </Box>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  {quantity > 1 
                    ? `Vous allez ajouter ${quantity} bouteilles de ${selectedWine.name} ${selectedWine.vintage || ''}`
                    : `Vous allez ajouter 1 bouteille de ${selectedWine.name} ${selectedWine.vintage || ''}`}
                </Alert>
              </Box>
            )}
          </Box>
        )}

{tabIndex === 1 && (
          // Onglet IA Sommelier
          <Box>
            <Typography variant="body2" paragraph>
              Utilisez l&apos;IA pour trouver rapidement les informations sur un vin et l&apos;ajouter à votre cave.
            </Typography>
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
                  )
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
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      <Box sx={{ minWidth: '200px', flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Domaine
                        </Typography>
                        <Typography variant="body1">
                          {newWineData.domain || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ minWidth: '200px', flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Région
                        </Typography>
                        <Typography variant="body1">
                          {newWineData.region || '-'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {newWineData.appellation && (
                        <Box sx={{ minWidth: '200px', flex: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Appellation
                          </Typography>
                          <Typography variant="body1">
                            {newWineData.appellation}
                          </Typography>
                        </Box>
                      )}
                      {newWineData.alcohol_percentage && (
                        <Box sx={{ minWidth: '200px', flex: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Alcool
                          </Typography>
                          <Typography variant="body1">
                            {newWineData.alcohol_percentage}%
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  
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
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Nombre de bouteilles à ajouter
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Slider
                      value={newWineQuantity}
                      onChange={(_e, newValue) => setNewWineQuantity(newValue as number)}
                      step={1}
                      marks
                      min={1}
                      max={Math.min(availableSpace, 6)}
                      valueLabelDisplay="auto"
                      sx={{ flexGrow: 1 }}
                    />
                    <TextField
                      type="number"
                      value={newWineQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val >= 1 && val <= Math.min(availableSpace, 6)) {
                          setNewWineQuantity(val);
                        }
                      }}
                      inputProps={{ min: 1, max: Math.min(availableSpace, 6) }}
                      sx={{ width: 80 }}
                    />
                  </Box>
                </Paper>
              </Fade>
            )}
          </Box>
        )}
        
        {tabIndex === 2 && (
          // Onglet nouveau vin manuel
          <Box>
            <Typography variant="body2" paragraph>
              Ajoutez manuellement un nouveau vin dans votre cave avec tous les détails.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField 
                label="Nom du vin" 
                name="name" 
                fullWidth 
                required 
                value={newWine.name} 
                onChange={handleNewWineChange}
              />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <FormControl sx={{ minWidth: '200px', flex: 1 }}>
                  <InputLabel>Couleur</InputLabel>
                  <Select 
                    name="color" 
                    value={newWine.color} 
                    label="Couleur" 
                    onChange={handleNewWineChange as (e: SelectChangeEvent<string>) => void}
                  >
                    <MenuItem value="red">Rouge</MenuItem>
                    <MenuItem value="white">Blanc</MenuItem>
                    <MenuItem value="rose">Rosé</MenuItem>
                    <MenuItem value="sparkling">Effervescent</MenuItem>
                    <MenuItem value="fortified">Fortifié</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField 
                  label="Millésime" 
                  name="vintage" 
                  type="number" 
                  sx={{ minWidth: '200px', flex: 1 }}
                  value={newWine.vintage ?? ''} 
                  onChange={handleNewWineChange} 
                  inputProps={{ min: 1900, max: new Date().getFullYear() }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField 
                  label="Domaine" 
                  name="domain" 
                  sx={{ minWidth: '200px', flex: 1 }}
                  value={newWine.domain ?? ''} 
                  onChange={handleNewWineChange}
                />
                
                <TextField 
                  label="Région" 
                  name="region" 
                  sx={{ minWidth: '200px', flex: 1 }}
                  value={newWine.region ?? ''} 
                  onChange={handleNewWineChange}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField 
                  label="Appellation" 
                  name="appellation" 
                  sx={{ minWidth: '200px', flex: 1 }}
                  value={newWine.appellation ?? ''} 
                  onChange={handleNewWineChange}
                />
                
                <TextField 
                  label="Degré d&apos;alcool (%)" 
                  name="alcohol_percentage" 
                  type="number" 
                  sx={{ minWidth: '200px', flex: 1 }}
                  value={newWine.alcohol_percentage ?? ''} 
                  onChange={handleNewWineChange} 
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
              </Box>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Nombre de bouteilles à ajouter
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Slider
                  value={manualWineQuantity}
                  onChange={(_e, newValue) => setManualWineQuantity(newValue as number)}
                  step={1}
                  marks
                  min={1}
                  max={Math.min(availableSpace, 6)}
                  valueLabelDisplay="auto"
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  type="number"
                  value={manualWineQuantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= Math.min(availableSpace, 6)) {
                      setManualWineQuantity(val);
                    }
                  }}
                  inputProps={{ min: 1, max: Math.min(availableSpace, 6) }}
                  sx={{ width: 80 }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose} 
          sx={{ borderRadius: 2 }} 
          disabled={loading || newWineLoading}
        >
          Annuler
        </Button>
        
        {tabIndex === 0 && (
          <Button
            onClick={handleAddExistingWine}
            variant="contained"
            disabled={loading || !selectedWine || quantity < 1 || quantity > availableSpace}
            sx={{ borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 
              quantity > 1 ? `Ajouter ${quantity} bouteilles` : 'Ajouter la bouteille'}
          </Button>
        )}
        
        {tabIndex === 1 && newWineData && (
          <Button
            onClick={handleAddNewWineAI}
            variant="contained"
            disabled={newWineLoading || !newWineData || newWineQuantity < 1 || newWineQuantity > availableSpace}
            sx={{ borderRadius: 2 }}
            startIcon={newWineLoading ? undefined : <AddCircleOutlineIcon />}
          >
            {newWineLoading ? <CircularProgress size={24} color="inherit" /> : 
              newWineQuantity > 1 ? `Ajouter ${newWineQuantity} bouteilles` : 'Ajouter la bouteille'}
          </Button>
        )}
        
        {tabIndex === 2 && (
          <Button
            onClick={handleAddManualWine}
            variant="contained"
            disabled={loading || !newWine.name || manualWineQuantity < 1 || manualWineQuantity > availableSpace}
            sx={{ borderRadius: 2 }}
            startIcon={loading ? undefined : <AddCircleOutlineIcon />}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 
              manualWineQuantity > 1 ? `Ajouter ${manualWineQuantity} bouteilles` : 'Ajouter la bouteille'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddBottleModal;