import React from 'react';

type WineInfo = {
  name: string;
  vintage?: number;
  domain?: string;
  appellation?: string;
  region?: string;
  alcoholPercentage?: number;
};

const SparklingWineBottle = ({ wineInfo }: { wineInfo: WineInfo }) => {
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
      
      {/* Corps de la bouteille - forme plus trapue, typique du champagne */}
      <path d="M75 80 L75 340 C75 362 125 362 125 340 L125 80 L75 80" fill="#3C5A14" />
      
      {/* Goulot de la bouteille */}
      <path d="M85 80 L85 60 C85 45 115 45 115 60 L115 80 L85 80" fill="#3C5A14" />
      
      {/* Embouchure évasée */}
      <path d="M82 60 C82 40 118 40 118 60 L115 45 L105 30 L95 30 L85 45 L82 60" fill="#3C5A14" />
      
      {/* Muselet (cage métallique) */}
      <path d="M90 45 L95 25 L105 25 L110 45" fill="none" stroke="#D4AF37" strokeWidth="1" />
      <rect x="90" y="29" width="20" height="6" rx="2" fill="#D4AF37" />
      
      {/* Reflet sur la bouteille */}
      <path d="M80 100 L85 100 L85 320 L80 320 C77 300 77 120 80 100" fill="#6A863D" opacity="0.7" />
      
      {/* Étiquette principale */}
      <rect x="65" y="180" width="70" height="90" rx="3" fill="#F9F8F0" />
      
      {/* Bordure décorative de l'étiquette dorée */}
      <rect x="68" y="183" width="64" height="84" rx="2" stroke="#D4AF37" strokeWidth="2" fill="none" />
      
      {/* Contenu de l'étiquette */}
      <text x="100" y="203" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#D4AF37" fontFamily="serif">
        {domain || appellation || "CHAMPAGNE"}
      </text>
      
      <text x="100" y="225" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1A1A1A" fontFamily="serif">
        {formatDisplayName()}
      </text>
      
      {vintage && (
        <text x="100" y="245" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#D4AF37" fontFamily="serif">
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
      
      {/* Pourcentage d'alcool */}
      {alcoholPercentage && (
        <text x="100" y="255" textAnchor="middle" fontSize="8" fill="#1A1A1A" fontFamily="sans-serif">
          {alcoholPercentage}% vol.
        </text>
      )}
      
      {/* Petites bulles pour représenter l'effervescence */}
      <circle cx="85" cy="130" r="1.5" fill="#D4AF37" />
      <circle cx="90" cy="150" r="1" fill="#D4AF37" />
      <circle cx="80" cy="170" r="1.5" fill="#D4AF37" />
      <circle cx="115" cy="140" r="1" fill="#D4AF37" />
      <circle cx="120" cy="160" r="1.5" fill="#D4AF37" />
      <circle cx="110" cy="120" r="1" fill="#D4AF37" />
      
      {/* Sceau doré */}
      <circle cx="100" y="150" r="15" fill="#D4AF37" />
      <text x="100" y="153" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#1A1A1A" fontFamily="serif">
        BRUT
      </text>
    </svg>
  );
};

export default SparklingWineBottle;