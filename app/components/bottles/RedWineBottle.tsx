import React from 'react';
import BaseWineBottle, { WineInfo, BottleColors } from './BaseWineBottle';

const colors: BottleColors = {
  body: '#0D0F06',
  reflection: '#2A2D1C',
  accent: '#8B0000',
  seal: '#8B0000',
  sealText: 'white'
};

const RedWineBottle = ({ wineInfo }: { wineInfo: WineInfo }) => (
  <BaseWineBottle wineInfo={wineInfo} colors={colors} labelText="GRAND VIN" />
);

export default RedWineBottle;
