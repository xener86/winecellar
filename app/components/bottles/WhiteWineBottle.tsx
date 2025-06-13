import React from 'react';
import BaseWineBottle, { WineInfo, BottleColors } from './BaseWineBottle';

const colors: BottleColors = {
  body: '#C9E2C3',
  reflection: '#E8F0E5',
  accent: '#2E5921',
  seal: '#E6C32E',
  sealText: '#1A1A1A'
};

const WhiteWineBottle = ({ wineInfo }: { wineInfo: WineInfo }) => (
  <BaseWineBottle wineInfo={wineInfo} colors={colors} labelText="GRAND CRU" />
);

export default WhiteWineBottle;
