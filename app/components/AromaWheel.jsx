'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Paper, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FruitIcon from '@mui/icons-material/Spa';
import FlowerIcon from '@mui/icons-material/LocalFlorist';
import SpiceIcon from '@mui/icons-material/Grain';
import WoodIcon from '@mui/icons-material/Forest';
import AnimalIcon from '@mui/icons-material/Pets';
import EarthIcon from '@mui/icons-material/Terrain';
import MineralIcon from '@mui/icons-material/Opacity';
import OtherIcon from '@mui/icons-material/FilterVintage';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTheme } from '@mui/material/styles';

// Structure hiérarchique de la roue des arômes
const aromaWheel = {
  red: {
    fruit: {
      label: "Fruité",
      icon: <FruitIcon />,
      color: "#e91e63",
      categories: {
        red_fruits: {
          label: "Fruits rouges",
          aromas: ["Fraise", "Framboise", "Cerise", "Groseille", "Canneberge"]
        },
        black_fruits: {
          label: "Fruits noirs",
          aromas: ["Mûre", "Cassis", "Myrtille", "Sureau"]
        },
        dried_fruits: {
          label: "Fruits séchés",
          aromas: ["Pruneau", "Figue", "Raisin sec", "Datte"]
        },
        cooked_fruits: {
          label: "Fruits cuits",
          aromas: ["Confiture", "Compote", "Fruits au sirop"]
        }
      }
    },
    floral: {
      label: "Floral",
      icon: <FlowerIcon />,
      color: "#9c27b0",
      categories: {
        flowers: {
          label: "Fleurs",
          aromas: ["Violette", "Rose", "Pivoine", "Lavande", "Jasmin", "Lilas"]
        }
      }
    },
    spice: {
      label: "Épicé",
      icon: <SpiceIcon />,
      color: "#ff5722",
      categories: {
        spices: {
          label: "Épices",
          aromas: ["Poivre", "Cannelle", "Clou de girofle", "Muscade", "Réglisse", "Anis"]
        },
        herbs: {
          label: "Herbes",
          aromas: ["Thym", "Romarin", "Menthe", "Laurier", "Sauge"]
        }
      }
    },
    woody: {
      label: "Boisé",
      icon: <WoodIcon />,
      color: "#795548",
      categories: {
        wood: {
          label: "Bois",
          aromas: ["Chêne", "Cèdre", "Santal", "Pin", "Vanille", "Fumé", "Toasté", "Tabac"]
        }
      }
    },
    animal: {
      label: "Animal",
      icon: <AnimalIcon />,
      color: "#8d6e63",
      categories: {
        leather: {
          label: "Cuir & fourrure",
          aromas: ["Cuir", "Musc", "Fourrure", "Gibier", "Viande"]
        }
      }
    },
    vegetal: {
      label: "Végétal",
      icon: <EarthIcon />,
      color: "#4caf50",
      categories: {
        fresh: {
          label: "Frais",
          aromas: ["Poivron", "Herbe fraîche", "Feuille de tomate", "Eucalyptus"]
        },
        dry: {
          label: "Sec",
          aromas: ["Foin", "Feuille morte", "Sous-bois", "Truffe", "Champignon", "Humus"]
        }
      }
    },
    mineral: {
      label: "Minéral",
      icon: <MineralIcon />,
      color: "#607d8b",
      categories: {
        minerals: {
          label: "Minéraux",
          aromas: ["Pierre à fusil", "Graphite", "Craie", "Ardoise", "Mine de crayon"]
        }
      }
    }
  },
  white: {
    fruit: {
      label: "Fruité",
      icon: <FruitIcon />,
      color: "#e91e63",
      categories: {
        citrus: {
          label: "Agrumes",
          aromas: ["Citron", "Pamplemousse", "Orange", "Mandarine", "Lime", "Kumquat"]
        },
        orchard_fruits: {
          label: "Fruits à pépins",
          aromas: ["Pomme", "Poire", "Coing", "Pomme verte"]
        },
        stone_fruits: {
          label: "Fruits à noyau",
          aromas: ["Pêche", "Abricot", "Nectarine"]
        },
        tropical_fruits: {
          label: "Fruits exotiques",
          aromas: ["Ananas", "Mangue", "Litchi", "Fruit de la passion", "Banane"]
        }
      }
    },
    floral: {
      label: "Floral",
      icon: <FlowerIcon />,
      color: "#9c27b0",
      categories: {
        white_flowers: {
          label: "Fleurs blanches",
          aromas: ["Acacia", "Chèvrefeuille", "Fleur d'oranger", "Aubépine", "Jasmin", "Tilleul"]
        }
      }
    },
    sweet: {
      label: "Doux",
      icon: <OtherIcon />,
      color: "#ffc107",
      categories: {
        honey: {
          label: "Miellé",
          aromas: ["Miel", "Cire d'abeille", "Caramel", "Brioche", "Confiserie"]
        }
      }
    },
    spice: {
      label: "Épicé",
      icon: <SpiceIcon />,
      color: "#ff5722",
      categories: {
        light_spices: {
          label: "Épices douces",
          aromas: ["Vanille", "Safran", "Gingembre", "Anis", "Fenouil"]
        }
      }
    },
    woody: {
      label: "Boisé",
      icon: <WoodIcon />,
      color: "#795548",
      categories: {
        nuts: {
          label: "Fruits secs",
          aromas: ["Amande", "Noisette", "Noix"]
        },
        bakery: {
          label: "Boulangerie",
          aromas: ["Beurre", "Brioche", "Pain grillé", "Biscuit", "Viennoiserie"]
        }
      }
    },
    vegetal: {
      label: "Végétal",
      icon: <EarthIcon />,
      color: "#4caf50",
      categories: {
        fresh_herbs: {
          label: "Herbes fraîches",
          aromas: ["Herbe coupée", "Fougère", "Buis", "Asperge"]
        }
      }
    },
    mineral: {
      label: "Minéral",
      icon: <MineralIcon />,
      color: "#607d8b",
      categories: {
        white_minerals: {
          label: "Minéraux",
          aromas: ["Silex", "Pierre à fusil", "Craie", "Iode", "Pétrole", "Minéral"]
        }
      }
    }
  },
  rose: {
    fruit: {
      label: "Fruité",
      icon: <FruitIcon />,
      color: "#e91e63",
      categories: {
        red_berries: {
          label: "Fruits rouges",
          aromas: ["Fraise", "Framboise", "Groseille", "Cerise"]
        },
        citrus: {
          label: "Agrumes",
          aromas: ["Pamplemousse", "Orange sanguine"]
        },
        stone_fruits: {
          label: "Fruits à noyau",
          aromas: ["Pêche", "Abricot"]
        }
      }
    },
    floral: {
      label: "Floral",
      icon: <FlowerIcon />,
      color: "#9c27b0",
      categories: {
        rose_flowers: {
          label: "Fleurs",
          aromas: ["Rose", "Pivoine", "Fleur d'oranger"]
        }
      }
    },
    other: {
      label: "Autre",
      icon: <OtherIcon />,
      color: "#ff9800",
      categories: {
        candy: {
          label: "Bonbon & épices",
          aromas: ["Bonbon anglais", "Poivre blanc", "Réglisse", "Grenadine"]
        }
      }
    }
  },
  orange: {
    fruit: {
      label: "Fruité",
      icon: <FruitIcon />,
      color: "#e91e63",
      categories: {
        citrus: {
          label: "Agrumes",
          aromas: ["Orange", "Mandarine", "Kumquat"]
        },
        dried_fruits: {
          label: "Fruits séchés",
          aromas: ["Abricot sec", "Coing", "Pomme séchée"]
        }
      }
    },
    oxidative: {
      label: "Oxydatif",
      icon: <OtherIcon />,
      color: "#ff9800",
      categories: {
        oxidation: {
          label: "Oxydation",
          aromas: ["Oxydatif", "Écorce d'agrumes", "Noix", "Amande"]
        }
      }
    },
    spice: {
      label: "Épicé",
      icon: <SpiceIcon />,
      color: "#ff5722",
      categories: {
        warm_spices: {
          label: "Épices chaudes",
          aromas: ["Safran", "Curry", "Curcuma", "Gingembre"]
        }
      }
    },
    herbal: {
      label: "Herbacé",
      icon: <FlowerIcon />,
      color: "#9c27b0",
      categories: {
        tea_herbs: {
          label: "Thé & herbes",
          aromas: ["Thé", "Camomille", "Fleur de sureau"]
        }
      }
    }
  },
  sparkling: {
    fruit: {
      label: "Fruité",
      icon: <FruitIcon />,
      color: "#e91e63",
      categories: {
        citrus: {
          label: "Agrumes & pomme",
          aromas: ["Citron", "Pomme verte", "Poire", "Pêche blanche"]
        }
      }
    },
    floral: {
      label: "Floral",
      icon: <FlowerIcon />,
      color: "#9c27b0",
      categories: {
        white_flowers: {
          label: "Fleurs blanches",
          aromas: ["Fleur d'acacia", "Fleur blanche"]
        }
      }
    },
    bakery: {
      label: "Boulangerie",
      icon: <WoodIcon />,
      color: "#795548",
      categories: {
        yeast: {
          label: "Levure & biscuit",
          aromas: ["Brioche", "Biscuit", "Viennoiserie", "Pain grillé", "Levure", "Beurre"]
        }
      }
    }
  }
};

const AromaWheel = ({ wineType = 'red', selectedAromas = [], onChange }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [currentFamily, setCurrentFamily] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  
  // Vérifie si le type de vin est valide
  const wineData = aromaWheel[wineType] || aromaWheel.red;
  
  const handleOpen = () => {
    setOpen(true);
    setCurrentFamily(null);
    setCurrentCategory(null);
  };
  
  const handleClose = () => {
    setOpen(false);
  };
  
  const handleSelectFamily = (familyKey) => {
    setCurrentFamily(familyKey);
    setCurrentCategory(null);
  };
  
  const handleSelectCategory = (categoryKey) => {
    setCurrentCategory(categoryKey);
  };
  
  const handleBack = () => {
    if (currentCategory) {
      setCurrentCategory(null);
    } else if (currentFamily) {
      setCurrentFamily(null);
    }
  };
  
  const handleSelectAroma = (aroma) => {
    const newSelectedAromas = [...selectedAromas];
    const index = newSelectedAromas.indexOf(aroma);
    if (index === -1) {
      newSelectedAromas.push(aroma);
    } else {
      newSelectedAromas.splice(index, 1);
    }
    onChange(newSelectedAromas);
  };
  
  // Rendu de la roue des arômes
  const renderAromaWheel = () => {
    if (currentFamily && currentCategory) {
      const family = wineData[currentFamily];
      const category = family.categories[currentCategory];
      return (
        <Box>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Retour
          </Button>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {family.icon} 
            <Box component="span" sx={{ mx: 1 }}>{family.label}</Box> 
            <ChevronRightIcon /> 
            {category.label}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {category.aromas.map(aroma => {
              const isSelected = selectedAromas.includes(aroma);
              return (
                <Chip
                  key={aroma}
                  label={aroma}
                  onClick={() => handleSelectAroma(aroma)}
                  color={isSelected ? "primary" : "default"}
                  variant={isSelected ? "filled" : "outlined"}
                  sx={{ 
                    borderColor: family.color,
                    bgcolor: isSelected ? family.color : 'transparent',
                    color: isSelected ? 'white' : family.color,
                    borderRadius: 2,
                    m: 0.5,
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor: isSelected ? family.color : `${family.color}22`,
                      transform: 'scale(1.05)'
                    }
                  }}
                />
              );
            })}
          </Box>
        </Box>
      );
    } else if (currentFamily) {
      const family = wineData[currentFamily];
      return (
        <Box>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Retour
          </Button>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {family.icon} {family.label}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List sx={{ bgcolor: 'background.paper' }}>
            {Object.entries(family.categories).map(([categoryKey, category]) => (
              <ListItem 
                key={categoryKey}
                button
                onClick={() => handleSelectCategory(categoryKey)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  transition: 'all 0.2s',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: `${family.color}11`,
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <ListItemText 
                  primary={category.label} 
                  secondary={`${category.aromas.length} arômes`}
                />
                <ListItemIcon sx={{ minWidth: 'auto' }}>
                  <ChevronRightIcon />
                </ListItemIcon>
              </ListItem>
            ))}
          </List>
        </Box>
      );
    } else {
      return (
        <Grid container spacing={2}>
          {Object.entries(wineData).map(([familyKey, family]) => (
            <Grid item xs={6} sm={4} key={familyKey}>
              <Paper
                elevation={0}
                onClick={() => handleSelectFamily(familyKey)}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: `${family.color}11`,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[3],
                    bgcolor: `${family.color}22`
                  }
                }}
              >
                <Box sx={{ 
                  color: family.color, 
                  fontSize: 40,
                  mb: 1,
                  '& .MuiSvgIcon-root': {
                    fontSize: 40
                  }
                }}>
                  {family.icon}
                </Box>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ color: family.color }}>
                  {family.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      );
    }
  };
  
  return (
    <Box>
      {/* Affichage des arômes sélectionnés */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          Arômes sélectionnés:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {selectedAromas.length > 0 ? (
            selectedAromas.map((aroma) => (
              <Chip
                key={aroma}
                label={aroma}
                onDelete={() => handleSelectAroma(aroma)}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ borderRadius: 2 }}
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Aucun arôme sélectionné
            </Typography>
          )}
        </Box>
      </Box>
      
      {/* Bouton pour ouvrir la roue */}
      <Button 
        variant="outlined"
        onClick={handleOpen}
        fullWidth
        sx={{ borderRadius: 2 }}
      >
        Ouvrir la roue des arômes
      </Button>
      
      {/* Dialogue */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Roue des arômes {currentFamily ? ' - ' + wineData[currentFamily].label : ''}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {renderAromaWheel()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AromaWheel;
