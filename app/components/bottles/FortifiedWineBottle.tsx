import React from 'react';

type WineInfo = {
  name: string;
  vintage?: number;
  domain?: string;
  appellation?: string;
  region?: string;
  alcoholPercentage?: number;
};

const FortifiedWineBottle = ({ wineInfo }: { wineInfo: WineInfo }) => {
  const { name, vintage, domain, appellation, region, alcoholPercentage } = wineInfo;
  
  // Formater le nom principal de l'étiquette
  const formatDisplayName = () => {
    let displayName = name;
    
    // Si c'est un domaine suivi d'un nom, on inverse l'ordre pour l'étiquette
    if (domain && name.includes(domain)) {
      const remainingName = name.replace(domain, '').trim();
      if (remainingName) {
        displayName = remainingName;
      }
    }
    
    return displayName;
  };

  return (
    <svg width="100%" height="100%" viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ombre de la bouteille */}
      <ellipse cx="100" cy="380" rx="35" ry="10" fill="rgba(0,0,0,0.1)" />
      
      {/* Corps de la bouteille - forme plus courte, typique du porto */}
      <path d="M70 90 L70 340 C70 362 130 362 130 340 L130 90 L70 90" fill="#3B1D0F" />
      
      {/* Épaules de la bouteille */}
      <path d="M70 90 C70 75 130 75 130 90" fill="#3B1D0F" />
      
      {/* Goulot de la bouteille */}
      <path d="M87 75 L87 45 C87 35 113 35 113 45 L113 75" fill="#3B1D0F" />
      
      {/* Cachet de cire traditionnelle */}
      <path d="M85 45 C85 35 115 35 115 45 C115 55 85 55 85 45" fill="#8B0000" />
      
      {/* Reflet sur la bouteille */}
      <path d="M75 110 L85 110 L85 320 L75 320 C72 300 72 130 75 110" fill="#5F3A24" opacity="0.6" />
      
      {/* Étiquette principale - style classique, souvent ovale pour le porto */}
      <rect x="65" y="170" width="70" height="100" rx="35" fill="#F0EBD8" />
      
      {/* Bordure décorative de l'étiquette */}
      <rect x="68" y="173" width="64" height="94" rx="32" stroke="#532915" strokeWidth="1" fill="none" />
      
      {/* Motifs décoratifs - typiques des vins fortifiés */}
      <path d="M75 185 C80 180 120 180 125 185" stroke="#532915" strokeWidth="0.5" fill="none" />
      <path d="M75 255 C80 260 120 260 125 255" stroke="#532915" strokeWidth="0.5" fill="none" />
      
      {/* Contenu de l'étiquette */}
      <text x="100" y="203" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#532915" fontFamily="serif">
        {domain || appellation || ""}
      </text>
      
      <text x="100" y="225" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1A1A1A" fontFamily="serif">
        {formatDisplayName()}
      </text>
      
      {vintage && (
        <text x="100" y="245" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#8B0000" fontFamily="serif">
          {vintage}
        </text>
      )}
      
      {appellation && !domain && (
        <text x="100" y="260" textAnchor="middle" fontSize="8" fontWeight="normal" fill="#666" fontFamily="serif">
          {appellation}
        </text>
      )}
      
      {region && (
        <text x="100" y="270" textAnchor="middle" fontSize="7" fill="#666" fontFamily="sans-serif">
          {region}
        </text>
      )}
      
      {/* Pourcentage d'alcool - généralement plus élevé pour les vins fortifiés */}
      <text x="100" y="235" textAnchor="middle" fontSize="8" fill="#1A1A1A" fontFamily="sans-serif">
        {alcoholPercentage || "20"}% vol.
      </text>
      
      {/* Petit sceau ou blason */}
      <path d="M90 150 L100 140 L110 150 L110 165 L100 175 L90 165 Z" fill="#8B0000" />
      <text x="100" y="160" textAnchor="middle" fontSize="5" fontWeight="bold" fill="white" fontFamily="serif">
        PORTO
      </text>
    </svg>
  );
};

export default FortifiedWineBottle;