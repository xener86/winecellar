// app/spirits/page.tsx

'use client';

import React, { useState } from 'react';
import { 
  Container, Typography, Box, Grid, Button, 
  Paper, CircularProgress, 
  Tabs, Tab, useTheme, Chip,
  Snackbar, Alert, alpha
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Breadcrumbs } from '@/components/ui/Navigation';
import { useSpiritData } from './hooks/useSpiritData';
import { useNotifications } from '@/hooks/useNotifications';
import { Spirit, SpiritType } from '@/utils/types/spirit.types';
import SpiritCard from './components/SpiritCard';

// Composant pour le calcul des statistiques
const StatisticCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, icon, color }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  return (
    <Grid component="div" sx={{ width: { xs: '100%', sm: '33.33%' } }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          bgcolor: isDarkMode ? alpha(color || theme.palette.primary.main, 0.1) : alpha(color || theme.palette.primary.main, 0.05),
          border: `1px solid ${alpha(color || theme.palette.primary.main, 0.2)}`,
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 2
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              bgcolor: color || theme.palette.primary.main,
              color: 'white',
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5
            }}
          >
            {icon}
          </Box>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
      </Paper>
    </Grid>
  );
};

// Fonction pour calculer le nombre de types uniques
const countUniqueTypes = (spirits: Spirit[]): number => {
  const types = new Set(spirits.map(s => s.type));
  return types.size;
};

// Fonction pour calculer la valeur totale de la collection
const calculateTotalValue = (spirits: Spirit[]): string => {
  const total = spirits.reduce((sum, spirit) => {
    return sum + (spirit.acquisition.price || 0);
  }, 0);
  
  return total.toFixed(0);
};

// Fonction pour regrouper par type
const groupByType = (spirits: Spirit[]) => {
  const result: Record<SpiritType, number> = {
    whisky: 0,
    rum: 0,
    gin: 0,
    vodka: 0,
    tequila: 0,
    brandy: 0,
    liqueur: 0,
    other: 0
  };
  
  spirits.forEach(spirit => {
    result[spirit.type]++;
  });
  
  return result;
};

export default function SpiritsPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const { 
    spirits, 
    loading, 
    deleteSpirit
  } = useSpiritData();
  
  const { notification, showNotification } = useNotifications();
  
  const [activeTab, setActiveTab] = useState(0);
  
  // Obtenir le label et la couleur par type de spiritueux
  const getSpiritTypeInfo = (type: SpiritType): { label: string, color: string } => {
    const typeMap: Record<SpiritType, { label: string, color: string }> = {
      'whisky': { label: 'Whisky', color: '#cd7f32' },
      'rum': { label: 'Rhum', color: '#8b4513' },
      'gin': { label: 'Gin', color: '#add8e6' },
      'vodka': { label: 'Vodka', color: '#f5f5f5' },
      'tequila': { label: 'Tequila', color: '#ffdb58' },
      'brandy': { label: 'Brandy', color: '#964b00' },
      'liqueur': { label: 'Liqueur', color: '#ff69b4' },
      'other': { label: 'Autre', color: '#aaaaaa' }
    };
    
    return typeMap[type];
  };
  
  // Gérer la suppression d'un spiritueux
  const handleDelete = async (id: string) => {
    const success = await deleteSpirit(id);
    if (success) {
      showNotification('Spiritueux supprimé avec succès', 'success');
    }
  };
  
  // Gérer la modification d'un spiritueux
  const handleEdit = (id: string) => {
    router.push(`/spirits/edit/${id}`);
  };
  
  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Breadcrumbs />
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Ma Collection de Spiritueux
          </Typography>
          
          <Box>
            <Button
              component={Link}
              href="/spirits/add"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              sx={{ borderRadius: 2 }}
            >
              Ajouter un spiritueux
            </Button>
          </Box>
        </Box>
        
        {/* Statistiques */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <StatisticCard 
            title="Total Spiritueux" 
            value={spirits.length} 
            icon={<LocalBarIcon />} 
            color="#8b0000"
          />
          
          <StatisticCard 
            title="Types" 
            value={countUniqueTypes(spirits)} 
            icon={<FilterAltIcon />} 
            color="#9c27b0"
          />
          
          <StatisticCard 
            title="Valeur Estimée" 
            value={`${calculateTotalValue(spirits)}€`} 
            icon={<BarChartIcon />} 
            color="#2196f3"
          />
        </Grid>
        
        {/* Contenu principal */}
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 2, 
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={(_e, val) => setActiveTab(val)}
              sx={{ px: 2 }}
            >
              <Tab label="Tous les spiritueux" />
              <Tab label="Par type" />
              <Tab label="Récents" />
            </Tabs>
          </Box>
          
          {/* Onglet de tous les spiritueux */}
          {activeTab === 0 && (
            <Box p={3}>
              {spirits.length === 0 ? (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'
                  }}
                >
                  <LocalBarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Aucun spiritueux dans votre collection
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Commencez par ajouter votre premier spiritueux !
                  </Typography>
                  <Button 
                    component={Link}
                    href="/spirits/add"
                    variant="contained" 
                    startIcon={<AddIcon />}
                  >
                    Ajouter un spiritueux
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {spirits.map(spirit => (
                    <Grid component="div" key={spirit.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                      <SpiritCard 
                        spirit={spirit} 
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
          
          {/* Onglet par type */}
          {activeTab === 1 && (
            <Box p={3}>
              {spirits.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Aucun spiritueux à afficher
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {Object.entries(groupByType(spirits))
                    .filter(([, count]) => count > 0)
                    .map(([type, count]) => {
                      const typeInfo = getSpiritTypeInfo(type as SpiritType);
                      const spiritsOfType = spirits.filter(s => s.type === type);
                      
                      return (
                        <Box key={type} sx={{ mb: 4 }}>
                          <Box 
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              mb: 2
                            }}
                          >
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                bgcolor: alpha(typeInfo.color, 0.8),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 1.5
                              }}
                            >
                              <LocalBarIcon sx={{ color: type === 'vodka' ? '#000' : '#fff' }} />
                            </Box>
                            <Typography variant="h6">
                              {typeInfo.label}
                            </Typography>
                            <Chip 
                              label={count} 
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                          
                          <Grid container spacing={2}>
                            {spiritsOfType.map(spirit => (
                              <Grid component="div" key={spirit.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                                <SpiritCard 
                                  spirit={spirit} 
                                  compact
                                  onEdit={handleEdit}
                                  onDelete={handleDelete}
                                />
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      );
                    })}
                </Box>
              )}
            </Box>
          )}
          
          {/* Onglet des spiritueux récents */}
          {activeTab === 2 && (
            <Box p={3}>
              {spirits.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Aucun spiritueux à afficher
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {spirits
                    .sort((a, b) => new Date(b.acquisition.date).getTime() - new Date(a.acquisition.date).getTime())
                    .slice(0, 12)
                    .map(spirit => (
                      <Grid component="div" key={spirit.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                        <SpiritCard 
                          spirit={spirit} 
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      </Grid>
                    ))
                  }
                </Grid>
              )}
            </Box>
          )}
        </Paper>
      </Container>
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => {}}
      >
        <Alert 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}