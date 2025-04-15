// app/storage/stock/components/CrateCard.tsx
import React from 'react';
import { 
  Box, Card, CardContent, Typography, IconButton, 
  Tooltip, useTheme 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import WineBarIcon from '@mui/icons-material/WineBar';

// --- AJOUT/MODIFICATION: Définition des types nécessaires ---
// Idéalement, importer depuis un fichier centralisé types.ts
type Wine = {
  id: string;
  name?: string | null; // Rendre optionnel car on ne l'utilise pas partout
  color?: string | null; // Rendre optionnel
  vintage?: number | null;
};

type Bottle = {
  id: string;
  wine_id: string; // Supposons qu'il y a toujours un wine_id
  wine?: Wine | null; // Le vin associé est optionnel
};

// Nouveau type pour la prop 'crate'
type CrateData = {
  id: string; // Supposons qu'une caisse a un ID
  name: string;
  capacity: number;
  bottles: Bottle[]; // Un tableau de bouteilles
};

// Props du composant mises à jour
type CrateCardProps = {
  crate: CrateData; // <-- Utilisation du type CrateData
  onSelect: (crateId: string) => void; // Préciser qu'on passe l'ID
  onDelete: (crateId: string) => void; // Préciser qu'on passe l'ID
  // onRefresh: () => void; // <-- Prop onRefresh supprimée car non utilisée
};
// --- FIN AJOUT/MODIFICATION TYPES ---

// Fonction pour obtenir la couleur de fond pour une bouteille de vin
const getWineColorCode = (color: string | null | undefined): string => {
  switch (color) {
    case 'red': return 'rgba(139, 0, 0, 0.9)';
    case 'white': return 'rgba(245, 245, 220, 0.9)';
    case 'rose': return 'rgba(255, 182, 193, 0.9)';
    case 'sparkling': return 'rgba(176, 196, 222, 0.9)';
    case 'fortified': return 'rgba(139, 69, 19, 0.9)';
    default: return 'rgba(120, 120, 120, 0.7)'; // Gris par défaut pour inconnu/null
  }
};

// Fonction pour obtenir la couleur du texte adaptée au fond
const getTextColorForBackground = (color: string | null | undefined): string => {
   switch (color) {
    case 'red':
    case 'fortified':
      return 'white';
    default:
      return 'black';
  }
};

// CORRECTION: Signature du composant mise à jour (onRefresh retiré)
const CrateCard: React.FC<CrateCardProps> = ({ crate, onSelect, onDelete }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Gestion du clic sur le bouton de suppression
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche le clic de se propager à la Card (qui déclenche onSelect)
    onDelete(crate.id); // Passe l'ID de la caisse à supprimer
  };
  
  // Gestion du clic sur le bouton d'ajout (ou autre action sur la caisse)
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche la propagation
    // Ici, on pourrait ouvrir un dialogue spécifique pour ajouter à CETTE caisse
    // Pour l'instant, on simule en sélectionnant la caisse (comportement précédent)
    onSelect(crate.id); 
  };

  // Gestion du clic sur la carte elle-même
  const handleCardClick = () => {
    onSelect(crate.id); // Sélectionne la caisse en passant son ID
  };
  
  return (
    <Card 
      onClick={handleCardClick} // Utiliser le gestionnaire dédié
      sx={{ 
        borderRadius: 2, 
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">{crate.name || "Caisse sans nom"}</Typography>
          <Box>
            {crate.bottles.length < crate.capacity && (
              <Tooltip title="Ajouter une bouteille">
                {/* Ce IconButton devrait probablement ouvrir un dialogue spécifique */}
                <IconButton 
                  size="small" 
                  onClick={handleAddClick} // Peut-être renommer ou changer l'action
                  sx={{ /* ... styles hover ... */ }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Supprimer cette caisse">
              <IconButton 
                size="small" 
                onClick={handleDeleteClick}
                sx={{ /* ... styles hover ... */ }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ /* ... styles ... */ }}
          >
            {/* S'assurer que capacity est un nombre */}
            {crate.bottles.length}/{typeof crate.capacity === 'number' ? crate.capacity : '?'} bouteilles
          </Typography>
        </Box>
        
        {/* Aperçu visuel des bouteilles */}
        <Box 
          sx={{ /* ... styles conteneur ... */ }}
        >
          {/* CORRECTION: Utiliser le type Bottle dans le map */}
          {crate.bottles.map((bottle: Bottle) => ( 
            <Tooltip 
              key={bottle.id} 
              title={`${bottle.wine?.name || 'Vin inconnu'} ${bottle.wine?.vintage || ''}`}
              arrow
            >
              <Box 
                sx={{ /* ... styles bouteille ... */ 
                  bgcolor: getWineColorCode(bottle.wine?.color), // Passe la couleur
                }}
              >
                <WineBarIcon 
                  sx={{ /* ... styles icone ... */
                    color: getTextColorForBackground(bottle.wine?.color),
                  }} 
                />
                
                {bottle.wine?.vintage && (
                  <Typography 
                    variant="caption" 
                    sx={{ /* ... styles millésime ... */
                      color: getTextColorForBackground(bottle.wine?.color),
                    }}
                  >
                    {bottle.wine.vintage}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          ))}
          
          {/* Emplacements vides */}
          {/* S'assurer que capacity est un nombre avant de créer le tableau */}
          {typeof crate.capacity === 'number' && Array.from({ length: Math.max(0, crate.capacity - crate.bottles.length) }).map((_, index) => (
            <Box 
              key={`empty-${index}`}
              sx={{ /* ... styles emplacement vide ... */ }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CrateCard;