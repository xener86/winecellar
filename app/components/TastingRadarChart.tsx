import React, { useState, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip 
} from 'recharts';

interface Characteristics {
  body: number;
  acidity: number;
  tannin: number;
  sweetness: number;
  fruitiness: number;
  complexity: number;
  oak: number;
  intensity: number;
}

interface Keywords {
  body: string[];
  acidity: string[];
  tannin: string[];
  sweetness: string[];
  fruitiness: string[];
  complexity: string[];
  oak: string[];
  intensity: string[];
}

const analyzeTastingNotes = (notes: string): Characteristics | null => {
  if (!notes) return null;
  
  const characteristics: Characteristics = {
    body: 0,
    acidity: 0,
    tannin: 0,
    sweetness: 0,
    fruitiness: 0,
    complexity: 0,
    oak: 0,
    intensity: 0,
  };
  
  const keywords: Keywords = {
    body: ['corsé', 'corps', 'charnu', 'puissant', 'charpenté', 'dense', 'opulent', 'structuré'],
    acidity: ['acidité', 'vif', 'frais', 'nerveux', 'tendu', 'vivacité', 'alerte', 'piquant'],
    tannin: ['tannique', 'tannins', 'astringent', 'ferme', 'serré', 'austère', 'musclé', 'mordant'],
    sweetness: ['doux', 'sucre', 'miellé', 'moelleux', 'liquoreux', 'velouté', 'onctueux', 'suave'],
    fruitiness: ['fruit', 'fruité', 'juteux', 'mûr', 'gourmand', 'pulpeux', 'frais', 'croquant'],
    complexity: ['complexe', 'nuancé', 'profond', 'multicouche', 'sophistiqué', 'riche', 'élaboré', 'subtil'],
    oak: ['boisé', 'vanillé', 'toasté', 'fumé', 'grillé', 'épicé', 'caramel', 'café'],
    intensity: ['intense', 'expressif', 'puissant', 'prononcé', 'persistant', 'marqué', 'présent', 'aromatique']
  };
  
  const lowerNotes = notes.toLowerCase();
  
  const isRed = lowerNotes.includes('rouge') ||
                lowerNotes.includes('tannin') ||
                lowerNotes.includes('corsé');
                
  const isWhite = lowerNotes.includes('blanc') ||
                  lowerNotes.includes('acidité') ||
                  lowerNotes.includes('vif');
  
  const isSweet = lowerNotes.includes('doux') ||
                  lowerNotes.includes('moelleux') ||
                  lowerNotes.includes('liquoreux');
  
  if (isRed) {
    characteristics.body = 3;
    characteristics.tannin = 3;
    characteristics.acidity = 2;
  } else if (isWhite) {
    characteristics.acidity = 3;
    characteristics.body = 2;
  }
  
  if (isSweet) {
    characteristics.sweetness = 4;
  }
  
  // Analyse de chaque caractéristique à l'aide des mots-clés
  (Object.keys(keywords) as (keyof Keywords)[]).forEach((characteristic) => {
    keywords[characteristic].forEach((keyword: string) => {
      if (lowerNotes.includes(keyword)) {
        const index = lowerNotes.indexOf(keyword);
        const contextStart = Math.max(0, index - 20);
        const contextEnd = Math.min(lowerNotes.length, index + 20);
        const context = lowerNotes.substring(contextStart, contextEnd);
        
        let increment = 1;
        
        if (
          context.includes('très') ||
          context.includes('fort') ||
          context.includes('intense') ||
          context.includes('beaucoup') ||
          context.includes('remarquable')
        ) {
          increment = 2;
        }
        
        if (
          context.includes('peu') ||
          context.includes('léger') ||
          context.includes('faible') ||
          context.includes('délicat') ||
          context.includes('subtil')
        ) {
          increment = 0.5;
        }
        
        characteristics[characteristic] += increment;
      }
    });
    
    characteristics[characteristic] = Math.min(5, Math.max(1, characteristics[characteristic]));
  });
  
  return characteristics;
};

interface WineTastingNotes {
  appearance?: string;
  nose?: string;
  palate?: string;
}

interface Wine {
  color: 'red' | 'white' | 'rose' | 'sparkling' | 'fortified' | string;
  tasting_notes?: WineTastingNotes;
  notes?: string;
}

interface ChartData {
  name: string;
  value: number;
  fullMark: number;
}

interface TastingRadarChartProps {
  wine: Wine;
  height?: number;
  showTitle?: boolean;
  showFootnote?: boolean;
}

const TastingRadarChart: React.FC<TastingRadarChartProps> = ({ wine, height = 220, showTitle = false, showFootnote = true }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  useEffect(() => {
    if (!wine) return;
    
    let characteristics: Characteristics | null = null;
    
    if (
      wine.tasting_notes &&
      (wine.tasting_notes.appearance || wine.tasting_notes.nose || wine.tasting_notes.palate)
    ) {
      const allNotes = [
        wine.tasting_notes.appearance,
        wine.tasting_notes.nose,
        wine.tasting_notes.palate
      ]
        .filter(Boolean)
        .join(' ');
      characteristics = analyzeTastingNotes(allNotes);
    } else if (wine.notes) {
      characteristics = analyzeTastingNotes(wine.notes);
    } else {
      characteristics = getDefaultCharacteristics(wine.color);
    }
    
    if (characteristics) {
      const data: ChartData[] = [
        { name: 'Corps', value: characteristics.body, fullMark: 5 },
        { name: 'Acidité', value: characteristics.acidity, fullMark: 5 },
        { name: 'Tanins', value: wine.color === 'red' ? characteristics.tannin : 1, fullMark: 5 },
        { name: 'Douceur', value: characteristics.sweetness, fullMark: 5 },
        { name: 'Fruité', value: characteristics.fruitiness, fullMark: 5 },
        { name: 'Complexité', value: characteristics.complexity, fullMark: 5 },
        { name: 'Boisé', value: characteristics.oak, fullMark: 5 },
        { name: 'Intensité', value: characteristics.intensity, fullMark: 5 },
      ];
      
      setChartData(data);
    }
  }, [wine]);
  
  const getDefaultCharacteristics = (color: string): Characteristics => {
    const defaults: Characteristics = {
      body: 3,
      acidity: 3,
      tannin: 1,
      sweetness: 1,
      fruitiness: 3,
      complexity: 3,
      oak: 2,
      intensity: 3,
    };
    
    switch (color) {
      case 'red':
        return { ...defaults, body: 4, tannin: 4, sweetness: 1, acidity: 3 };
      case 'white':
        return { ...defaults, body: 2, acidity: 4, tannin: 1, fruitiness: 4 };
      case 'rose':
        return { ...defaults, body: 2, acidity: 4, tannin: 1, fruitiness: 4, sweetness: 2 };
      case 'sparkling':
        return { ...defaults, body: 2, acidity: 5, tannin: 1, complexity: 3, sweetness: 2 };
      case 'fortified':
        return { ...defaults, body: 5, tannin: 3, sweetness: 4, intensity: 5, complexity: 4 };
      default:
        return defaults;
    }
  };
  
  const getColorStyle = (): { fill: string; stroke: string } => {
    if (!wine) return { fill: "#8B451350", stroke: "#8B4513" };
    
    const colors: { [key: string]: { fill: string; stroke: string } } = {
      red: { fill: "#9A2A2A50", stroke: "#9A2A2A" },
      white: { fill: "#DAA52050", stroke: "#DAA520" },
      rose: { fill: "#FF69B450", stroke: "#FF69B4" },
      sparkling: { fill: "#87CEEB50", stroke: "#87CEEB" },
      fortified: { fill: "#8B451350", stroke: "#8B4513" }
    };
    
    return colors[wine.color as keyof typeof colors] || { fill: "#8B451350", stroke: "#8B4513" };
  };
  
  // Interface pour définir la structure du payload du Tooltip
  interface TooltipPayloadItem {
    payload: ChartData;
  }
  
  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
  }
  
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload;
      const labels: Record<number, string> = {
        1: 'Très faible',
        2: 'Faible',
        3: 'Moyen',
        4: 'Élevé',
        5: 'Très élevé'
      };
      
      return (
        <div className="bg-white p-2 shadow-sm rounded border border-gray-200 text-xs">
          <p className="font-medium">{name}: {labels[Math.round(value)]}</p>
        </div>
      );
    }
    return null;
  };
  
  const colorStyle = getColorStyle();
  
  if (chartData.length === 0 || !wine) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl text-center">
        <p className="text-gray-500">Données de dégustation non disponibles</p>
      </div>
    );
  }
  
  return (
    <div className="w-full" style={{ position: 'relative' }}>
      {showTitle && (
        <div className="text-xs text-gray-600 mb-2">
          Caractéristiques principales basées sur les notes de dégustation
        </div>
      )}
      
      <div style={{ height: height, width: '100%', overflow: 'hidden' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart outerRadius="65%" data={chartData}>
            <PolarGrid stroke="#e0e0e0" strokeDasharray="2 2" />
            <PolarAngleAxis dataKey="name" tick={{ fill: '#666666', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} tickCount={6} axisLine={false} />
            <Radar 
              name="Caractéristiques" 
              dataKey="value" 
              stroke={colorStyle.stroke} 
              fill={colorStyle.fill} 
              fillOpacity={0.6} 
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {showFootnote && (
        <div className="text-center text-xs text-gray-500 mt-1">
          Profil basé sur {wine.tasting_notes ? 'les notes de dégustation' : 'les caractéristiques typiques de ce type de vin'}
        </div>
      )}
    </div>
  );
};

export default TastingRadarChart;
