/* eslint-disable @typescript-eslint/no-unused-vars */
// app/components/WineCard.tsx
import React from 'react';
import Link from 'next/link';
import AutoWineLabel from './AutoWineLabel';
import { Chip } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PlaceIcon from '@mui/icons-material/Place';

type WineCardProps = {
  id: string;
  name: string;
  color: string;
  vintage?: number | null;
  domain?: string | null;
  region?: string | null;
  appellation?: string | null;
  price?: number | null;
};

export default function WineCard({ 
  id,
  name,
  color,
  vintage,
  domain,
  region,
  appellation,
  price
}: WineCardProps) {
  
  // Fonction pour obtenir les styles de couleur de vin
  const getColorStyles = (color: string) => {
    const colors: Record<string, { label: string, bgClass: string, textClass: string }> = {
      red: { label: 'Rouge', bgClass: 'bg-wine-red', textClass: 'text-white' },
      white: { label: 'Blanc', bgClass: 'bg-wine-white', textClass: 'text-gray-800' },
      rose: { label: 'Rosé', bgClass: 'bg-wine-rose', textClass: 'text-gray-800' },
      sparkling: { label: 'Effervescent', bgClass: 'bg-blue-200', textClass: 'text-gray-800' },
      fortified: { label: 'Fortifié', bgClass: 'bg-amber-800', textClass: 'text-white' },
    };

    return colors[color] || { label: color, bgClass: 'bg-gray-500', textClass: 'text-white' };
  };

  const colorStyles = getColorStyles(color);

  return (
    <Link href={`/wines/${id}`} className="block group">
      <div className="wine-card h-full flex flex-col">
        <div className="relative">
          {/* Affichage de l'étiquette automatique */}
          <div className="aspect-[2/3] w-full bg-gray-100 overflow-hidden flex items-center justify-center">
            <AutoWineLabel
              name={name}
              vintage={vintage ?? undefined}
              region={region ?? undefined}
              color={color}
            />
          </div>
          
          {/* Overlay pour effet hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Badge de couleur */}
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorStyles.bgClass} ${colorStyles.textClass}`}>
              {colorStyles.label}
            </span>
          </div>
        </div>
        
        <div className="p-4 flex-grow bg-white">
          <div className="flex justify-between items-start">
            <h3 className="font-serif font-bold text-lg text-gray-800 group-hover:text-wine-burgundy transition-colors duration-200 line-clamp-2">
              {name}
            </h3>
          </div>
          
          <div className="flex flex-col space-y-1 mt-2">
            {vintage && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">
                  {vintage}
                </span>
              </div>
            )}
            
            {price && (
              <div className="flex items-center text-sm text-gray-600">
                <LocalOfferIcon fontSize="small" className="mr-1 text-gray-400" style={{ fontSize: '0.875rem' }} />
                {price} €
              </div>
            )}
            
            {domain && (
              <p className="text-sm text-gray-600 mt-1 truncate">
                {domain}
              </p>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100">
            {appellation && (
              <p className="text-xs text-gray-500 truncate">
                {appellation}
              </p>
            )}
            
            {region && (
              <p className="text-xs flex items-center mt-1 text-gray-400">
                <PlaceIcon fontSize="small" className="mr-1" style={{ fontSize: '0.875rem' }} />
                {region}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}