import React from 'react';
import BaseWineBottle, { WineInfo, BottleColors } from './BaseWineBottle';

const colors: BottleColors = {
  body: '#3C5A14',
  reflection: '#6A863D',
  accent: '#D4AF37',
  seal: '#D4AF37',
  sealText: '#1A1A1A'
};

const extras = (
  <>
    <path d="M90 45 L95 25 L105 25 L110 45" fill="none" stroke={colors.accent} strokeWidth="1" />
    <rect x="90" y="29" width="20" height="6" rx="2" fill={colors.accent} />
    <circle cx="85" cy="130" r="1.5" fill={colors.accent} />
    <circle cx="90" cy="150" r="1" fill={colors.accent} />
    <circle cx="80" cy="170" r="1.5" fill={colors.accent} />
    <circle cx="115" cy="140" r="1" fill={colors.accent} />
    <circle cx="120" cy="160" r="1.5" fill={colors.accent} />
    <circle cx="110" cy="120" r="1" fill={colors.accent} />
  </>
);

const SparklingWineBottle = ({ wineInfo }: { wineInfo: WineInfo }) => (
  <BaseWineBottle wineInfo={wineInfo} colors={colors} labelText="BRUT" extraDecorations={extras} />
);

export default SparklingWineBottle;
