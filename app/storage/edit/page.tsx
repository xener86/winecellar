'use client';

import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem, 
  Grid, Paper, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Navbar from '../../components/Navbar';
import { supabase } from '../../utils/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function EditStorageLocation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    row_count: '' as number | string | null,
    column_count: '' as number | string | null,
  });

  // Handler pour TextField
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler pour Select
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!id) {
      setNotification({
        open: true,
        message: 'ID d\'emplacement manquant dans l\'URL',
        severity: 'error'
      });
      router.push('/storage');
      return;
    }

    const fetchStorageLocation = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('storage_location')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;

        setFormData({
          name: data.name || '',
          type: data.type || '',
          row_count: data.row_count || '',
          column_count: data.column_count || '',
        });
        
        setLoading(false);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Exception:', error);
          setNotification({
            open: true,
            message: `Erreur: ${error.message}`,
            severity: 'error'
          });
        } else {
          console.error('Erreur inconnue');
          setNotification({
            open: true,
            message: 'Erreur inconnue',
            severity: 'error'
          });
        }
        setLoading(false);
      }
    };

    fetchStorageLocation();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!id) throw new Error('ID manquant');
      
      // Conversion row/column si besoin
      const updatedData = {
        ...formData,
        row_count: formData.row_count ? Number(formData.row_count) : null,
        column_count: formData.column_count ? Number(formData.column_count) : null,
      };
      
      const { error } = await supabase
        .from('storage_location')
        .update(updatedData)
        .eq('id', id);

      if (error) throw error;

      setNotification({
        open: true,
        message: 'Emplacement mis à jour avec succès !',
        severity: 'success'
      });

      setTimeout(() => {
        router.push('/storage');
      }, 1500);

    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la mise à jour:', error);
        setNotification({
          open: true,
          message: `Erreur: ${error.message}`,
          severity: 'error'
        });
      } else {
        console.error('Erreur inconnue');
        setNotification({
          open: true,
          message: 'Erreur inconnue',
          severity: 'error'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box mb={3}>
          <Button 
            component={Link} 
            href="/storage" 
            startIcon={<ArrowBackIcon />}
          >
            Retour aux emplacements
          </Button>
        </Box>
        
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Modifier l&apos;Emplacement de Stockage
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Nom de l'emplacement"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    label="Type"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="shelf">Étagère</MenuItem>
                    <MenuItem value="case">Caisse</MenuItem>
                    <MenuItem value="drawer">Tiroir</MenuItem>
                    <MenuItem value="rack">Casier</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre de lignes"
                  name="row_count"
                  type="number"
                  InputProps={{ inputProps: { min: 1 } }}
                  value={formData.row_count}
                  onChange={handleInputChange}
                  helperText="Laissez vide si non applicable"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre de colonnes"
                  name="column_count"
                  type="number"
                  InputProps={{ inputProps: { min: 1 } }}
                  value={formData.column_count}
                  onChange={handleInputChange}
                  helperText="Laissez vide si non applicable"
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={saving}
                  sx={{ mr: 2 }}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button 
                  variant="outlined" 
                  component={Link}
                  href="/storage"
                >
                  Annuler
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}
