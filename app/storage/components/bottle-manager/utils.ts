// app/storage/components/bottle-manager/utils.ts
import { WineColorInfo } from '@/utils/types';

/**
 * Renvoie les informations de couleur pour un vin donné
 */
export const getWineColorInfo = (color: string | null | undefined): WineColorInfo => {
  const colors: Record<string, WineColorInfo> = {
    'red': { label: 'Rouge', bgColor: 'rgba(139, 0, 0, 0.9)', textColor: '#fff' },
    'white': { label: 'Blanc', bgColor: 'rgba(245, 245, 220, 0.9)', textColor: '#000' },
    'rose': { label: 'Rosé', bgColor: 'rgba(255, 182, 193, 0.9)', textColor: '#000' },
    'sparkling': { label: 'Effervescent', bgColor: 'rgba(176, 196, 222, 0.9)', textColor: '#000' },
    'fortified': { label: 'Fortifié', bgColor: 'rgba(139, 69, 19, 0.9)', textColor: '#fff' }
  };
  
  return colors[color || ''] || { label: 'Inconnu', bgColor: '#607D8B', textColor: '#fff' };
};