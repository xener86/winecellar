import React from 'react';
import BaseWineBottle, { WineInfo, BottleColors } from './BaseWineBottle';

const colors: BottleColors = {
  body: '#FFCBC8',
  reflection: '#FFE0DE',
  accent: '#E75A7C',
  seal: '#E75A7C',
  sealText: 'white'
};

const RoseWineBottle = ({ wineInfo }: { wineInfo: WineInfo }) => (
  <BaseWineBottle wineInfo={wineInfo} colors={colors} labelText="ROSÉ" />
);

export default RoseWineBottle;
