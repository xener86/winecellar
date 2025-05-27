// app/components/AIPairingInterface.tsx

'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  Grid2 as Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Collapse,
  Rating,
  Divider,
  Paper,
  Fade,
  Zoom,
  InputAdornment,
  Badge,
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import WineBarIcon from '@mui/icons-material/WineBar';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ThermometerIcon from '@mui/icons-material/Thermostat';
import InfoIcon from '@mui/icons-material/Info';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import Link from 'next/link';

import { ScoredBottle, PurchaseSuggestion, PairingAnalysis } from '@/services/AIPairingService';
import { DBWine } from '@/utils/types';

interface AIPairingInterfaceProps {
  userId: string;
  apiKey: string;
  apiProvider: 'openai' | 'mistral';
}

export default function AIPairingInterface({
  userId,
  apiKey,
  apiProvider
}: AIPairingInterfaceProps) {
  const [foodQuery, setFoodQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PairingAnalysis | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [savedPairings, setSavedPairings] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!foodQuery.trim()) return;

    setLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch('/api/pairings/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodQuery,
          userId,
          apiKey,
          apiProvider
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Erreur:', error);
      // Gérer l'erreur
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const toggleSaved = (id: string) => {
    const newSaved = new Set(savedPairings);
    if (newSaved.has(id)) {
      newSaved.delete(id);
    } else {
      newSaved.add(id);
    }
    setSavedPairings(newSaved);
  };

  const getPairingTypeChip = (type: string) => {
    const configs = {
      perfect: { label: 'Accord Parfait', color: 'success' as const, icon: <AutoAwesomeIcon /> },
      excellent: { label: 'Excellent', color: 'primary' as const, icon: <WineBarIcon /> },
      good: { label: 'Bon Accord', color: 'info' as const, icon: <LocalBarIcon /> },
      audacious: { label: 'Audacieux', color: 'warning' as const, icon: <EmojiObjectsIcon /> }
    };
    
    const config = configs[type as keyof typeof configs] || configs.good;
    
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  const renderCellarMatch = (match: ScoredBottle) => {
    const isExpanded = expandedCards.has(match.bottle.id);
    const isSaved = savedPairings.has(match.bottle.id);
    const wine = match.bottle.wine as DBWine;

    return (
      <Grid size={{ xs: 12, md: 6 }} key={match.bottle.id}>
        <Zoom in={true} style={{ transitionDelay: '100ms' }}>
          <Card 
            elevation={3}
            sx={{ 
              height: '100%',
              transition: 'all 0.3s',
              '&:hover': { 
                transform: 'translateY(-4px)',
                boxShadow: 6 
              },
              ...(match.pairingType === 'audacious' && {
                border: '2px solid',
                borderColor: 'warning.main'
              })
            }}
          >
            <CardContent>
              {/* En-tête */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box flex={1}>
                  <Link href={`/wine/${wine.id}`} style={{ textDecoration: 'none' }}>
                    <Typography 
                      variant="h6" 
                      component="h3"
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      {wine.name}
                    </Typography>
                  </Link>
                  <Typography variant="body2" color="text.secondary">
                    {wine.vintage} • {wine.region} {wine.appellation}
                  </Typography>
                </Box>
                <Box display="flex" gap={1}>
                  {getPairingTypeChip(match.pairingType)}
                  <IconButton
                    size="small"
                    onClick={() => toggleSaved(match.bottle.id)}
                  >
                    {isSaved ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
                  </IconButton>
                </Box>
              </Box>

              {/* Score */}
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Rating 
                  value={match.score / 2} 
                  precision={0.5} 
                  readOnly 
                  size="small"
                />
                <Typography variant="body2" fontWeight="bold">
                  {match.score}/10
                </Typography>
              </Box>

              {/* Explication courte */}
              <Typography variant="body2" paragraph>
                {match.explanation}
              </Typography>

              {/* Bouton pour plus de détails */}
              <Button
                size="small"
                onClick={() => toggleExpanded(match.bottle.id)}
                endIcon={<ExpandMoreIcon sx={{ 
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }} />}
              >
                {isExpanded ? 'Moins de détails' : 'Plus de détails'}
              </Button>

              {/* Détails expandables */}
              <Collapse in={isExpanded}>
                <Box mt={2}>
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Pourquoi ça marche */}
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                    Pourquoi cet accord fonctionne :
                  </Typography>
                  <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                    {match.whyItWorks.map((reason, idx) => (
                      <Typography component="li" variant="body2" key={idx} sx={{ mb: 0.5 }}>
                        {reason}
                      </Typography>
                    ))}
                  </Box>

                  {/* Conseils de service */}
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>
                    Conseils de service :
                  </Typography>
                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                        <ThermometerIcon color="action" fontSize="small" />
                        <Typography variant="caption" display="block">
                          {match.servingTips.temperature}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                        <LocalBarIcon color="action" fontSize="small" />
                        <Typography variant="caption" display="block">
                          {match.servingTips.glassType}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                        <InfoIcon color="action" fontSize="small" />
                        <Typography variant="caption" display="block">
                          {match.servingTips.decanting}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Zoom>
      </Grid>
    );
  };

  const renderPurchaseSuggestion = (suggestion: PurchaseSuggestion, index: number) => {
    const isExpanded = expandedCards.has(`purchase-${index}`);

    return (
      <Grid size={12} key={index}>
        <Fade in={true} style={{ transitionDelay: '200ms' }}>
          <Card 
            elevation={4}
            sx={{ 
              background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
              dark: { background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    🏆 {suggestion.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {suggestion.producer} • {suggestion.vintage || 'NV'} • {suggestion.appellation}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip 
                      label={suggestion.priceRange} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    <Chip 
                      label={`Score: ${suggestion.score}/10`} 
                      size="small" 
                      color="success"
                      icon={<AutoAwesomeIcon />}
                    />
                  </Box>
                </Box>
                <Tooltip title="Ajouter à ma liste d'achats">
                  <IconButton color="primary">
                    <ShoppingCartIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography variant="body2" paragraph>
                {suggestion.explanation}
              </Typography>

              <Button
                size="small"
                onClick={() => toggleExpanded(`purchase-${index}`)}
                endIcon={<ExpandMoreIcon sx={{ 
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }} />}
              >
                Voir les détails
              </Button>

              <Collapse in={isExpanded}>
                <Box mt={2}>
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Pourquoi c&apos;est parfait :
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {suggestion.whyPerfect.map((reason, idx) => (
                          <Typography component="li" variant="body2" key={idx}>
                            {reason}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Où le trouver :
                      </Typography>
                      <Box>
                        {suggestion.whereToBuy.map((place, idx) => (
                          <Chip 
                            key={idx}
                            label={place} 
                            size="small" 
                            variant="outlined"
                            sx={{ m: 0.5 }}
                            icon={<LocalOfferIcon />}
                          />
                        ))}
                      </Box>
                      
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                        Profil du vin :
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Style :</strong> {suggestion.characteristics.style}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Profil :</strong> {suggestion.characteristics.profile}
                      </Typography>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {suggestion.characteristics.notes.map((note, idx) => (
                          <Chip
                            key={idx}
                            label={note}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Fade>
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg">
      {/* Barre de recherche */}
      <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h4" component="h1" gutterBottom textAlign="center">
          🍷 Accords Mets & Vins
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" paragraph>
          Découvrez les accords parfaits avec vos vins en cave et des suggestions d'achat
        </Typography>
        
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Décrivez votre plat... (ex: Homard grillé au beurre de corail)"
            value={foodQuery}
            onChange={(e) => setFoodQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <RestaurantMenuIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={loading || !foodQuery.trim()}
                    sx={{ borderRadius: 2 }}
                    startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                  >
                    {loading ? 'Analyse...' : 'Chercher'}
                  </Button>
                </InputAdornment>
              )
            }}
          />
        </Box>
      </Paper>

      {/* Résultats */}
      {analysis && (
        <Fade in={true}>
          <Box>
            {/* Analyse du plat */}
            <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                📊 Analyse du plat
              </Typography>
              <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" paragraph>
                    <strong>Ingrédients principaux :</strong> {analysis.dishAnalysis.mainIngredients.join(&apos;, &apos;)}
                </Typography>
                <Typography variant="body2" paragraph>
                    <strong>Méthode de cuisson :</strong> {analysis.dishAnalysis.cookingMethod}
                </Typography>
                  <Typography variant="body2">
                    <strong>Intensité :</strong> 
                    <Chip 
                      label={analysis.dishAnalysis.intensity} 
                      size="small" 
                      sx={{ ml: 1 }}
                      color={
                        analysis.dishAnalysis.intensity === 'light' ? 'success' :
                        analysis.dishAnalysis.intensity === 'medium' ? 'warning' : 'error'
                      }
                    />
                  </Typography>
                </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" paragraph>
                    <strong>Saveurs dominantes :</strong> {analysis.dishAnalysis.dominantFlavors.join(&apos;, &apos;)}
                </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Texture :</strong> {analysis.dishAnalysis.texture}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                💡 Principes d&apos;accord appliqués :
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                {analysis.pairingPrinciples.map((principle, idx) => (
                  <Typography component="li" variant="body2" key={idx} sx={{ mb: 0.5 }}>
                    {principle}
                  </Typography>
                ))}
              </Box>
            </Paper>

            {/* Vins de la cave */}
            <Box mb={4}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WineBarIcon /> 
                Dans votre cave 
                <Badge badgeContent={analysis.cellarMatches.length} color="primary" sx={{ ml: 1 }}>
                  <Box />
                </Badge>
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Voici les meilleures bouteilles de votre cave pour accompagner ce plat
              </Typography>
              
              <Grid container spacing={3}>
                {analysis.cellarMatches.map(match => renderCellarMatch(match))}
              </Grid>
            </Box>

            {/* Suggestions d'achat */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon /> 
                Suggestions d&apos;achat parfait
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Ces vins seraient des accords exceptionnels à découvrir
              </Typography>
              
              <Grid container spacing={3}>
                {analysis.purchaseSuggestions.map((suggestion, idx) => 
                  renderPurchaseSuggestion(suggestion, idx)
                )}
              </Grid>
            </Box>
          </Box>
        </Fade>
      )}

      {/* État vide */}
      {!loading && !analysis && foodQuery && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            Aucun résultat trouvé
          </Typography>
        </Box>
      )}
    </Container>
  );
}