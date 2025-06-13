import React from 'react';

interface AutoWineLabelProps {
  name: string;
  vintage?: string | number;
  region?: string;
  color: string;
}

const colorSchemes: Record<string, { primary: string; secondary: string; text: string }> = {
  red: { primary: '#8B0000', secondary: '#F5F2E9', text: '#1A1A1A' },
  white: { primary: '#D4AF37', secondary: '#FFFFFF', text: '#1A1A1A' },
  rose: { primary: '#C48A81', secondary: '#FFF5F5', text: '#1A1A1A' },
  sparkling: { primary: '#FFD700', secondary: '#FFFFFF', text: '#1A1A1A' },
  fortified: { primary: '#5E2129', secondary: '#F5F5F5', text: '#FFFFFF' },
};

export default function AutoWineLabel({ name, vintage, region, color }: AutoWineLabelProps) {
  const scheme = colorSchemes[color] || colorSchemes.red;

  return (
    <svg width="200" height="250" xmlns="http://www.w3.org/2000/svg">
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
  );
}
