import React from 'react';

export interface WineInfo {
  name: string;
  vintage?: number;
  domain?: string;
  appellation?: string;
  region?: string;
  alcoholPercentage?: number;
}

export interface BottleColors {
  body: string;
  reflection: string;
  accent: string;
  seal: string;
  sealText: string;
}

interface BaseWineBottleProps {
  wineInfo: WineInfo;
  colors: BottleColors;
  labelText: string;
  extraDecorations?: React.ReactNode;
}

const BaseWineBottle = ({ wineInfo, colors, labelText, extraDecorations }: BaseWineBottleProps) => {
  const { name, vintage, domain, appellation, region, alcoholPercentage } = wineInfo;

  const formatDisplayName = () => {
    let displayName = name;
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
      {/* Ombre */}
      <ellipse cx="100" cy="380" rx="35" ry="10" fill="rgba(0,0,0,0.1)" />

      {/* Corps */}
      <path d="M75 60 L75 340 C75 362 125 362 125 340 L125 60 L75 60" fill={colors.body} />

      {/* Goulot */}
      <path d="M85 60 L85 40 C85 25 115 25 115 40 L115 60 L85 60" fill={colors.body} />

      {/* Embouchure */}
      <rect x="85" y="25" width="30" height="15" rx="2" fill={colors.body} />

      {/* Reflet */}
      <path d="M80 80 L85 80 L85 320 L80 320 C77 300 77 100 80 80" fill={colors.reflection} opacity="0.6" />

      {/* Étiquette principale */}
      <rect x="65" y="180" width="70" height="90" rx="3" fill="#F5F2E9" />

      {/* Bordure décorative */}
      <rect x="68" y="183" width="64" height="84" rx="2" stroke={colors.accent} strokeWidth="1" fill="none" />

      {/* Contenu de l'étiquette */}
      <text x="100" y="203" textAnchor="middle" fontSize="10" fontWeight="bold" fill={colors.accent} fontFamily="serif">
        {domain || appellation || ''}
      </text>
      <text x="100" y="225" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1A1A1A" fontFamily="serif">
        {formatDisplayName()}
      </text>
      {vintage && (
        <text x="100" y="245" textAnchor="middle" fontSize="12" fontWeight="bold" fill={colors.accent} fontFamily="serif">
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

      {/* Sceau ou médaille */}
      <circle cx="100" y="150" r="15" fill={colors.seal} />
      <text x="100" y="153" textAnchor="middle" fontSize="5" fontWeight="bold" fill={colors.sealText} fontFamily="serif">
        {labelText}
      </text>

      {extraDecorations}
    </svg>
  );
};

export default BaseWineBottle;
