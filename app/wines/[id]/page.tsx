'use client';

import React, { useEffect, useState } from 'react';
import { CircularProgress, Snackbar, Alert, Divider as MuiDivider } from '@mui/material';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Info, 
  Wine, 
  Clock, 
  FileText, 
  UtensilsCrossed
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { supabase } from '../../utils/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import WineAgingCurve from '../../components/WineAgingCurve';
import TastingRadarChart from '../../components/TastingRadarChart';
import AppellationInfo from '../../components/AppellationInfo';
import { 
  RedWineBottle, 
  WhiteWineBottle, 
  RoseWineBottle, 
  SparklingWineBottle, 
  FortifiedWineBottle 
} from '../../components/bottles';

// Fonction pour rendre la bouteille de vin appropriée
const renderWineBottle = (wine) => {
  const { name, vintage, domain, appellation, region, color, alcohol_percentage } = wine;
  
  const wineInfo = {
    name,
    vintage: vintage || undefined,
    domain: domain || undefined,
    appellation: appellation || undefined, 
    region: region || undefined,
    alcoholPercentage: alcohol_percentage || undefined
  };

  switch (color) {
    case 'red': return <RedWineBottle wineInfo={wineInfo} />;
    case 'white': return <WhiteWineBottle wineInfo={wineInfo} />;
    case 'rose': return <RoseWineBottle wineInfo={wineInfo} />;
    case 'sparkling': return <SparklingWineBottle wineInfo={wineInfo} />;
    case 'fortified': return <FortifiedWineBottle wineInfo={wineInfo} />;
    default: return <RedWineBottle wineInfo={wineInfo} />;
  }
};

// Fonction pour afficher la couleur du vin en français
const getColorLabel = (color) => {
  const colors = {
    red: { label: 'Rouge' },
    white: { label: 'Blanc' },
    rose: { label: 'Rosé' },
    sparkling: { label: 'Effervescent' },
    fortified: { label: 'Fortifié' },
  };

  return colors[color]?.label || color;
};

// Divider personnalisé pour un style minimaliste
const Divider = () => (
  <div className="my-4 border-t border-gray-100" />
);

// Titre de section avec icône
const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center mb-3">
    <Icon className="text-red-800 mr-2" size={18} />
    <h3 className="text-sm font-medium uppercase tracking-wide text-gray-700">{title}</h3>
  </div>
);

export default function WineDetail() {
  const [wine, setWine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({
    appellation: false,
    notes: false
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const router = useRouter();
  const params = useParams();

  // Extraire l'ID de manière sûre
  const id = params?.id ? String(params.id) : '';

  // Toggle pour les sections expansibles
  const toggleExpanded = (section) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const fetchWine = async () => {
      // S'assurer que l'ID existe et n'est pas "add"
      if (!id || id === 'add') {
        setLoading(false);
        return;
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          router.push('/login');
          return;
        }

        // Récupérer le vin avec ses données de base
        const { data: wineData, error: wineError } = await supabase
          .from('wine')
          .select('*')
          .eq('id', id)
          .single();
        
        if (wineError) throw wineError;
        
        // Récupérer les cépages associés au vin
        const { data: grapeData, error: grapeError } = await supabase
          .from('wine_grape')
          .select(`
            grape_id,
            percentage,
            grape:grape_id (
              id,
              name
            )
          `)
          .eq('wine_id', id);
        
        if (grapeError) throw grapeError;

        // Récupérer les notes de dégustation si elles existent
        const { data: tastingData, error: tastingError } = await supabase
          .from('tasting_notes')
          .select('*')
          .eq('wine_id', id)
          .maybeSingle();
        
        if (tastingError && tastingError.code !== 'PGRST116') {
          // PGRST116 signifie aucun résultat, ce qui est acceptable
          throw tastingError;
        }

        // Formater les données de cépages
        const grapes = grapeData ? grapeData.map((item) => ({
          id: item.grape.id,
          name: item.grape.name,
          percentage: item.percentage
        })) : [];

        // Combiner toutes les données
        setWine({
          ...wineData,
          grapes,
          tasting_notes: tastingData || parseNotesFromDescription(wineData.notes)
        });
      } catch (error) {
        console.error('Erreur lors de la récupération du vin:', error);
        setNotification({
          open: true,
          message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWine();
  }, [id, router]);

  // Fonction pour extraire des notes de dégustation du champ notes
  const parseNotesFromDescription = (notes) => {
    if (!notes) return null;

    let tastingNotes = {
      id: 'generated',
      wine_id: id,
      appearance: null,
      nose: null,
      palate: null,
      food_pairing: null,
      aging_potential: null,
      created_at: new Date().toISOString()
    };

    // Rechercher les sections dans les notes
    const robeMatch = notes.match(/ROBE :\n(.*?)(?:\n\n|$)/s);
    if (robeMatch) tastingNotes.appearance = robeMatch[1].trim();

    const nezMatch = notes.match(/NEZ :\n(.*?)(?:\n\n|$)/s);
    if (nezMatch) tastingNotes.nose = nezMatch[1].trim();

    const boucheMatch = notes.match(/BOUCHE :\n(.*?)(?:\n\n|$)/s);
    if (boucheMatch) tastingNotes.palate = boucheMatch[1].trim();

    const gardeMatch = notes.match(/POTENTIEL DE GARDE :\n(.*?)(?:\n\n|$)/s);
    if (gardeMatch) tastingNotes.aging_potential = gardeMatch[1].trim();

    const accordsMatch = notes.match(/ACCORDS METS & VIN :\n(.*?)(?:\n\n|$)/s);
    if (accordsMatch) tastingNotes.food_pairing = accordsMatch[1].trim();

    // Si au moins une section a été trouvée, retourner les notes
    if (tastingNotes.appearance || tastingNotes.nose || tastingNotes.palate || 
        tastingNotes.aging_potential || tastingNotes.food_pairing) {
      return tastingNotes;
    }

    return null;
  };
  const getWineColorStyle = (color) => {
    switch (color) {
      case 'white':
        return { fill: '#DAA52050', stroke: '#DAA520' }; // Doré pour vin blanc
      case 'red':
        return { fill: '#9A2A2A50', stroke: '#9A2A2A' }; // Rouge bordeaux
      case 'rose':
        return { fill: '#FF69B450', stroke: '#FF69B4' }; // Rose
      // autres cas...
      default:
        return { fill: '#8B451350', stroke: '#8B4513' };
    }
  };

  const handleDelete = async () => {
    if (!id || !wine) return;
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce vin ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('wine')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setNotification({
        open: true,
        message: 'Vin supprimé avec succès',
        severity: 'success'
      });
      
      setTimeout(() => {
        router.push('/wines');
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-16">
          <div className="flex justify-center my-16">
            <CircularProgress />
          </div>
        </div>
      </>
    );
  }

  if (!wine) {
    return (
      <>
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-16">
          <div className="text-center">
            <h1 className="text-xl font-medium mb-4">Vin non trouvé</h1>
            <Link href="/wines" className="inline-flex items-center text-red-800 hover:underline">
              <ArrowLeft className="mr-2" size={18} />
              Retour à la liste des vins
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Calculer l'année optimale de consommation
  const optimalYear = wine.optimal_consumption_end ? 
    new Date(wine.optimal_consumption_end).getFullYear() : 
    wine.vintage ? wine.vintage + 5 : 
    new Date().getFullYear() + 3;
  
  // Déterminer la température de service en fonction du type de vin
  const serviceTemperature = wine.color === 'red' ? '16-18°C' : 
    wine.color === 'white' ? '8-10°C' : 
    wine.color === 'rose' ? '10-12°C' : '6-8°C';

  return (
    <>
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-16">
        {/* Fil d'Ariane et retour */}
        <div className="mb-6">
          <Link href="/wines" className="inline-flex items-center text-gray-600 hover:text-red-800 transition-colors">
            <ArrowLeft className="mr-2" size={18} />
            <span>Retour à la liste</span>
          </Link>
        </div>
        
        {/* En-tête minimaliste */}
        <div className="mb-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {wine.vintage && <span>{wine.vintage}</span>}
                {wine.region && <span>• {wine.region}</span>}
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100">
                  {getColorLabel(wine.color)}
                </span>
              </div>
              <h1 className="text-2xl font-serif font-bold mt-1 text-gray-900">
                {wine.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {wine.domain || ''}
                {wine.appellation && ` • ${wine.appellation}`}
              </p>
            </div>
            <div className="flex space-x-2">
              <Link
                href={`/edit-wine?id=${wine.id}`}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Modifier"
              >
                <Edit size={18} />
              </Link>
              <button
                onClick={handleDelete}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Contenu principal en deux colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Colonne de gauche - Informations principales */}
          <div className="md:col-span-7 space-y-6">
            {/* Radar de dégustation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
  <SectionTitle icon={Wine} title="Profil de dégustation" />
  <div className="text-xs text-gray-600 mb-2">
    Caractéristiques principales basées sur les notes de dégustation
  </div>
  <TastingRadarChart 
    wine={wine} 
    height={200} 
    showTitle={false} // Titre déjà fourni par le parent
    showFootnote={true}
  />
</div>
              

            {/* Informations générales */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <SectionTitle icon={Info} title="Informations" />
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {wine.domain && (
                  <div>
                    <span className="text-gray-500">Domaine:</span>
                    <span className="ml-2 font-medium">{wine.domain}</span>
                  </div>
                )}
                {wine.region && (
                  <div>
                    <span className="text-gray-500">Région:</span>
                    <span className="ml-2 font-medium">{wine.region}</span>
                  </div>
                )}
                {wine.appellation && (
                  <div>
                    <span className="text-gray-500">Appellation:</span>
                    <span className="ml-2 font-medium">{wine.appellation}</span>
                  </div>
                )}
                {wine.alcohol_percentage && (
                  <div>
                    <span className="text-gray-500">Alcool:</span>
                    <span className="ml-2 font-medium">{wine.alcohol_percentage}%</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Garde:</span>
                  <span className="ml-2 font-medium">Jusqu'en {optimalYear}</span>
                </div>
                <div>
                  <span className="text-gray-500">Service:</span>
                  <span className="ml-2 font-medium">{serviceTemperature}</span>
                </div>
                {wine.price && (
                  <div>
                    <span className="text-gray-500">Prix:</span>
                    <span className="ml-2 font-medium">{wine.price} €</span>
                  </div>
                )}
                {wine.purchase_date && (
                  <div>
                    <span className="text-gray-500">Acheté le:</span>
                    <span className="ml-2 font-medium">{new Date(wine.purchase_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>

              {/* Cépages */}
              {wine.grapes && wine.grapes.length > 0 && (
                <>
                  <Divider />
                  <div>
                    <div className="text-gray-500 text-sm mb-2">Cépages:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {wine.grapes.map((grape) => (
                        <span 
                          key={grape.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200"
                        >
                          {grape.percentage ? `${grape.name} (${grape.percentage}%)` : grape.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notes de dégustation */}
            {wine.tasting_notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <SectionTitle icon={FileText} title="Notes de dégustation" />

                <div className="space-y-4 text-sm">
                  {wine.tasting_notes.appearance && (
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Robe:</div>
                      <p className="text-gray-600">{wine.tasting_notes.appearance}</p>
                    </div>
                  )}
                  
                  {wine.tasting_notes.nose && (
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Nez:</div>
                      <p className="text-gray-600">{wine.tasting_notes.nose}</p>
                    </div>
                  )}
                  
                  {wine.tasting_notes.palate && (
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Bouche:</div>
                      <p className="text-gray-600">{wine.tasting_notes.palate}</p>
                    </div>
                  )}
                  
                  {wine.tasting_notes.food_pairing && (
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Accords mets-vins:</div>
                      <p className="text-gray-600">{wine.tasting_notes.food_pairing}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section Appellation */}
            {wine.appellation && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between cursor-pointer" 
                    onClick={() => toggleExpanded('appellation')}>
                  <SectionTitle icon={Info} title={`Appellation: ${wine.appellation}`} />
                  <button className="p-1 rounded-full hover:bg-gray-100">
                    {expanded.appellation ? '−' : '+'}
                  </button>
                </div>
                
                {expanded.appellation && (
                  <div className="mt-2">
                    <AppellationInfo appellation={wine.appellation} region={wine.region} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Colonne de droite - Bouteille et courbe de vieillissement */}
          <div className="md:col-span-5 space-y-6">
            {/* Visualisation de la bouteille */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center">
              <div className="h-64 flex items-center justify-center">
                {wine.image_url ? (
                  <img 
                    src={wine.image_url} 
                    alt={wine.name} 
                    className="h-full object-contain"
                  />
                ) : (
                  <div className="h-full w-32 flex items-center justify-center">
                    {renderWineBottle(wine)}
                  </div>
                )}
              </div>
            </div>

            {/* Courbe d'apogée */}

  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
  <div className="flex items-center mb-2">
    <Clock className="text-wine-color mr-2" size={18} />
    <h3 className="text-sm font-medium">Cycle de vie</h3>
  </div>
  
  <div className="text-xs text-gray-600 mb-1">
    Évolution estimée de la qualité du vin au fil du temps
  </div>
  
  {/* Solution avec ratio d'aspect contrôlé */}
  <div style={{ height: "280px", width: "100%" }}>
  <WineAgingCurve wine={wine} />
</div>
</div>
            
            {/* Accords mets-vins et potentiel de garde */}
            {(wine.tasting_notes?.food_pairing || wine.tasting_notes?.aging_potential) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                {wine.tasting_notes?.aging_potential && (
                  <div className="mb-4">
                    <div className="flex items-center text-sm font-medium mb-2 text-gray-700">
                      <Clock className="text-red-800 mr-2" size={18} />
                      Potentiel de garde
                    </div>
                    <p className="text-sm text-gray-600">
                      {wine.tasting_notes.aging_potential}
                    </p>
                  </div>
                )}
                
                {wine.tasting_notes?.food_pairing && (
                  <div>
                    <div className="flex items-center text-sm font-medium mb-2 text-gray-700">
                      <UtensilsCrossed className="text-red-800 mr-2" size={18} />
                      Accords mets-vins recommandés
                    </div>
                    <p className="text-sm text-gray-600">
                      {wine.tasting_notes.food_pairing}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          variant="filled"
          className="rounded-lg"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}