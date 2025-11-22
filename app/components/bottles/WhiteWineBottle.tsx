import React from 'react';
import type { WineInfo } from './utils';
import BaseWineBottle from './BaseWineBottle';

const WhiteWineBottle = ({ wineInfo }: { wineInfo: WineInfo }) => {
  return (
    <BaseWineBottle
      wineInfo={wineInfo}
      accentColor="#2E5921"
      labelFill="#F5F5DC"
      labelBorder="#2E5921"
    >
      {/* Ombre de la bouteille */}
      <ellipse cx="100" cy="380" rx="35" ry="10" fill="rgba(0,0,0,0.1)" />

      {/* Corps de la bouteille */}
      <path d="M75 60 L75 340 C75 362 125 362 125 340 L125 60 L75 60" fill="#C9E2C3" />

      {/* Goulot de la bouteille */}
      <path d="M85 60 L85 40 C85 25 115 25 115 40 L115 60 L85 60" fill="#C9E2C3" />

      {/* Embouchure */}
      <rect x="85" y="25" width="30" height="15" rx="2" fill="#C9E2C3" />

      {/* Reflet sur la bouteille */}
      <path d="M80 80 L85 80 L85 320 L80 320 C77 300 77 100 80 80" fill="#E8F0E5" opacity="0.7" />

      {/* Petit sceau ou médaille */}
      <circle cx="100" cy="150" r="15" fill="#E6C32E" />
      <text x="100" y="153" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#1A1A1A" fontFamily="serif">
        GRAND CRU
      </text>
    </BaseWineBottle>
  );
};

export default WhiteWineBottle;
