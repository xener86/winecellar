// File: app/storage/components/dialogs/ConsumeBottleDialog.tsx
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Typography, Box, Button, TextField
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Bottle } from '../../types';

interface ConsumeBottleDialogProps {
  open: boolean;
  onClose: () => void;
  bottle: Bottle | null;
  onConsume: () => void;
  consumptionData: {
    consumption_date: Date;
    tasting_note: string;
  };
  setConsumptionData: React.Dispatch<React.SetStateAction<{
    consumption_date: Date;
    tasting_note: string;
  }>>;
}

const ConsumeBottleDialog: React.FC<ConsumeBottleDialogProps> = ({
  open,
  onClose,
  bottle,
  onConsume,
  consumptionData,
  setConsumptionData
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  if (!bottle || !bottle.wine) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: 500,
          bgcolor: isDarkMode ? '#1A1A1A' : 'white',
          backgroundImage: isDarkMode 
            ? 'linear-gradient(145deg, rgba(40,40,40,0.7), rgba(30,30,30,0.5))' 
            : 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(245,245,245,0.7))',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #7B1FA2, #9C27B0)'
          }
        }
      }}
    >
      <DialogTitle 
        color="secondary"
        sx={{ fontWeight: 600 }}
      >
        Marquer comme consommée
      </DialogTitle>
      <DialogContent>
        <Box mt={1}>
          <Typography 
            variant="body1" 
            gutterBottom
            sx={{ 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              mb: 3,
              pb: 1,
              borderBottom: `1px dashed ${theme.palette.divider}`
            }}
          >
            {bottle.wine.name} {bottle.wine.vintage && `(${bottle.wine.vintage})`}
          </Typography>
          
          <Box my={2}>
            <TextField
              fullWidth
              label="Date de consommation"
              type="date"
              value={consumptionData.consumption_date ? 
                new Date(consumptionData.consumption_date).toISOString().split('T')[0] : 
                new Date().toISOString().split('T')[0]
              }
              onChange={(e) => setConsumptionData({
                ...consumptionData,
                consumption_date: new Date(e.target.value)
              })}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.secondary.main,
                    borderWidth: 2,
                  },
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Notes de dégustation"
              multiline
              rows={4}
              value={consumptionData.tasting_note || ''}
              onChange={(e) => setConsumptionData({
                ...consumptionData,
                tasting_note: e.target.value
              })}
              placeholder="Vos impressions, arômes, saveurs, accords réussis..."
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.secondary.main,
                    borderWidth: 2,
                  },
                }
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            borderRadius: 2,
            px: 3,
            backgroundColor: isDarkMode 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(0,0,0,0.03)',
            '&:hover': {
              backgroundColor: isDarkMode 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(0,0,0,0.05)',
            }
          }}
        >
          Annuler
        </Button>
        <Button 
          onClick={onConsume} 
          variant="contained" 
          color="secondary"
          sx={{ 
            borderRadius: 2,
            px: 3,
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            background: 'linear-gradient(45deg, #7B1FA2, #9C27B0)',
            '&:hover': {
              background: 'linear-gradient(45deg, #6A1B9A, #8E24AA)',
              boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConsumeBottleDialog;