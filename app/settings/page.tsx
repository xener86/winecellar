// app/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, TextField, Button, Paper, Alert, Snackbar
} from '@mui/material';
import Navbar from '../components/Navbar';
import { supabase } from '../utils/supabase';

export default function SettingsPage() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [mistralKey, setMistralKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchUserPreferences();
  }, []);

  const fetchUserPreferences = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('openai_api_key, mistral_api_key')
        .eq('user_id', userData.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur:', error);
        return;
      }

      if (data) {
        setOpenaiKey(data.openai_api_key || '');
        setMistralKey(data.mistral_api_key || '');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Vérifier si l'utilisateur a déjà des préférences
      const { data, error } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Mettre à jour les préférences existantes
        const { error: updateError } = await supabase
          .from('user_preferences')
          .update({ 
            openai_api_key: openaiKey,
            mistral_api_key: mistralKey
          })
          .eq('id', data.id);

        if (updateError) throw updateError;
      } else {
        // Créer de nouvelles préférences
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert([{ 
            user_id: userData.user.id,
            openai_api_key: openaiKey,
            mistral_api_key: mistralKey
          }]);

        if (insertError) throw insertError;
      }

      setNotification({
        open: true,
        message: 'Préférences enregistrées avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        open: true,
        message: 'Erreur lors de l\'enregistrement des préférences',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Paramètres
        </Typography>

        <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Configuration des API
          </Typography>

          <Box mt={3}>
            <TextField
              fullWidth
              label="Clé API OpenAI"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              margin="normal"
              type="password"
              helperText="Clé utilisée pour générer des descriptions de vin avec ChatGPT"
            />

            <TextField
              fullWidth
              label="Clé API Mistral"
              value={mistralKey}
              onChange={(e) => setMistralKey(e.target.value)}
              margin="normal"
              type="password"
              helperText="Clé alternative pour l'IA Mistral (optionnel)"
            />

            <Button
              variant="contained"
              onClick={savePreferences}
              disabled={loading}
              sx={{ mt: 3, borderRadius: 2 }}
            >
              Enregistrer
            </Button>
          </Box>
        </Paper>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}