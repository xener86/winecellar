// Utilitaire pour gérer les couleurs en fonction du mode d'affichage

// Type pour la température de service
export interface TemperatureInfo {
  range: string;
  label: string;
  color: string;
  textColor: string;
}

// Map des températures de service par type de vin
export const serviceTemperatures: Record<string, TemperatureInfo> = {
  red: {
    range: '16-18°C',
    label: 'Température ambiante',
    color: '#8B0000',
    textColor: '#FFFFFF'
  },
  white: {
    range: '8-10°C',
    label: 'Très frais',
    color: '#81D4FA',
    textColor: '#000000'
  },
  rose: {
    range: '10-12°C',
    label: 'Frais',
    color: '#F48FB1',
    textColor: '#000000'
  },
  sparkling: {
    range: '6-8°C',
    label: 'Très frais',
    color: '#90CAF9',
    textColor: '#000000'
  },
  fortified: {
    range: '14-16°C',
    label: 'Tempéré',
    color: '#A1887F',
    textColor: '#FFFFFF'
  }
};

// Map des couleurs d'étiquettes personnalisées
export const customLabelColors: Record<string, { color: string; textColor: string }> = {
  favorite: { color: '#FFD54F', textColor: '#000000' },
  special: { color: '#7986CB', textColor: '#FFFFFF' },
  keep: { color: '#81C784', textColor: '#000000' },
  aperitif: { color: '#FF8A65', textColor: '#000000' },
  ready: { color: '#4CAF50', textColor: '#FFFFFF' }
};

// Map des couleurs standard de vin
export const wineColors: Record<string, { color: string; textColor: string }> = {
  red: { color: '#8B0000', textColor: '#FFFFFF' },
  white: { color: '#F5F5DC', textColor: '#000000' },
  rose: { color: '#FFB6C1', textColor: '#000000' },
  sparkling: { color: '#B0C4DE', textColor: '#000000' },
  fortified: { color: '#8B4513', textColor: '#FFFFFF' }
};

// Traduire les clés de couleur en français
export const wineColorLabels: Record<string, string> = {
  red: 'Rouge',
  white: 'Blanc',
  rose: 'Rosé',
  sparkling: 'Effervescent',
  fortified: 'Fortifié'
};

/**
 * Obtient la couleur d'affichage selon le mode d'affichage actuel
 * @param wineColor Couleur du vin
 * @param bottleLabel Étiquette de la bouteille
 * @param displayMode Mode d'affichage (default, temperature, labels)
 * @returns Objet contenant la couleur et la couleur de texte
 */
export function getDisplayColor(
  wineColor: string | undefined | null,
  bottleLabel: string | undefined | null,
  displayMode: string
): { color: string; textColor: string } {
  // Valeurs par défaut
  let color = '#999999';
  let textColor = '#FFFFFF';

  if (!wineColor) {
    return { color, textColor };
  }

  // Mode d'affichage par couleur du vin (par défaut)
  if (displayMode === 'default') {
    const colorInfo = wineColors[wineColor];
    if (colorInfo) {
      color = colorInfo.color;
      textColor = colorInfo.textColor;
    }
  }
  // Mode d'affichage par température de service
  else if (displayMode === 'temperature') {
    const tempInfo = serviceTemperatures[wineColor];
    if (tempInfo) {
      color = tempInfo.color;
      textColor = tempInfo.textColor;
    }
  }
  // Mode d'affichage par étiquette personnalisée
  else if (displayMode === 'labels') {
    if (bottleLabel && customLabelColors[bottleLabel]) {
      const labelInfo = customLabelColors[bottleLabel];
      color = labelInfo.color;
      textColor = labelInfo.textColor;
    } else {
      // Si pas d'étiquette, on utilise une couleur grise
      color = '#E0E0E0';
      textColor = '#757575';
    }
  }

  return { color, textColor };
}