import React, { useState, useEffect } from 'react';

/**
 * Composant pour uniformiser l'affichage des bouteilles de vin
 * - Peut fonctionner avec une image URL ou générer une bouteille virtuelle
 * - Supprime le fond des images de bouteilles pour uniformiser l'affichage
 */
const WineBottle = ({
  imageUrl,
  wineInfo,
  color,
  showLabel = true,
  height = 300,
  onProcessedImage
}) => {
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Couleurs pour les différents types de vin
  const getWineColorStyle = (wineColor) => {
    switch (wineColor) {
      case 'white':
        return { fill: '#DAA52050', stroke: '#DAA520', glassColor: '#F9F3CF' }; // Doré pour vin blanc
      case 'red':
        return { fill: '#9A2A2A50', stroke: '#9A2A2A', glassColor: '#8B0000' }; // Rouge bordeaux
      case 'rose':
        return { fill: '#FF69B450', stroke: '#FF69B4', glassColor: '#FFB6C1' }; // Rose
      case 'sparkling':
        return { fill: '#F5F5DC50', stroke: '#F5F5DC', glassColor: '#F8F8E8' }; // Effervescent
      case 'fortified':
        return { fill: '#8B451350', stroke: '#8B4513', glassColor: '#B25900' }; // Fortifié
      default:
        return { fill: '#9A2A2A50', stroke: '#9A2A2A', glassColor: '#8B0000' }; // Par défaut: rouge
    }
  };

  const colorStyle = getWineColorStyle(color);

  useEffect(() => {
    if (!imageUrl) return;

    const processImage = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Utilisation d'une API de suppression de fond (remplacez par l'API réelle)
        // Cette fonction simule le traitement d'image - utilisez une vraie API en production
        
        // Simulation de traitement (en production, utilisez une API comme remove.bg)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Pour une vraie implémentation:
        // 1. Envoyez l'image à une API de suppression de fond (comme remove.bg, ClipDrop, etc.)
        // 2. Récupérez l'image sans fond et mettez à jour processedImage

        // Simpler une image traitée - en prod, remplacez par la réponse de l'API
        setProcessedImage(imageUrl);
        
        if (onProcessedImage) {
          onProcessedImage(imageUrl);
        }
      } catch (err) {
        console.error('Erreur de traitement d\'image:', err);
        setError('Impossible de traiter l\'image');
      } finally {
        setLoading(false);
      }
    };

    processImage();
  }, [imageUrl, onProcessedImage]);

  // Rendu d'une bouteille virtuelle si aucune image n'est fournie
  const renderVirtualBottle = () => {
    const { name, vintage, domain } = wineInfo || {};
    
    return (
      <svg width="100" height={height} viewBox="0 0 100 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="glassReflect" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id="bodyHighlight" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Goulot de la bouteille */}
        <path d="M46 20 L46 70 C46 80 44 90 40 98 C36 106 34 114 34 124 L34 260 C34 272 66 272 66 260 L66 124 C66 114 64 106 60 98 C56 90 54 80 54 70 L54 20 Z" fill="#333" />

        {/* Vin à l'intérieur de la bouteille */}
        <path d="M40 124 L60 124 L60 260 C60 262 40 262 40 260 Z" fill={colorStyle.glassColor} />

        {/* Reflets sur le verre */}
        <path d="M46 20 L46 70 C46 80 44 90 40 98 C36 106 34 114 34 124 L34 260 C34 272 66 272 66 260 L66 124 C66 114 64 106 60 98 C56 90 54 80 54 70 L54 20 Z" fill="url(#bodyHighlight)" />
        <path d="M42 80 L46 80 L46 220 L42 220 Z" fill="url(#glassReflect)" />

        {/* Étiquette de la bouteille */}
        {showLabel && (
          <>
            <rect x="34" y="150" width="32" height="50" fill="#F8F8F8" stroke="#DDD" />
            <text x="50" y="165" textAnchor="middle" fill="#333" fontSize="8" fontWeight="bold">
              {vintage || ''}
            </text>
            <text x="50" y="177" textAnchor="middle" fill="#333" fontSize="7">
              {name && name.length > 12 ? name.substring(0, 10) + '...' : name}
            </text>
            <text x="50" y="187" textAnchor="middle" fill="#333" fontSize="6">
              {domain && (domain.length > 14 ? domain.substring(0, 12) + '...' : domain)}
            </text>
          </>
        )}
      </svg>
    );
  };

  // Si nous avons une image traitée, montrons-la
  if (processedImage) {
    return (
      <div className="relative" style={{ height: `${height}px` }}>
        <img 
          src={processedImage} 
          alt={wineInfo ? wineInfo.name : "Bouteille de vin"}
          className="object-contain h-full mx-auto"
          style={{ maxHeight: '100%' }}
        />
      </div>
    );
  }

  // Si nous sommes en train de charger l'image
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="animate-pulse bg-gray-200 rounded-lg" style={{ width: '80px', height: '80%' }}></div>
      </div>
    );
  }

  // Si une erreur s'est produite ou qu'il n'y a pas d'image, affichons la bouteille virtuelle
  return renderVirtualBottle();
};

// Composants spécifiques pour chaque type de vin
export const RedWineBottle = (props) => (
  <WineBottle {...props} color="red" />
);

export const WhiteWineBottle = (props) => (
  <WineBottle {...props} color="white" />
);

export const RoseWineBottle = (props) => (
  <WineBottle {...props} color="rose" />
);

export const SparklingWineBottle = (props) => (
  <WineBottle {...props} color="sparkling" />
);

export const FortifiedWineBottle = (props) => (
  <WineBottle {...props} color="fortified" />
);

export default WineBottle;