'use client';

import React, { useState, useRef } from 'react';
import { Box, TextField, Button, Card, CardContent, Typography, MenuItem } from '@mui/material';
import { Download, Palette } from 'lucide-react';

interface ColorScheme {
  name: string;
  primary: string;
  secondary: string;
  text: string;
}

const colorSchemes: ColorScheme[] = [
  { name: 'Classique', primary: '#8B0000', secondary: '#F5F2E9', text: '#1A1A1A' },
  { name: 'Or', primary: '#D4AF37', secondary: '#FFFFFF', text: '#1A1A1A' },
  { name: 'Sombre', primary: '#5E2129', secondary: '#F5F5F5', text: '#FFFFFF' }
];

export default function WineLabelGenerator() {
  const [name, setName] = useState('');
  const [vintage, setVintage] = useState('');
  const [region, setRegion] = useState('');
  const [scheme, setScheme] = useState<ColorScheme>(colorSchemes[0]);

  const svgRef = useRef<SVGSVGElement>(null);

  const downloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name || 'label'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box className="space-y-6" sx={{ maxWidth: 400, mx: 'auto' }}>
      <Card>
        <CardContent className="space-y-4">
          <Typography variant="h6" component="h2" className="font-serif">
            Générateur d&apos;étiquettes
          </Typography>
          <TextField label="Nom du vin" value={name} onChange={e => setName(e.target.value)} fullWidth />
          <TextField label="Millésime" value={vintage} onChange={e => setVintage(e.target.value)} fullWidth />
          <TextField label="Région" value={region} onChange={e => setRegion(e.target.value)} fullWidth />
          <TextField
            select
            label="Couleurs"
            value={scheme.name}
            onChange={e => {
              const found = colorSchemes.find(cs => cs.name === e.target.value);
              setScheme(found || colorSchemes[0]);
            }}
            fullWidth
            InputProps={{ startAdornment: <Palette className="mr-2 h-4 w-4" /> }}
          >
            {colorSchemes.map(cs => (
              <MenuItem key={cs.name} value={cs.name}>
                {cs.name}
              </MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      <Box className="flex justify-center">
        <svg ref={svgRef} width="200" height="250" xmlns="http://www.w3.org/2000/svg">
          <rect
            width="100%"
            height="100%"
            rx="12"
            fill={scheme.secondary}
            stroke={scheme.primary}
            strokeWidth="4"
          />
          <text
            x="50%"
            y="80"
            textAnchor="middle"
            fontSize="18"
            fontFamily="serif"
            fontWeight="bold"
            fill={scheme.primary}
          >
            {name}
          </text>
          {vintage && (
            <text
              x="50%"
              y="120"
              textAnchor="middle"
              fontSize="14"
              fontFamily="serif"
              fill={scheme.text}
            >
              {vintage}
            </text>
          )}
          {region && (
            <text
              x="50%"
              y="150"
              textAnchor="middle"
              fontSize="12"
              fontFamily="sans-serif"
              fill={scheme.text}
            >
              {region}
            </text>
          )}
        </svg>
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={downloadSvg}
        startIcon={<Download className="h-4 w-4" />}
        fullWidth
      >
        Télécharger
      </Button>
    </Box>
  );
}

