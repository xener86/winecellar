import React from 'react';
import type { WineInfo } from './utils';
import { formatDisplayName } from './utils';

interface BaseWineBottleProps {
  wineInfo: WineInfo;
  accentColor: string;
  labelFill: string;
  labelBorder: string;
  labelRadius?: number;
  alcoholY?: number;
  children?: React.ReactNode;
}

const BaseWineBottle: React.FC<BaseWineBottleProps> = ({
  wineInfo,
  accentColor,
  labelFill,
  labelBorder,
  labelRadius = 3,
  alcoholY = 255,
  children
}) => {
  const { name, vintage, domain, appellation, region, alcoholPercentage } = wineInfo;

  return (
    <svg width="100%" height="100%" viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      {children}

      {/* Étiquette principale */}
      <rect x="65" y="180" width="70" height="90" rx={labelRadius} fill={labelFill} />

      {/* Bordure décorative de l'étiquette */}
      <rect x="68" y="183" width="64" height="84" rx={labelRadius - 1} stroke={labelBorder} strokeWidth="1" fill="none" />

      {/* Contenu de l'étiquette */}
      <text x="100" y="203" textAnchor="middle" fontSize="10" fontWeight="bold" fill={accentColor} fontFamily="serif">
        {domain || appellation || ''}
      </text>

      <text x="100" y="225" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1A1A1A" fontFamily="serif">
        {formatDisplayName(name, domain)}
      </text>

      {vintage && (
        <text x="100" y="245" textAnchor="middle" fontSize="12" fontWeight="bold" fill={accentColor} fontFamily="serif">
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

      {alcoholPercentage && (
        <text x="100" y={alcoholY} textAnchor="middle" fontSize="8" fill="#1A1A1A" fontFamily="sans-serif">
          {alcoholPercentage}% vol.
        </text>
      )}
    </svg>
  );
};

export default BaseWineBottle;
