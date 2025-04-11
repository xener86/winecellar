'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeWrapperProps {
  value: string;
  size: number;
  level: string;
}

export default function QRCodeWrapper({ value, size, level }: QRCodeWrapperProps) {
  return (
    <QRCodeSVG 
      value={value}
      size={size}
      level={level as "L" | "M" | "Q" | "H"}
    />
  );
}