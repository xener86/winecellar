// app/components/WineCard.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import est déjà là, c'est bien.
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
  imageUrl?: string | null;
};

export default function WineCard({ 
  id, 
  name, 
  color, 
  vintage, 
  domain, 
  region, 
  appellation, 
  price, 
  imageUrl 
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
  // Utiliser HTTPS pour le placeholder
  const placeholderImage = 'https://via.placeholder.com/300x450?text=Vin';

  return (
    <Link href={`/wines/${id}`} className="block group">
      {/* Card container */}
      <div className="wine-card h-full flex flex-col border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        {/* Image Section */}
        <div className="relative"> {/* Ajout de 'relative' ici pour que 'fill' fonctionne */}
          {/* Container qui définit la taille/ratio de l'image */}
          <div className="relative aspect-[2/3] w-full bg-gray-100 overflow-hidden flex items-center justify-center"> {/* Ajout de 'relative' ici aussi */}
            <Image
              src={imageUrl || placeholderImage}
              alt={name || 'Image de vin'}
              fill // <-- Correction: Utiliser fill pour remplir le parent
              style={{ objectFit: 'contain' }} // <-- Correction: Utiliser style pour objectFit
              className="group-hover:scale-105 transition-transform duration-500 ease-in-out" // Garder les transitions
              // Optionnel: Ajoutez 'sizes' pour optimiser davantage le chargement pour différentes tailles d'écran
              // sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 33vw" 
            />
          </div>
          
          {/* Overlay (inchangé) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Badge de couleur (inchangé) */}
          <div className="absolute top-3 right-3 z-10"> {/* Ajout de z-index pour être sûr qu'il est au-dessus */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorStyles.bgClass} ${colorStyles.textClass}`}>
              {colorStyles.label}
            </span>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-4 flex-grow flex flex-col bg-white"> {/* Ajout de flex flex-col */}
          {/* Nom et Millésime/Prix */}
          <div className="flex justify-between items-start mb-2">
             <h3 className="font-serif font-bold text-base md:text-lg text-gray-800 group-hover:text-wine-burgundy transition-colors duration-200 line-clamp-2 mr-2 flex-1">
               {name || "Nom Indisponible"}
             </h3>
             {/* Afficher millésime ou prix si dispo */}
             <div className='flex-shrink-0'>
               {vintage && (
                 <span className="text-sm font-semibold text-gray-700 ml-auto">
                   {vintage}
                 </span>
               )}
                {price && !vintage && ( // Afficher prix seulement si pas de millésime ? À adapter.
                   <div className="flex items-center text-sm font-semibold text-gray-700 ml-auto">
                     <LocalOfferIcon fontSize="inherit" className="mr-1 text-gray-400" />
                     {price.toFixed(2)} € 
                   </div>
                 )}
             </div>
           </div>
           
           {/* Domaine */}
           {domain && (
             <p className="text-sm text-gray-600 mt-1 truncate flex-shrink-0">
               {domain}
             </p>
           )}
           
           {/* Espace pour pousser le reste en bas */}
           <div className="flex-grow"></div> 

           {/* Appellation / Région */}
           <div className="mt-3 pt-3 border-t border-gray-100 flex-shrink-0">
             {appellation && (
               <p className="text-xs text-gray-500 truncate">
                 {appellation}
               </p>
             )}
             {region && (
               <p className="text-xs flex items-center mt-1 text-gray-400">
                 <PlaceIcon fontSize="inherit" className="mr-1" />
                 {region}
               </p>
             )}
             {/* Afficher le prix ici s'il n'est pas affiché en haut */}
             {price && vintage && ( 
                 <div className="flex items-center text-sm text-gray-700 mt-2">
                   <LocalOfferIcon fontSize="inherit" className="mr-1 text-gray-400" />
                   {price.toFixed(2)} € 
                 </div>
               )}
          </div>
        </div>
      </div>
    </Link>
  );
}