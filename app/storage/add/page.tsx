'use client';

import React, { useState } from 'react';
import { 
  Container, Typography, Box, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem, 
  Grid, Paper, Snackbar, Alert, SelectChangeEvent, CircularProgress // Importer SelectChangeEvent pour MUI Select
} from '@mui/material';
import Navbar from '../../components/Navbar';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';

// Interface pour les données du formulaire (bonne pratique)
interface FormData {
  name: string;
  type: string;
  row_count: number | null;
  column_count: number | null;
}

// Interface pour les notifications (bonne pratique)
interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

export default function AddStorageLocation() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    row_count: null, // Pas besoin de 'as number | null' ici, l'interface le définit
    column_count: null,
  });

  // Gestionnaire de changement unifié pour TextField et Select
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    
    // Vérifier que 'name' existe (pour éviter les erreurs avec certains événements)
    if (name) { 
        // Pour les champs numériques, convertir en nombre ou null si vide
        const isNumericField = name === 'row_count' || name === 'column_count';
        const processedValue = isNumericField 
            ? (value === '' ? null : Number(value)) 
            : value;

        setFormData(prevData => ({
            ...prevData,
            [name]: processedValue
        }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification({ open: false, message: '', severity: 'success' }); // Reset notification

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser(); // Destructuration plus sûre
      if (userError || !user) {
        router.push('/login');
        return;
      }

      // Préparer les données à insérer (exclure les champs vides si nécessaire, ici on les garde comme null)
      const dataToInsert = {
        ...formData,
        user_id: user.id // Assurez-vous d'ajouter user_id si votre table l'exige
      };

      const { data: locationData, error: insertError } = await supabase
        .from('storage_location')
        .insert([dataToInsert])
        .select() // Pour récupérer l'ID de l'emplacement inséré
        .single(); // Attendre un seul résultat

      if (insertError) throw insertError; // Lancer l'erreur pour le bloc catch

      // Si l'insertion a réussi et que nous avons des dimensions, créons les positions
      // Utiliser locationData qui contient l'objet inséré
      if (locationData && locationData.id && formData.row_count && formData.column_count) {
        const locationId = locationData.id;
        
        // Préparer les positions à insérer
        const positions = [];
        for (let row = 1; row <= formData.row_count; row++) {
          for (let col = 1; col <= formData.column_count; col++) {
            positions.push({
              storage_location_id: locationId,
              row_position: row,
              column_position: col,
              user_id: user.id // Ajouter user_id ici aussi si nécessaire
            });
          }
        }
        
        // Insérer toutes les positions
        const { error: posError } = await supabase
          .from('position')
          .insert(positions);
          
        if (posError) {
          // Si la création des positions échoue, on peut choisir d'informer l'utilisateur
          // mais l'emplacement a déjà été créé. On ne relance pas l'erreur ici
          // pour ne pas afficher un message d'erreur global pour une erreur partielle.
          console.error('Erreur lors de la création des positions:', posError);
          setNotification({
             open: true,
             message: `Emplacement '${formData.name}' ajouté, mais erreur lors de la création des positions.`,
             severity: 'error' // Ou 'warning'
           });
           // On continue quand même vers la redirection car l'emplacement existe
        } else {
           // Succès complet
           setNotification({
             open: true,
             message: 'Emplacement et positions ajoutés avec succès !',
             severity: 'success'
           });
        }
      } else {
         // Succès de l'ajout de l'emplacement sans positions
         setNotification({
           open: true,
           message: 'Emplacement ajouté avec succès !',
           severity: 'success'
         });
      }


      // Rediriger vers la liste des emplacements après un délai
      setTimeout(() => {
        router.push('/storage');
      }, 1500);

    } 
    // --- Bloc CATCH CORRIGÉ ---
    catch (error: unknown) { // Utiliser unknown
      console.error('Erreur complète:', JSON.stringify(error, null, 2));

      let errorCode: string | undefined;
      let errorMessage: string | undefined;
      let errorDetails: string | undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Message:', errorMessage);
        // Pour les erreurs Supabase (PostgrestError), le message est souvent suffisant
        // Mais on peut tenter de lire 'code' et 'details' si besoin
      }

      if (typeof error === 'object' && error !== null) {
        if ('code' in error) {
           errorCode = String((error as { code: unknown }).code); 
           console.error('Code:', errorCode);
        }
         if ('details' in error) {
           errorDetails = String((error as { details: unknown }).details);
           console.error('Details:', errorDetails);
         }
         // Si 'message' n'a pas été trouvé via 'instanceof Error', on le cherche ici
         if (!errorMessage && 'message' in error) {
             errorMessage = String((error as { message: unknown }).message);
             console.error('Message (objet):', errorMessage);
         }
      } 

      const finalMessage = `Erreur: ${errorMessage || errorDetails || errorCode || 'Une erreur est survenue'}`;
      
      setNotification({
        open: true,
        message: finalMessage,
        severity: 'error'
      });
    // --- FIN DU Bloc CATCH CORRIGÉ ---
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Ajouter un Emplacement de Stockage
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="name" // Ajouter id pour le label
                  label="Nom de l'emplacement"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="type-label">Type</InputLabel> 
                  <Select
                    labelId="type-label" // Doit correspondre à l'InputLabel id
                    id="type" // Ajouter id
                    name="type"
                    value={formData.type}
                    label="Type" // Important pour l'accessibilité et le style outlined
                    onChange={handleChange}
                  >
                    <MenuItem value="shelf">Étagère</MenuItem>
                    <MenuItem value="case">Caisse</MenuItem>
                    <MenuItem value="drawer">Tiroir</MenuItem>
                    <MenuItem value="rack">Casier</MenuItem>
                    <MenuItem value="cellar">Cave complète</MenuItem> 
                    <MenuItem value="fridge">Réfrigérateur</MenuItem>
                    <MenuItem value="other">Autre</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="row_count"
                  label="Nombre de lignes"
                  name="row_count"
                  type="number"
                  // Amélioration: utiliser `defaultValue` ou contrôler la valeur
                  value={formData.row_count ?? ''} // Afficher '' si null
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 1 } }} // min directement dans inputProps
                  helperText="Laissez vide si non applicable (ex: Caisse)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="column_count"
                  label="Nombre de colonnes / Capacité"
                  name="column_count"
                  type="number"
                  value={formData.column_count ?? ''} // Afficher '' si null
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 1 } }} // min directement dans inputProps
                  helperText="Laissez vide si non applicable"
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading || !formData.name || !formData.type} // Désactiver si champs requis vides
                  sx={{ mr: 2, borderRadius: 2 }} // Arrondir bouton
                >
                  {loading ? <CircularProgress size={24} color="inherit"/> : 'Enregistrer'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => router.back()} // Utiliser router.back() pour annuler
                  disabled={loading}
                  sx={{ borderRadius: 2 }} // Arrondir bouton
                >
                  Annuler
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>

      {/* Snackbar pour les notifications */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Centrer peut-être ?
      >
        {/* Utiliser variant="filled" pour un meilleur contraste */}
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%', borderRadius: 1 }} // Style de l'alerte
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}