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
        {/* Goulot de la bouteille */}
        <rect x="42" y="10" width="16" height="30" fill="#555" />
        
        {/* Corps de la bouteille */}
        <path d="M30 40 L40 40 L40 60 L35 280 L65 280 L60 60 L60 40 L70 40 L70 60 L75 280 L25 280 L30 60 Z" fill="#333" />
        
        {/* Contenu de la bouteille (vin) */}
        <path d="M35 70 L65 70 L63 260 L37 260 Z" fill={colorStyle.glassColor} />
        
        {/* Étiquette de la bouteille */}
        {showLabel && (
          <>
            <rect x="32" y="140" width="36" height="60" fill="#F8F8F8" stroke="#DDD" />
            <text x="50" y="160" textAnchor="middle" fill="#333" fontSize="8" fontWeight="bold">
              {vintage || ''}
            </text>
            <text x="50" y="172" textAnchor="middle" fill="#333" fontSize="7">
              {name && name.length > 12 ? name.substring(0, 10) + '...' : name}
            </text>
            <text x="50" y="182" textAnchor="middle" fill="#333" fontSize="6">
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