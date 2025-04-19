import React from 'react';
import { Box, Typography, Grid, useTheme, alpha } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import { SvgIconProps } from '@mui/material';

interface Props {
  displayMode: string;
}

interface TemperatureInfo {
  range: string;
  icon: React.ReactElement<SvgIconProps>;
  label: string;
  color: string;
}

interface LabelInfo {
  id: string;
  label: string;
  icon: React.ReactElement<SvgIconProps>;
  color: string;
}

const serviceTemperatures: Record<string, TemperatureInfo> = {
  red: {
    range: '16-18°C',
    icon: <ThermostatIcon />,
    label: 'Température ambiante',
    color: '#FF5252',
  },
  white: {
    range: '8-10°C',
    icon: <AcUnitIcon />,
    label: 'Très frais',
    color: '#81D4FA',
  },
  rose: {
    range: '10-12°C',
    icon: <AcUnitIcon />,
    label: 'Frais',
    color: '#F48FB1',
  },
  sparkling: {
    range: '6-8°C',
    icon: <AcUnitIcon />,
    label: 'Très frais',
    color: '#90CAF9',
  },
  fortified: {
    range: '14-16°C',
    icon: <ThermostatIcon />,
    label: 'Tempéré',
    color: '#A1887F',
  },
};

const customLabels: LabelInfo[] = [
  {
    id: 'favorite',
    label: 'Coup de cœur',
    icon: <FavoriteIcon color="error" />,
    color: '#FFD54F',
  },
  {
    id: 'special',
    label: 'Occasion spéciale',
    icon: <CelebrationIcon color="secondary" />,
    color: '#7986CB',
  },
  {
    id: 'keep',
    label: 'À garder',
    icon: <AccessTimeIcon color="primary" />,
    color: '#81C784',
  },
  {
    id: 'aperitif',
    label: 'Apéritif',
    icon: <LunchDiningIcon color="warning" />,
    color: '#FF8A65',
  },
];

const LegendDisplay: React.FC<Props> = ({ displayMode }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  if (displayMode !== 'temperature' && displayMode !== 'labels') return null;

  const isTemperatureMode = displayMode === 'temperature';

  const items: (TemperatureInfo & { id: string })[] | LabelInfo[] =
    isTemperatureMode
      ? Object.entries(serviceTemperatures).map(([id, data]) => ({ id, ...data }))
      : customLabels;

  return (
    <Box
      mb={3}
      p={2}
      bgcolor={isDarkMode ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.8)'}
      borderRadius={2}
      boxShadow="0 2px 8px rgba(0,0,0,0.08)"
      border={`1px solid ${
        isDarkMode ? alpha(theme.palette.divider, 0.1) : theme.palette.divider
      }`}
    >
      <Typography
        variant="subtitle2"
        fontWeight={600}
        gutterBottom
        color="primary"
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <InfoIcon fontSize="small" sx={{ mr: 1 }} />
        {isTemperatureMode
          ? 'Température de service recommandée :'
          : 'Étiquettes personnalisées :'}
      </Typography>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {items.map((item) => (
          <Grid
            key={item.id}
            component="div"
            sx={{ width: { xs: '50%', sm: isTemperatureMode ? '20%' : '25%' } }}
          >
            <Box display="flex" alignItems="center">
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {React.cloneElement(item.icon, {
                  sx: { fontSize: 16, color: 'white' },
                })}
              </Box>
              <Typography variant="body2" noWrap>
                <Box component="span" fontWeight="medium">
                  {item.label}
                </Box>
                {'range' in item && ` (${item.range})`}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LegendDisplay;
