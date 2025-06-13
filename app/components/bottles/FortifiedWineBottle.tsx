import React from 'react';
import type { WineInfo } from './utils';
import BaseWineBottle from './BaseWineBottle';

const FortifiedWineBottle = ({ wineInfo }: { wineInfo: WineInfo }) => {
  return (
    <BaseWineBottle
      wineInfo={wineInfo}
      accentColor="#532915"
      labelFill="#F0EBD8"
      labelBorder="#532915"
      labelRadius={35}
      alcoholY={235}
    >
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

      {/* Motifs décoratifs - typiques des vins fortifiés */}
      <path d="M75 185 C80 180 120 180 125 185" stroke="#532915" strokeWidth="0.5" fill="none" />
      <path d="M75 255 C80 260 120 260 125 255" stroke="#532915" strokeWidth="0.5" fill="none" />

      {/* Petit sceau ou blason */}
      <path d="M90 150 L100 140 L110 150 L110 165 L100 175 L90 165 Z" fill="#8B0000" />
      <text x="100" y="160" textAnchor="middle" fontSize="5" fontWeight="bold" fill="white" fontFamily="serif">
        PORTO
      </text>
    </BaseWineBottle>
  );
};

export default FortifiedWineBottle;
