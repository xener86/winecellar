import React, { useState, useEffect } from 'react';
import { Info, X, MapPin, Leaf, Clock } from 'lucide-react';

// Types pour plus de sécurité
interface AppellationData {
  name: string;
  region: string;
  country: string;
  description: string;
  grapes: string[];
  characteristics: string;
  history: string;
  imageUrl: string;
}

interface AIResponse {
  appellation: string;
  description: string;
  characteristics: string;
  pairings: string;
}

interface AppellationInfoProps {
  appellation: string | null;
  region?: string;
}

// Base de données simplifiée des appellations
const appellationsDB: Record<string, AppellationData> = {
  "bordeaux": {
    name: "Bordeaux",
    region: "Bordeaux",
    country: "France",
    description: "L'appellation Bordeaux est l'une des plus prestigieuses et anciennes régions viticoles du monde. Elle englobe une vaste zone géographique divisée par la Garonne et la Dordogne.",
    grapes: ["Cabernet Sauvignon", "Merlot", "Cabernet Franc", "Petit Verdot", "Malbec", "Sauvignon Blanc", "Sémillon"],
    characteristics: "Les vins rouges de Bordeaux sont généralement structurés, tanniques et offrent des arômes de fruits noirs, de cèdre et d'épices. Les blancs sont souvent vifs avec des notes d'agrumes et de fruits blancs.",
    history: "La viticulture à Bordeaux remonte à l'époque romaine. Au 12ème siècle, l'exportation de vin vers l'Angleterre a grandement contribué à sa renommée internationale.",
    imageUrl: "/images/regions/bordeaux.jpg"
  },
  "bourgogne": {
    name: "Bourgogne",
    region: "Bourgogne",
    country: "France",
    description: "La Bourgogne, située dans l'est de la France, est célèbre pour ses vins de terroir. C'est le lieu de naissance des vins monocépages de classe mondiale basés sur le Pinot Noir et le Chardonnay.",
    grapes: ["Pinot Noir", "Chardonnay", "Aligoté", "Gamay"],
    characteristics: "Les vins rouges de Bourgogne expriment des arômes de petits fruits rouges, de sous-bois et d'épices. Les blancs présentent des notes de fruits à noyau, de minéralité et parfois de beurre et de noisette.",
    history: "La tradition viticole bourguignonne a été fortement influencée par les moines cisterciens au Moyen Âge, qui ont délimité minutieusement les terroirs et affiné les techniques de viticulture.",
    imageUrl: "/images/regions/bourgogne.jpg"
  },
  "champagne": {
    name: "Champagne",
    region: "Champagne",
    country: "France",
    description: "La Champagne est mondialement connue pour ses vins effervescents. Seuls les vins élaborés dans cette région selon la méthode traditionnelle peuvent porter le nom de Champagne.",
    grapes: ["Chardonnay", "Pinot Noir", "Pinot Meunier"],
    characteristics: "Les Champagnes offrent des notes d'agrumes, de pomme verte, de brioche et de pain grillé. La méthode de vinification leur confère finesse, complexité et cette effervescence caractéristique.",
    history: "La méthode champenoise a été perfectionnée au 17ème siècle. Dom Pérignon, un moine bénédictin, a contribué à améliorer la qualité et la stabilité des vins de Champagne.",
    imageUrl: "/images/regions/champagne.jpg"
  }
};

// Fonction pour normaliser le nom d'appellation pour la recherche
const normalizeAppellation = (appellation: string | null): string => {
  if (!appellation) return "";
  return appellation
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

// Fonction pour trouver l'appellation la plus proche dans notre base
const findClosestAppellation = (appellation: string | null): AppellationData | null => {
  if (!appellation) return null;
  
  const normalized = normalizeAppellation(appellation);
  if (normalized === "") return null;
  
  // Recherche exacte
  for (const key in appellationsDB) {
    if (key === normalized || normalizeAppellation(appellationsDB[key].name) === normalized) {
      return appellationsDB[key];
    }
  }
  
  // Recherche partielle
  for (const key in appellationsDB) {
    if (key.includes(normalized) || normalized.includes(key) || 
        normalizeAppellation(appellationsDB[key].name).includes(normalized) || 
        normalized.includes(normalizeAppellation(appellationsDB[key].name))) {
      return appellationsDB[key];
    }
  }
  
  return null;
};

const AppellationInfo: React.FC<AppellationInfoProps> = ({ appellation, region }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [appellationData, setAppellationData] = useState<AppellationData | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (!appellation) {
      setAppellationData(null);
      return;
    }
    
    setLoading(true);
    
    // Recherche dans notre base de données locale
    const data = findClosestAppellation(appellation);
    setAppellationData(data);
    setLoading(false);
    
  }, [appellation, region]);
  
  // Simulation de demande IA (dans un vrai cas, ce serait un appel à une API)
  const fetchAIData = () => {
    if (!appellation || aiResponse) {
      // Pas d'appellation ou déjà chargé
      return;
    }
    
    setAiLoading(true);
    
    // Simuler un délai de chargement (à remplacer par un vrai appel API)
    setTimeout(() => {
      const generatedResponse: AIResponse = {
        appellation: appellation,
        description: `L&apos;appellation ${appellation} est reconnue pour la qualité exceptionnelle de ses vins. Le terroir unique, combinant des sols ${Math.random() > 0.5 ? 'calcaires' : 'argileux'} et un microclimat favorable, confère aux vins une signature gustative distincte.`,
        characteristics: `Les vins de ${appellation} présentent typiquement des arômes de ${Math.random() > 0.5 ? 'fruits rouges mûrs et d&apos;épices douces' : 'fruits noirs, de réglisse et de notes minérales'}, avec une structure tannique ${Math.random() > 0.5 ? 'élégante et soyeuse' : 'puissante mais équilibrée'}.`,
        pairings: `Ces vins s'accordent particulièrement bien avec ${Math.random() > 0.5 ? 'les viandes rouges grillées, le gibier et les fromages affinés' : 'les plats mijotés, les champignons sauvages et les fromages à pâte dure'}.`
      };
      
      setAiResponse(generatedResponse);
      setAiLoading(false);
    }, 2000);
  };
  
  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Si on étend le panneau et qu'on n'a ni données d'appellation ni réponse IA
    if (newExpandedState && !aiResponse && !appellationData && !aiLoading) {
      fetchAIData();
    }
  };
  
  // Si pas d'appellation, ne rien afficher
  if (!appellation) return null;
  
  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={toggleExpand}
      >
        <div className="flex items-center">
          <Info className="mr-2 text-wine-burgundy" size={20} />
          <h3 className="font-serif font-semibold">À propos de l&apos;appellation {appellation}</h3>
        </div>
        
        <button 
          className="p-1 rounded-full hover:bg-gray-100"
          aria-label={isExpanded ? "Fermer les informations" : "Afficher les informations"} 
        >
          {isExpanded ? <X size={18} /> : <Info size={18} />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="px-6 pb-6">
          {/* État de chargement */}
          {(loading || aiLoading) && !appellationData && !aiResponse && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-t-wine-burgundy border-b-wine-burgundy border-l-transparent border-r-transparent rounded-full animate-spin" aria-label="Chargement..."></div>
            </div>
          )}
          
          {/* Affichage des données d'appellation */}
          {appellationData && (
            <div className="space-y-4">
              <div className="bg-wine-burgundy/5 rounded-lg p-4">
                <div className="flex items-start">
                  <MapPin className="text-wine-burgundy mt-1 mr-3" size={20} />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Région: {appellationData.region}, {appellationData.country}</h4>
                    <p className="text-gray-700">{appellationData.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-wine-burgundy/5 rounded-lg p-4">
                  <div className="flex items-start">
                    <Leaf className="text-wine-burgundy mt-1 mr-3" size={20} />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Cépages principaux</h4>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {appellationData.grapes.map((grape, index) => (
                          <span 
                            key={index} 
                            className="px-2 py-1 bg-white text-wine-burgundy text-xs font-medium rounded-full border border-wine-burgundy/20"
                          >
                            {grape}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-700 mt-3">{appellationData.characteristics}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-wine-burgundy/5 rounded-lg p-4">
                  <div className="flex items-start">
                    <Clock className="text-wine-burgundy mt-1 mr-3" size={20} />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Histoire</h4>
                      <p className="text-gray-700">{appellationData.history}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Affichage des données générées par l'IA */}
          {!appellationData && aiResponse && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
                      AI
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Informations générées par IA</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Ces informations ont été générées par intelligence artificielle et peuvent ne pas être entièrement exactes.
                    </p>
                    <p className="text-gray-700 mb-3">{aiResponse.description}</p>
                    <p className="text-gray-700 mb-3">{aiResponse.characteristics}</p>
                    <p className="text-gray-700">{aiResponse.pairings}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Affichage si aucune donnée n'est disponible */}
          {!appellationData && !aiResponse && !loading && !aiLoading && (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-500">Aucune information disponible pour cette appellation.</p>
              <button 
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                onClick={fetchAIData}
                disabled={!appellation}
              >
                Demander à l&apos;IA
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppellationInfo;