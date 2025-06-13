import React from 'react';
import BaseWineBottle, { WineInfo, BottleColors } from './BaseWineBottle';

const colors: BottleColors = {
  body: '#3B1D0F',
  reflection: '#5F3A24',
  accent: '#532915',
  seal: '#8B0000',
  sealText: 'white'
};

const extras = (
  <>
    <path d="M85 45 C85 35 115 35 115 45 C115 55 85 55 85 45" fill={colors.seal} />
    <path d="M75 185 C80 180 120 180 125 185" stroke={colors.accent} strokeWidth="0.5" fill="none" />
    <path d="M75 255 C80 260 120 260 125 255" stroke={colors.accent} strokeWidth="0.5" fill="none" />
    <path d="M90 150 L100 140 L110 150 L110 165 L100 175 L90 165 Z" fill={colors.seal} />
  </>
);

const FortifiedWineBottle = ({ wineInfo }: { wineInfo: WineInfo }) => (
  <BaseWineBottle wineInfo={wineInfo} colors={colors} labelText="PORTO" extraDecorations={extras} />
);

export default FortifiedWineBottle;
