// app/spirits/components/SpiritCard.tsx

import React, { useState } from 'react';
import { 
  Card, CardContent, CardMedia, Box, Typography, 
  Chip, IconButton, useTheme, alpha 
} from '@mui/material';
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import { Spirit, FillLevel } from '@/utils/types/spirit.types';

interface SpiritCardProps {
  spirit: Spirit;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const SpiritCard: React.FC<SpiritCardProps> = ({ 
  spirit, 
  onEdit, 
  onDelete,
  compact = false
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [isHovered, setIsHovered] = useState(false);

  // Fonction pour obtenir l'icône de niveau de remplissage
  const getFillLevelStyle = (level: FillLevel) => {
    const baseColor = spirit.type === 'whisky' 
      ? '#cd7f32' 
      : spirit.type === 'rum' 
      ? '#8b4513' 
      : spirit.type === 'tequila' 
      ? '#ffff00' 
      : spirit.type === 'gin' 
      ? '#add8e6' 
      : spirit.type === 'vodka' 
      ? '#f5f5f5' 
      : '#dddddd';
    
    const fillPercentage = level === 'full' 
      ? '100%' 
      : level === 'threeFourths' 
      ? '75%' 
      : level === 'half' 
      ? '50%' 
      : level === 'oneFourth' 
      ? '25%' 
      : '0%';
    
    return {
      height: fillPercentage,
      backgroundColor: baseColor,
      opacity: 0.8
    };
  };

  // Traduire le type de spiritueux en français
  const getSpiritTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'whisky': 'Whisky',
      'rum': 'Rhum',
      'gin': 'Gin',
      'vodka': 'Vodka',
      'tequila': 'Tequila',
      'brandy': 'Brandy',
      'liqueur': 'Liqueur',
      'other': 'Autre'
    };
    
    return typeMap[type] || 'Autre';
  };

  // Obtenir la couleur associée au type de spiritueux
  const getSpiritTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'whisky': '#cd7f32',
      'rum': '#8b4513',
      'gin': '#add8e6',
      'vodka': '#f5f5f5',
      'tequila': '#ffdb58',
      'brandy': '#964b00',
      'liqueur': '#ff69b4',
      'other': '#aaaaaa'
    };
    
    return colorMap[type] || '#aaaaaa';
  };

  // Pour les affichages compacts (listes, grilles, etc.)
  if (compact) {
    return (
      <Card 
        sx={{ 
          display: 'flex', 
          height: 100, 
          borderRadius: 2,
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Box 
          sx={{ 
            width: 30, 
            display: 'flex', 
            flexDirection: 'column-reverse',
            bgcolor: 'background.paper',
            borderRight: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ 
            ...getFillLevelStyle(spirit.storage.fillLevel),
            transition: 'height 0.3s ease'
          }} />
        </Box>
        
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: 70,
            alignItems: 'center',
            bgcolor: alpha(getSpiritTypeColor(spirit.type), isDarkMode ? 0.2 : 0.1)
          }}
        >
          <LocalBarIcon sx={{ color: getSpiritTypeColor(spirit.type), fontSize: 30 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {spirit.abv}%
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          flexGrow: 1, 
          p: 1.5
        }}>
          <Typography 
            variant="subtitle1" 
            component="div"
            sx={{ 
              fontWeight: 'medium',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2
            }}
          >
            {spirit.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Chip 
              label={getSpiritTypeLabel(spirit.type)} 
              size="small"
              sx={{ 
                height: 20,
                fontSize: '0.7rem',
                bgcolor: alpha(getSpiritTypeColor(spirit.type), isDarkMode ? 0.3 : 0.2),
                mr: 1
              }}
            />
            
            {spirit.age && (
              <Typography variant="caption" color="text.secondary">
                {spirit.age} ans
              </Typography>
            )}
          </Box>
          
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              mt: 'auto', 
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {spirit.origin.distillery || spirit.origin.region || spirit.origin.country}
          </Typography>
        </Box>
        
        {isHovered && (onEdit || onDelete) && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              right: 0,
              display: 'flex',
              p: 0.5,
              bgcolor: 'rgba(0,0,0,0.5)',
              borderRadius: '0 8px 0 8px'
            }}
          >
            {onEdit && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onEdit(spirit.id);
                }}
                sx={{ color: 'white', p: 0.5 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            
            {onDelete && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete(spirit.id);
                }}
                sx={{ color: 'white', p: 0.5 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        )}
      </Card>
    );
  }

  // Affichage standard (carte complète)
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        },
        position: 'relative'
      }}
      component={Link}
      href={`/spirits/details/${spirit.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box sx={{ position: 'relative' }}>
        {spirit.bottleImage ? (
          <CardMedia
            component="img"
            height="200"
            image={spirit.bottleImage}
            alt={spirit.name}
            sx={{ objectFit: 'contain', p: 2, bgcolor: '#f9f9f9' }}
          />
        ) : (
          <Box 
            sx={{ 
              height: 200, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              bgcolor: alpha(getSpiritTypeColor(spirit.type), isDarkMode ? 0.1 : 0.05),
              p: 2
            }}
          >
            <Box 
              sx={{ 
                height: 150,
                width: 60,
                borderRadius: '10px 10px 4px 4px',
                border: `1px solid ${theme.palette.divider}`,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column-reverse'
              }}
            >
              <Box 
                sx={{
                  ...getFillLevelStyle(spirit.storage.fillLevel),
                  width: '100%'
                }}
              />
            </Box>
          </Box>
        )}
        
        <Chip 
          label={`${spirit.abv}%`}
          size="small"
          sx={{ 
            position: 'absolute',
            top: 12,
            right: 12,
            fontWeight: 'bold',
            backgroundColor: alpha('#000000', 0.7),
            color: 'white'
          }}
        />
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography 
          variant="h6" 
          component="div"
          sx={{ 
            fontWeight: 'medium', 
            mb: 1,
            lineHeight: 1.2
          }}
        >
          {spirit.name}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          <Chip 
            label={getSpiritTypeLabel(spirit.type)} 
            size="small"
            sx={{ 
              bgcolor: alpha(getSpiritTypeColor(spirit.type), isDarkMode ? 0.3 : 0.2)
            }}
          />
          
          {spirit.age && (
            <Chip 
              label={`${spirit.age} ans`} 
              size="small" 
              variant="outlined" 
            />
          )}
          
          {spirit.subType && (
            <Chip 
              label={spirit.subType} 
              size="small" 
              variant="outlined" 
              sx={{ fontSize: '0.7rem' }} 
            />
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {spirit.origin.distillery && (
            <Box component="span" fontWeight="medium">
              {spirit.origin.distillery}
            </Box>
          )}
          
          {(spirit.origin.region || spirit.origin.country) && (
            <Box component="span">
              {spirit.origin.distillery && ', '}
              {spirit.origin.region ? `${spirit.origin.region}, ` : ''}
              {spirit.origin.country}
            </Box>
          )}
        </Typography>
        
        {spirit.details.tastingNotes && spirit.details.tastingNotes.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.8rem' }}>
            {spirit.details.tastingNotes.slice(0, 3).join(' • ')}
            {spirit.details.tastingNotes.length > 3 && ' ...'}
          </Typography>
        )}
      </CardContent>
      
      {isHovered && (onEdit || onDelete) && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            right: 0,
            display: 'flex',
            p: 0.5,
            bgcolor: 'rgba(0,0,0,0.5)',
            borderRadius: '0 8px 0 8px'
          }}
        >
          {onEdit && (
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEdit(spirit.id);
              }}
              sx={{ color: 'white', p: 0.5 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          
          {onDelete && (
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete(spirit.id);
              }}
              sx={{ color: 'white', p: 0.5 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}
    </Card>
  );
};

export default SpiritCard;