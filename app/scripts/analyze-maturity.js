/**
 * Script d'analyse de maturité pour la cave à vin
 * 
 * Ce script peut être exécuté périodiquement (par exemple, une fois par semaine) 
 * pour analyser l'état de maturité des vins dans la cave et générer des alertes
 * lorsque des bouteilles approchent de leur fenêtre de consommation optimale,
 * sont à leur apogée, ou ont dépassé leur période de consommation recommandée.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configurer le client Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fonction principale d'analyse
async function analyzeWineMaturity() {
  console.log('Démarrage de l\'analyse de maturité des vins...');
  
  try {
    // Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email');
    
    if (usersError) throw usersError;
    
    console.log(`Analyse pour ${users.length} utilisateurs...`);
    
    for (const user of users) {
      await analyzeUserWines(user.id, user.email);
    }
    
    console.log('Analyse terminée avec succès!');
  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
  }
}

// Analyser les vins d'un utilisateur spécifique
async function analyzeUserWines(userId, userEmail) {
  console.log(`Analyse des vins pour l'utilisateur ${userEmail}...`);
  
  try {
    // Récupérer les bouteilles et leurs vins associés
    const { data: bottles, error: bottlesError } = await supabase
      .from('bottle')
      .select(`
        id, 
        wine_id, 
        acquisition_date,
        wine:wine_id (
          id, 
          name, 
          vintage, 
          notes
        )
      `)
      .eq('status', 'in_stock')
      .eq('user_id', userId);
    
    if (bottlesError) throw bottlesError;
    
    console.log(`${bottles.length} bouteilles trouvées pour l'utilisateur`);
    
    // Regrouper les bouteilles par vin
    const wineGroups = groupBottlesByWine(bottles);
    
    // Analyser chaque groupe de vins
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [wineId, wineData] of Object.entries(wineGroups)) {
      const { wine, bottles } = wineData;
      const maturityStatus = getMaturityStatus(wine.vintage, wine.notes);
      
      // Créer des alertes si nécessaire
      if (maturityStatus === 'approaching' || maturityStatus === 'peak' || maturityStatus === 'past') {
        await createOrUpdateAlert(userId, wine.id, maturityStatus, bottles.length);
      }
    }
  } catch (error) {
    console.error(`Erreur lors de l'analyse pour l'utilisateur ${userEmail}:`, error);
  }
}

// Regrouper les bouteilles par vin
function groupBottlesByWine(bottles) {
  const wineGroups = {};
  
  bottles.forEach(bottle => {
    if (bottle.wine) {
      if (!wineGroups[bottle.wine.id]) {
        wineGroups[bottle.wine.id] = {
          wine: bottle.wine,
          bottles: []
        };
      }
      
      wineGroups[bottle.wine.id].bottles.push(bottle);
    }
  });
  
  return wineGroups;
}

// Extraire l'estimation de garde à partir des notes
function extractAgeability(notes) {
  if (!notes) return null;
  
  // Recherche de patrons comme "potentiel de garde de 5 à 10 ans" ou "garde 3-5 ans"
  const ageabilityRegex = /(?:potentiel de )?garde (?:de |de |pendant |d['']environ )?(\d+)(?:\s*[-à]\s*(\d+))?\s*ans/i;
  const match = notes.match(ageabilityRegex);
  
  if (match) {
    const min = parseInt(match[1]);
    const max = match[2] ? parseInt(match[2]) : min + Math.floor(min / 2); // Si pas de max, estimer
    return { min, max };
  }
  
  return null;
}

// Déterminer le statut de maturité d'un vin
function getMaturityStatus(vintage, notes) {
  if (!vintage || !notes) return 'unknown';
  
  const ageability = extractAgeability(notes);
  if (!ageability) return 'unknown';
  
  const currentYear = new Date().getFullYear();
  const age = currentYear - vintage;
  
  if (age < ageability.min * 0.7) return 'young';
  if (age >= ageability.min * 0.7 && age < ageability.min) return 'approaching';
  if (age >= ageability.min && age <= ageability.max) return 'peak';
  if (age > ageability.max) return 'past';
  
  return 'unknown';
}

// Créer ou mettre à jour une alerte de maturité
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createOrUpdateAlert(userId, wineId, status, bottleCount) {
  try {
    // Vérifier si une alerte existe déjà pour ce vin
    const { data: existingAlerts, error: alertsError } = await supabase
      .from('maturity_alerts')
      .select('id, status')
      .eq('user_id', userId)
      .eq('wine_id', wineId);
    
    if (alertsError) throw alertsError;
    
    const existingAlert = existingAlerts && existingAlerts.length > 0 ? existingAlerts[0] : null;
    
    // Si l'alerte existe déjà avec le même statut, ne rien faire
    if (existingAlert && existingAlert.status === status) {
      console.log(`Alerte déjà existante pour le vin ${wineId} avec le statut ${status}`);
      return;
    }
    
    // Si l'alerte existe mais avec un statut différent, mettre à jour
    if (existingAlert) {
      const { error: updateError } = await supabase
        .from('maturity_alerts')
        .update({
          status,
          read: false, // Marquer comme non lu pour que l'utilisateur soit notifié
          created_at: new Date().toISOString()
        })
        .eq('id', existingAlert.id);
      
      if (updateError) throw updateError;
      
      console.log(`Alerte mise à jour pour le vin ${wineId}: ${status}`);
      return;
    }
    
    // Sinon, créer une nouvelle alerte
    const { error: insertError } = await supabase
      .from('maturity_alerts')
      .insert([{
        user_id: userId,
        wine_id: wineId,
        status,
        read: false,
        created_at: new Date().toISOString()
      }]);
    
    if (insertError) throw insertError;
    
    console.log(`Nouvelle alerte créée pour le vin ${wineId}: ${status}`);
  } catch (error) {
    console.error(`Erreur lors de la création/mise à jour de l'alerte pour le vin ${wineId}:`, error);
  }
}

// Point d'entrée du script
analyzeWineMaturity().catch(console.error);