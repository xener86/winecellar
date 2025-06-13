import React from 'react';
import type { WineInfo } from './utils';
import BaseWineBottle from './BaseWineBottle';

const SparklingWineBottle = ({ wineInfo }: { wineInfo: WineInfo }) => {
  return (
    <BaseWineBottle
      wineInfo={wineInfo}
      accentColor="#D4AF37"
      labelFill="#F9F8F0"
      labelBorder="#D4AF37"
    >
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

      {/* Petites bulles pour représenter l'effervescence */}
      <circle cx="85" cy="130" r="1.5" fill="#D4AF37" />
      <circle cx="90" cy="150" r="1" fill="#D4AF37" />
      <circle cx="80" cy="170" r="1.5" fill="#D4AF37" />
      <circle cx="115" cy="140" r="1" fill="#D4AF37" />
      <circle cx="120" cy="160" r="1.5" fill="#D4AF37" />
      <circle cx="110" cy="120" r="1" fill="#D4AF37" />

      {/* Sceau doré */}
      <circle cx="100" cy="150" r="15" fill="#D4AF37" />
      <text x="100" y="153" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#1A1A1A" fontFamily="serif">
        BRUT
      </text>
    </BaseWineBottle>
  );
};

export default SparklingWineBottle;
