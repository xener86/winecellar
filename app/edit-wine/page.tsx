'use client';

import React, { useEffect, useState } from 'react';
import { 
  Snackbar, 
  Alert, 
  CircularProgress,
  AlertColor,
} from '@mui/material';
import { 
  ArrowLeft,
  Info, 
  Wine,
  FileText,
  Clock,
  UtensilsCrossed,
  LucideIcon
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { supabase } from '../utils/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '../components/ImageUpload.jsx';
import WineBottle from '../components/WineBottle.jsx';

interface WineFormData {
  name: string;
  vintage: number | null;
  region: string;
  appellation: string;
  domain: string;
  color: string;
  alcohol_percentage: number | null;
  purchase_date: string | null;
  price: number | null;
  optimal_consumption_start: string | null;
  optimal_consumption_end: string | null;
  notes: string;
  image_url: string;
}

interface TastingNotes {
  appearance: string | null;
  nose: string | null;
  palate: string | null;
  aging_potential: string | null;
  food_pairing: string | null;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface SectionTitleProps {
  icon: LucideIcon;
  title: string;
}

export default function EditWine() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id') || '';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ 
    open: false, 
    message: '', 
    severity: 'success'
  });
  
  const [formData, setFormData] = useState<WineFormData>({
    name: '',
    vintage: null,
    region: '',
    appellation: '',
    domain: '',
    color: '',
    alcohol_percentage: null,
    purchase_date: null,
    price: null,
    optimal_consumption_start: null,
    optimal_consumption_end: null,
    notes: '',
    image_url: '',
  });

  const [parsedNotes, setParsedNotes] = useState<TastingNotes>({
    appearance: null,
    nose: null,
    palate: null,
    aging_potential: null,
    food_pairing: null
  });

  // Titre de section avec icône
  const SectionTitle: React.FC<SectionTitleProps> = ({ icon: Icon, title }) => (
    <div className="flex items-center mb-3">
      <Icon className="text-red-800 mr-2" size={18} />
      <h3 className="text-sm font-medium uppercase tracking-wide text-gray-700">{title}</h3>
    </div>
  );

  // Parse les notes de dégustation depuis le texte brut
  const parseNotesFromDescription = (notes: string): TastingNotes => {
    const tastingNotes: TastingNotes = {
      appearance: null,
      nose: null,
      palate: null,
      aging_potential: null,
      food_pairing: null
    };

    if (!notes) return tastingNotes;

    // Rechercher les sections dans les notes - flags modifiés pour compatibility
    const robeMatch = notes.match(/ROBE :\n(.*?)(?:\n\n|$)/);
    if (robeMatch) tastingNotes.appearance = robeMatch[1].trim();

    const nezMatch = notes.match(/NEZ :\n(.*?)(?:\n\n|$)/);
    if (nezMatch) tastingNotes.nose = nezMatch[1].trim();

    const boucheMatch = notes.match(/BOUCHE :\n(.*?)(?:\n\n|$)/);
    if (boucheMatch) tastingNotes.palate = boucheMatch[1].trim();

    const gardeMatch = notes.match(/POTENTIEL DE GARDE :\n(.*?)(?:\n\n|$)/);
    if (gardeMatch) tastingNotes.aging_potential = gardeMatch[1].trim();

    const accordsMatch = notes.match(/ACCORDS METS & VIN :\n(.*?)(?:\n\n|$)/);
    if (accordsMatch) tastingNotes.food_pairing = accordsMatch[1].trim();

    return tastingNotes;
  };

  // Met à jour les notes structurées quand les notes brutes changent
  useEffect(() => {
    if (formData.notes) {
      setParsedNotes(parseNotesFromDescription(formData.notes));
    }
  }, [formData.notes]);

  useEffect(() => {
    if (!id) {
      setNotification({
        open: true,
        message: "ID du vin manquant dans l'URL",
        severity: 'error'
      });
      router.push('/wines');
      return;
    }
    
    const fetchWine = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('wine')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        setFormData({
          name: data.name || '',
          vintage: data.vintage,
          region: data.region || '',
          appellation: data.appellation || '',
          domain: data.domain || '',
          color: data.color || '',
          alcohol_percentage: data.alcohol_percentage,
          purchase_date: data.purchase_date,
          price: data.price,
          optimal_consumption_start: data.optimal_consumption_start,
          optimal_consumption_end: data.optimal_consumption_end,
          notes: data.notes || '',
          image_url: data.image_url || '',
        });

        // Analyser les notes si elles existent
        if (data.notes) {
          setParsedNotes(parseNotesFromDescription(data.notes));
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du vin:', error);
        setNotification({
          open: true,
          message: `Erreur: ${(error as Error).message || 'Une erreur est survenue'}`,
          severity: 'error'
        });
        router.push('/wines');
      } finally {
        setLoading(false);
      }
    };

    fetchWine();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number | null = value;
    
    // Gérer les types numériques
    if ((e.target as HTMLInputElement).type === 'number') {
      processedValue = value === '' ? null : Number(value);
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!id) throw new Error("ID manquant");
      
      const { error } = await supabase
        .from('wine')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      setNotification({
        open: true,
        message: 'Vin mis à jour avec succès !',
        severity: 'success'
      });

      // Rediriger vers la page de détail du vin
      setTimeout(() => {
        router.push(`/wines/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du vin:', error);
      setNotification({
        open: true,
        message: `Erreur: ${(error as Error).message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Fonction pour afficher la couleur du vin en français
  const getColorLabel = (color: string): string => {
    const colors: Record<string, { label: string }> = {
      red: { label: 'Rouge' },
      white: { label: 'Blanc' },
      rose: { label: 'Rosé' },
      sparkling: { label: 'Effervescent' },
      fortified: { label: 'Fortifié' },
    };

    return colors[color]?.label || color;
  };

  // Mise à jour de l'URL de l'image
  const handleImageChange = (imageUrl: string): void => {
    setFormData(prev => ({
      ...prev,
      image_url: imageUrl || ''
    }));
  };

  // Les props pour le composant WineBottle sont gérées directement dans les attributs JSX

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

  return (
    <>
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-16">
        {/* Fil d'Ariane et retour */}
        <div className="mb-6">
          <Link href={`/wines/${id}`} className="inline-flex items-center text-gray-600 hover:text-red-800 transition-colors">
            <ArrowLeft className="mr-2" size={18} />
            <span>Retour au vin</span>
          </Link>
        </div>
        
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold mt-1 text-gray-900">
            Modifier {formData.name}
          </h1>
          <p className="text-gray-600 mt-1">
            {formData.vintage && `${formData.vintage} • `}
            {formData.color && getColorLabel(formData.color)}
          </p>
        </div>
        
        {/* Formulaire principal */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Colonne principale */}
            <div className="md:col-span-8 space-y-6">
              {/* Informations de base */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <SectionTitle icon={Info} title="Informations de base" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du vin*</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Millésime</label>
                    <input
                      type="number"
                      name="vintage"
                      min={1900}
                      max={new Date().getFullYear()}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
                      value={formData.vintage || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Domaine</label>
                    <input
                      type="text"
                      name="domain"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
                      value={formData.domain}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Couleur*</label>
                    <select
                      name="color"
                      required
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
                      value={formData.color}
                      onChange={handleChange}
                    >
                      <option value="">Sélectionner</option>
                      <option value="red">Rouge</option>
                      <option value="white">Blanc</option>
                      <option value="rose">Rosé</option>
                      <option value="sparkling">Effervescent</option>
                      <option value="fortified">Fortifié</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
                    <input
                      type="text"
                      name="region"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
                      value={formData.region}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Appellation</label>
                    <input
                      type="text"
                      name="appellation"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
                      value={formData.appellation}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Caractéristiques */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <SectionTitle icon={Wine} title="Caractéristiques" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Degré d&apos;alcool (%)</label>
                    <input
                      type="number"
                      name="alcohol_percentage"
                      step="0.1"
                      min="0"
                      max="20"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
                      value={formData.alcohol_percentage || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix d&apos;achat (€)</label>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
                      value={formData.price || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;achat</label>
                    <input
                      type="date"
                      name="purchase_date"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
                      value={formData.purchase_date || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              
              {/* Potentiel de garde */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <SectionTitle icon={Clock} title="Potentiel de garde" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Début consommation optimale</label>
                    <input
                      type="date"
                      name="optimal_consumption_start"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
                      value={formData.optimal_consumption_start || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fin consommation optimale</label>
                    <input
                      type="date"
                      name="optimal_consumption_end"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
                      value={formData.optimal_consumption_end || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              
              {/* Notes de dégustation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <SectionTitle icon={FileText} title="Notes de dégustation" />
                
                <div className="mb-4">
                  <textarea
                    name="notes"
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800 font-mono text-sm"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="ROBE : 
NEZ : 
BOUCHE : 
POTENTIEL DE GARDE : 
ACCORDS METS & VIN : "
                  ></textarea>
                </div>

                {/* Prévisualisation des notes structurées */}
                {(parsedNotes.appearance || parsedNotes.nose || parsedNotes.palate || 
                  parsedNotes.aging_potential || parsedNotes.food_pairing) && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="text-sm font-medium text-gray-700 mb-2">Prévisualisation des notes:</div>
                    <div className="space-y-2 text-sm">
                      {parsedNotes.appearance && (
                        <div>
                          <span className="font-medium">Robe:</span> {parsedNotes.appearance}
                        </div>
                      )}
                      {parsedNotes.nose && (
                        <div>
                          <span className="font-medium">Nez:</span> {parsedNotes.nose}
                        </div>
                      )}
                      {parsedNotes.palate && (
                        <div>
                          <span className="font-medium">Bouche:</span> {parsedNotes.palate}
                        </div>
                      )}
                      {parsedNotes.aging_potential && (
                        <div>
                          <span className="font-medium">Potentiel de garde:</span> {parsedNotes.aging_potential}
                        </div>
                      )}
                      {parsedNotes.food_pairing && (
                        <div>
                          <span className="font-medium">Accords mets-vins:</span> {parsedNotes.food_pairing}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Colonne latérale */}
            <div className="md:col-span-4 space-y-6">
              {/* Image et prévisualisation de la bouteille */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <SectionTitle icon={Wine} title="Image de la bouteille" />
                
                <div className="mb-4">
                  <div className="mb-4">
                    <ImageUpload
                      initialImageUrl={formData.image_url}
                      onImageChange={handleImageChange}
                      removeBackground={true}
                    />
                  </div>
                  
                  {!formData.image_url && formData.color && (
                    <div className="text-center py-4">
                      <div className="h-48 flex items-center justify-center mb-2">
                        {formData.color === 'red' && (
                          <div className="w-24">
                            <WineBottle 
                              color="red" 
                              wineInfo={{
                                name: formData.name,
                                vintage: formData.vintage || undefined,
                                domain: formData.domain || undefined
                              }}
                              showLabel={true}
                              height={200}
                              imageUrl=""
                              onProcessedImage={() => {}}
                            />
                          </div>
                        )}
                        {formData.color === 'white' && (
                          <div className="w-24">
                            <WineBottle 
                              color="white" 
                              wineInfo={{
                                name: formData.name,
                                vintage: formData.vintage || undefined,
                                domain: formData.domain || undefined
                              }}
                              showLabel={true}
                              height={200}
                              imageUrl=""
                              onProcessedImage={() => {}}
                            />
                          </div>
                        )}
                        {formData.color === 'rose' && (
                          <div className="w-24">
                            <WineBottle 
                              color="rose" 
                              wineInfo={{
                                name: formData.name,
                                vintage: formData.vintage || undefined,
                                domain: formData.domain || undefined
                              }}
                              showLabel={true}
                              height={200}
                              imageUrl=""
                              onProcessedImage={() => {}}
                            />
                          </div>
                        )}
                        {formData.color === 'sparkling' && (
                          <div className="w-24">
                            <WineBottle 
                              color="sparkling" 
                              wineInfo={{
                                name: formData.name,
                                vintage: formData.vintage || undefined,
                                domain: formData.domain || undefined
                              }}
                              showLabel={true}
                              height={200}
                              imageUrl=""
                              onProcessedImage={() => {}}
                            />
                          </div>
                        )}
                        {formData.color === 'fortified' && (
                          <div className="w-24">
                            <WineBottle 
                              color="fortified" 
                              wineInfo={{
                                name: formData.name,
                                vintage: formData.vintage || undefined,
                                domain: formData.domain || undefined
                              }}
                              showLabel={true}
                              height={200}
                              imageUrl=""
                              onProcessedImage={() => {}}
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Prévisualisation de la bouteille</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Conseils pour les notes de dégustation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <SectionTitle icon={UtensilsCrossed} title="Conseils pour les notes" />
                
                <div className="text-xs text-gray-600 space-y-3">
                  <div>
                    <div className="font-medium text-gray-700 mb-1">ROBE :</div>
                    <p>Décrivez la couleur, l&apos;intensité, les reflets, la brillance, la limpidité et la viscosité du vin.</p>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-700 mb-1">NEZ :</div>
                    <p>Notez l&apos;intensité aromatique, les familles d&apos;arômes (fruits, fleurs, épices...), la complexité et l&apos;évolution.</p>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-700 mb-1">BOUCHE :</div>
                    <p>Décrivez l&apos;attaque, le milieu de bouche, la finale, les saveurs, la texture, les tanins, l&apos;acidité et l&apos;équilibre.</p>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-700 mb-1">POTENTIEL DE GARDE :</div>
                    <p>Estimez la durée pendant laquelle le vin pourra évoluer favorablement et la période optimale de dégustation.</p>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-700 mb-1">ACCORDS METS & VIN :</div>
                    <p>Suggérez des plats ou des types de cuisine qui s&apos;harmoniseront bien avec ce vin.</p>
                  </div>
                </div>
              </div>
              
              {/* Boutons d'action */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="space-y-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-red-800 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-300 flex items-center justify-center"
                    disabled={saving}
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                  
                  <Link
                    href={`/wines/${id}`}
                    className="w-full py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-300 flex items-center justify-center"
                  >
                    Annuler
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
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