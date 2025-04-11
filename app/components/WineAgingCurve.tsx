import React, { useState, useEffect } from 'react';
import { Area } from 'recharts';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { Button, CircularProgress, Paper, Typography, Box, Chip, Divider } from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WineBarIcon from '@mui/icons-material/WineBar';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import UpdateIcon from '@mui/icons-material/Update';
import WineAIService from '../services/WineAIService';

// Créer une instance du service
const wineAIService = new WineAIService();

// Define types for our component
interface WineData {
  vintage: number;
  color?: 'red' | 'white' | 'rose' | 'sparkling' | 'fortified';
  region?: string;
  vintage_score?: number;
}

interface AgingDetails {
  peak_start_year: number;
  peak_end_year: number;
  potential_years: number;
  current_phase: string;
  drink_now: boolean;
}

interface DataPoint {
  year: number;
  age: number;
  quality: number;
  phase: string;
  phaseLabel: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DataPoint;
  }>;
}

interface WineAgingCurveProps {
  wine: WineData;
  height?: number;
  showDetails?: boolean;
  refreshable?: boolean;
  apiConfig?: Record<string, unknown> | null;
  onDataUpdate?: ((data: AgingDetails) => void) | null;
}

/**
 * Composant amélioré pour visualiser la courbe de vieillissement d'un vin
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.wine - Données du vin
 * @param {number} props.height - Hauteur du graphique (défaut: 220px)
 * @param {boolean} props.showDetails - Afficher les détails additionnels (défaut: true)
 * @param {boolean} props.refreshable - Permettre le rafraîchissement des données (défaut: false)
 * @param {Object} props.apiConfig - Configuration pour les appels API (optionnel)
 * @param {Function} props.onDataUpdate - Callback lorsque les données sont mises à jour (optionnel)
 */
const WineAgingCurve: React.FC<WineAgingCurveProps> = ({ 
  wine, 
  height = 220, 
  showDetails = true, 
  refreshable = false,
  apiConfig = null,
  onDataUpdate = null
}) => {
  const [agingData, setAgingData] = useState<DataPoint[]>([]);
  const [peakYear, setPeakYear] = useState<number | null>(null);
  const [estimatedPeakAge, setEstimatedPeakAge] = useState<number>(8);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [agingDetails, setAgingDetails] = useState<AgingDetails | null>(null);
  const [vintageScore, setVintageScore] = useState<number | null>(null);

  // Effet pour charger les données de vieillissement
  useEffect(() => {
    loadAgingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wine]);

  /**
   * Charge les données de vieillissement du vin
   * @param {boolean} forceRefresh - Forcer le rafraîchissement des données
   */
  const loadAgingData = async (forceRefresh = false) => {
    // Réinitialiser les états
    setError(null);
    
    // Vérification des données obligatoires
    if (!wine || !wine.vintage) {
      setError("Impossible de calculer la courbe : millésime manquant");
      return;
    }
    
    setLoading(true);
    
    try {
      // Options pour la requête API
      const options = {
        forceRefresh,
        enhanceWithAI: !!apiConfig,
        ...(apiConfig || {})
      };
      
      // Récupérer les données de vieillissement via le service
      const details = await wineAIService.getAgingData(wine, options);
      
      if (!details) {
        throw new Error("Données de vieillissement non disponibles");
      }
      
      // Stocker les détails de vieillissement
      setAgingDetails(details as AgingDetails);
      
      // Mettre à jour les états
      setEstimatedPeakAge(calculatePeakAge(details as AgingDetails));
      
      // On doit typer l'objet details pour accéder à ses propriétés
      const typedDetails = details as AgingDetails;
      setPeakYear(typedDetails.peak_start_year + Math.floor((typedDetails.peak_end_year - typedDetails.peak_start_year) / 2));
      
      // Générer les points pour la courbe
      const dataPoints = generateAgingCurvePoints(wine, details as AgingDetails);
      setAgingData(dataPoints);
      
      // Récupérer le score du millésime si disponible
      if (wine.vintage_score) {
        setVintageScore(wine.vintage_score);
      } else if (wine.region) {
        const scoreData = await wineAIService.getVintageScore(wine.region, wine.vintage);
        if (scoreData) {
          setVintageScore(scoreData);
        }
      }
      
      // Appeler le callback si fourni
      if (onDataUpdate) {
        onDataUpdate(details as AgingDetails);
      }

    } catch (err) {
      console.error("Erreur lors du chargement des données de vieillissement:", err);
      setError((err as Error).message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calcule l'âge d'apogée à partir des données de vieillissement
   * @param {AgingDetails} agingDetails - Détails de vieillissement
   * @returns {number} - Âge d'apogée estimé
   */
  const calculatePeakAge = (agingDetails: AgingDetails): number => {
    if (!agingDetails || !wine || !wine.vintage) return 8;
    
    const peakMidYear = agingDetails.peak_start_year + 
                        Math.floor((agingDetails.peak_end_year - agingDetails.peak_start_year) / 2);
    return peakMidYear - wine.vintage;
  };

  /**
   * Génère les points pour la courbe de vieillissement
   * @param {WineData} wine - Données du vin
   * @param {AgingDetails} agingDetails - Détails de vieillissement
   * @returns {Array} - Points de données pour le graphique
   */
  const generateAgingCurvePoints = (wine: WineData, agingDetails: AgingDetails): DataPoint[] => {
    if (!wine || !wine.vintage || !agingDetails) return [];
    
    const totalYears = agingDetails.potential_years + 2; // Ajouter 2 ans pour visualiser au-delà
    const peakStartAge = agingDetails.peak_start_year - wine.vintage;
    const peakEndAge = agingDetails.peak_end_year - wine.vintage;
    
    const dataPoints: DataPoint[] = [];
    
    for (let i = 0; i <= totalYears; i++) {
      const year = wine.vintage + i;
      let quality = 0;
      
      // Calcul de la qualité selon une courbe avec 4 phases
      if (i < peakStartAge * 0.4) {
        // Phase jeunesse (montée rapide)
        quality = 30 + (i / (peakStartAge * 0.4)) * 40;
      } else if (i < peakStartAge) {
        // Phase maturation (montée plus douce)
        const progress = (i - peakStartAge * 0.4) / (peakStartAge - peakStartAge * 0.4);
        quality = 70 + progress * 25;
      } else if (i <= peakEndAge) {
        // Plateau d'apogée
        quality = 95 - ((i - peakStartAge) / (peakEndAge - peakStartAge)) * 5;
      } else {
        // Déclin
        const decline = (i - peakEndAge) / (totalYears - peakEndAge);
        quality = 90 - decline * 80;
      }
      
      // Assurer que la qualité reste dans les limites raisonnables
      quality = Math.max(10, Math.min(100, quality));
      
      // Déterminer la phase
      let phase = "youth";
      if (i < peakStartAge * 0.4) phase = "youth";
      else if (i < peakStartAge) phase = "development";
      else if (i <= peakEndAge) phase = "peak";
      else phase = "decline";
      
      // Traduction en français pour l'affichage
      const phaseLabels: Record<string, string> = {
        "youth": "Jeunesse",
        "development": "Maturité",
        "peak": "Apogée",
        "decline": "Déclin"
      };
      
      dataPoints.push({
        year,
        age: i,
        quality: Math.round(quality),
        phase,
        phaseLabel: phaseLabels[phase]
      });
    }
    
    return dataPoints;
  };

  // Style et couleurs basés sur le type de vin
  const getColorStyle = () => {
    if (!wine) return { fill: "#8B451350", stroke: "#8B4513" };
    
    const colors: Record<string, { fill: string; stroke: string }> = {
      red: { fill: "#9A2A2A50", stroke: "#9A2A2A" },
      white: { fill: "#DAA52050", stroke: "#DAA520" },
      rose: { fill: "#FF69B450", stroke: "#FF69B4" },
      sparkling: { fill: "#87CEEB50", stroke: "#87CEEB" },
      fortified: { fill: "#8B451350", stroke: "#8B4513" }
    };
    
    return colors[wine.color || "red"] || { fill: "#8B451350", stroke: "#8B4513" };
  };
  
  const colorStyle = getColorStyle();
  
  // Formatter personnalisé pour le tooltip
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper className="p-2 bg-white shadow-sm rounded-md border border-gray-200 text-xs" elevation={3}>
          <Typography variant="subtitle2">{data.year} (Âge: {data.age} ans)</Typography>
          <Typography variant="body2" color="textSecondary">Phase: {data.phaseLabel}</Typography>
          <Typography variant="body2" color="textSecondary">Qualité estimée: {data.quality}%</Typography>
          
          {data.year === new Date().getFullYear() && (
            <Box mt={1} pt={1} borderTop={1} borderColor="divider">
              <Typography variant="body2" color="primary">Année courante</Typography>
            </Box>
          )}
        </Paper>
      );
    }
    return null;
  };
  
  // Si en cours de chargement, afficher un indicateur
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height} width="100%">
        <CircularProgress size={40} />
      </Box>
    );
  }
  
  // Si erreur, afficher un message
  if (error) {
    return (
      <Paper elevation={0} className="p-4 bg-gray-50 rounded-xl text-center">
        <ErrorOutlineIcon color="error" />
        <Typography color="error" variant="body2">{error}</Typography>
      </Paper>
    );
  }
  
  // Si pas de données ou pas de millésime, afficher un message
  if (agingData.length === 0 || !wine?.vintage) {
    return (
      <Paper elevation={0} className="p-4 bg-gray-50 rounded-xl text-center">
        <InfoOutlinedIcon color="disabled" />
        <Typography color="textSecondary">Données de vieillissement non disponibles</Typography>
      </Paper>
    );
  }
  
  // Rendu principal du composant
  return (
    <Box className="w-full" style={{ position: 'relative' }}>
      {/* Carte principale contenant le graphique */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        {/* En-tête avec titre et indicateurs */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon sx={{ mr: 1, color: colorStyle.stroke }} />
            Courbe de vieillissement
          </Typography>
          
          {refreshable && (
            <Button 
              size="small" 
              startIcon={<AutorenewIcon />} 
              onClick={() => loadAgingData(true)}
            >
              Actualiser
            </Button>
          )}
        </Box>
        
        {/* Indicateurs de millésime */}
        {vintageScore && (
          <Box display="flex" alignItems="center" mb={1}>
            <Chip
              icon={<EmojiEventsIcon />}
              label={`Millésime: ${vintageScore}/20`}
              size="small"
              color={vintageScore >= 15 ? "success" : vintageScore >= 12 ? "primary" : "default"}
              variant="outlined"
              sx={{ mr: 1 }}
            />
            
            {agingDetails?.drink_now && (
              <Chip
                icon={<WineBarIcon />}
                label="Prêt à boire"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        )}
        
        {/* Graphique */}
        <Box style={{ height: height, width: '100%', overflow: 'hidden' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={agingData} 
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorStyle.stroke} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={colorStyle.stroke} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="year" 
                tickFormatter={(value) => value % 4 === 0 ? value : ''} 
                tick={{ fontSize: 10 }}
                height={20}
                tickSize={5}
                axisLine={{ stroke: '#E0E0E0' }}
              />
              <YAxis 
                tick={{ fontSize: 9 }} 
                domain={[0, 100]} 
                tickFormatter={(value) => value === 0 ? '' : value === 100 ? value : ''}
                width={20}
                tickSize={3}
                axisLine={{ stroke: '#E0E0E0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="quality" 
                stroke={colorStyle.stroke} 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorQuality)" 
              />
              
              {/* Ligne verticale pour l'année actuelle */}
              <ReferenceLine 
                x={new Date().getFullYear()} 
                stroke="#FF0000" 
                strokeWidth={1} 
                strokeDasharray="3 3"
                label={{
                  value: 'Auj.',
                  position: 'top',
                  fill: '#FF0000',
                  fontSize: 9,
                  dy: -2
                }}
              />
              
              {/* Points clés pour chaque phase */}
              {agingData
                .filter(d => (
                  (d.phase === "youth" && d.age === Math.floor(estimatedPeakAge * 0.15)) ||
                  (d.phase === "development" && d.age === Math.floor(estimatedPeakAge * 0.7)) ||
                  (d.phase === "peak" && d.age === estimatedPeakAge) ||
                  (d.phase === "decline" && d.age === Math.floor(estimatedPeakAge * 1.8))
                ))
                .map((d, i) => (
                  <ReferenceLine 
                    key={i}
                    x={d.year} 
                    stroke="transparent"
                    label={{ 
                      value: d.phase.charAt(0).toUpperCase(), 
                      position: 'top', 
                      fontSize: 9,
                      dy: -8
                    }}
                  />
                ))
              }
            </AreaChart>
          </ResponsiveContainer>
        </Box>
        
        {/* Légende compacte sous le graphique */}
        <Box className="grid grid-cols-4 text-center text-xs text-gray-600 mt-1">
          <Box>
            <Typography variant="caption">Jeunesse</Typography>
          </Box>
          <Box>
            <Typography variant="caption">Maturité</Typography>
          </Box>
          <Box>
            <Typography variant="caption">Apogée</Typography>
          </Box>
          <Box>
            <Typography variant="caption">Déclin</Typography>
          </Box>
        </Box>
        
        {/* Note informative */}
        <Box className="text-center text-xs text-gray-500 mt-1">
          {peakYear && (
            <Typography variant="caption">
              Apogée estimée: {peakYear}
            </Typography>
          )}
        </Box>
      </Paper>
      
      {/* Détails supplémentaires si demandés */}
      {showDetails && agingDetails && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mt: 2,
            border: '1px solid', 
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Détails du potentiel de vieillissement
          </Typography>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box className="grid grid-cols-2 gap-2">
            <Box display="flex" alignItems="center">
              <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Millésime
                </Typography>
                <Typography variant="body2">
                  {wine.vintage}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center">
              <HourglassTopIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Potentiel de garde
                </Typography>
                <Typography variant="body2">
                  {agingDetails.potential_years} ans
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center">
              <UpdateIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Phase actuelle
                </Typography>
                <Typography variant="body2">
                  {(() => {
                    const phase = agingDetails.current_phase;
                    const phaseLabels: Record<string, string> = {
                      "youth": "Jeunesse",
                      "development": "Maturité",
                      "peak": "Apogée",
                      "decline": "Déclin"
                    };
                    return phaseLabels[phase] || phase;
                  })()}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center">
              <WineBarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Période d&apos;apogée
                </Typography>
                <Typography variant="body2">
                  {agingDetails.peak_start_year} - {agingDetails.peak_end_year}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box mt={2} textAlign="center">
            <Chip
              label={agingDetails.drink_now ? "Prêt à boire maintenant" : "Encore en développement"}
              color={agingDetails.drink_now ? "success" : "primary"}
              size="small"
              variant="outlined"
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default WineAgingCurve;