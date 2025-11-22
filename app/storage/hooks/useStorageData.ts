// File: app/storage/hooks/useStorageData.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import { StorageLocation, Position, Bottle, FilterOptions } from '@types';
import { useNotifications } from '@/hooks/useNotifications';

export const useStorageData = () => {
  const router = useRouter();
  const { showNotification } = useNotifications();
  
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [unassignedBottles, setUnassignedBottles] = useState<Bottle[]>([]);
  const [locationBottleCounts, setLocationBottleCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [positionLoading, setPositionLoading] = useState(false);
  
  // Utiliser useRef pour briser la dépendance circulaire
  const fetchPositionsAndBottlesRef = useRef<(locationId: string, filterOptions?: FilterOptions | null) => Promise<void> | undefined>(undefined);

  // Définir fetchPositionsAndBottles
  const fetchPositionsAndBottles = useCallback(async (locationId: string, filterOptions: FilterOptions | null = null) => {
    setPositionLoading(true);
    try {
      // Récupérer les positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('position')
        .select('*')
        .eq('storage_location_id', locationId)
        .order('row_position', { ascending: true })
        .order('column_position', { ascending: true });
      
      if (positionsError) throw positionsError;
      setPositions(positionsData || []);
      
      // Construction requête bouteilles
      let bottleQuery = supabase
        .from('bottle')
        .select(`*, wine:wine_id (*)`)
        .eq('status', 'in_stock');
      
      // Appliquer les filtres
      if (filterOptions) {
        if (filterOptions.colors && filterOptions.colors.length > 0) {
          bottleQuery = bottleQuery.in('wine.color', filterOptions.colors);
        }
        if (filterOptions.labels && filterOptions.labels.length > 0) {
          if (filterOptions.labels.includes('null')) {
            const labelsWithoutNull = filterOptions.labels.filter(l => l !== 'null');
            if (labelsWithoutNull.length > 0) {
              bottleQuery = bottleQuery.or(`label.is.null,label.in.(${labelsWithoutNull.join(',')})`);
            } else {
              bottleQuery = bottleQuery.is('label', null);
            }
          } else {
            bottleQuery = bottleQuery.in('label', filterOptions.labels);
          }
        }
        if (filterOptions.vintage) {
          if (filterOptions.vintage.min !== null) bottleQuery = bottleQuery.gte('wine.vintage', filterOptions.vintage.min);
          if (filterOptions.vintage.max !== null) bottleQuery = bottleQuery.lte('wine.vintage', filterOptions.vintage.max);
        }
        if (filterOptions.searchTerm) {
          bottleQuery = bottleQuery.or(
            `wine.name.ilike.%${filterOptions.searchTerm}%,wine.domain.ilike.%${filterOptions.searchTerm}%,
            wine.region.ilike.%${filterOptions.searchTerm}%,wine.appellation.ilike.%${filterOptions.searchTerm}%`
          );
        }
      }
      
      // Exécution de la requête pour les bouteilles
      const { data: bottlesData, error: bottlesError } = await bottleQuery; 
      if (bottlesError) throw bottlesError;
      
      // Filtrer bouteilles pour cet emplacement + ajouter info position
      const locationPositionIds = positionsData?.map(p => p.id) || [];
      const bottlesWithPosition = (bottlesData || [])
        .filter(bottle => bottle.position_id && locationPositionIds.includes(bottle.position_id))
        .map(bottle => ({
          ...bottle,
          position: positionsData?.find(pos => pos.id === bottle.position_id),
          wine: bottle.wine || undefined
        }));

      const generalStock = (bottlesData || [])
        .filter(bottle => !bottle.position_id && bottle.status === 'in_stock')
        .map(bottle => ({
          ...bottle,
          wine: bottle.wine || undefined
        }));

      setBottles(bottlesWithPosition as Bottle[]);
      setUnassignedBottles(generalStock as Bottle[]);
      setLocationBottleCounts(prev => ({
        ...prev,
        [locationId]: bottlesWithPosition.length
      }));
      
    } catch (error: unknown) { 
      console.error('Erreur chargement positions/bouteilles:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur chargement détails'}`,
        'error'
      );
    } finally {
      setPositionLoading(false);
    }
  }, [showNotification]);

  // Stocker la référence à la fonction fetchPositionsAndBottles
  useEffect(() => {
    fetchPositionsAndBottlesRef.current = fetchPositionsAndBottles;
  }, [fetchPositionsAndBottles]);
  
  // Charger les emplacements
  const fetchLocations = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('storage_location')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setLocations(data || []);
      if (data && data.length > 0 && !selectedLocation) {
        const firstLocation = data[0];
        setSelectedLocation(firstLocation);
        // Utiliser la référence pour éviter la dépendance circulaire
        if (fetchPositionsAndBottlesRef.current) {
          fetchPositionsAndBottlesRef.current(firstLocation.id);
        }
      }
      setLoading(false);
    } catch (error: unknown) {
      console.error('Exception fetchLocations:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur chargement emplacements'}`,
        'error'
      );
      setLoading(false);
    }
  }, [router, selectedLocation, showNotification]);

  // Supprimer un emplacement
  const deleteLocation = async (id: string, name: string) => {
    try {
      // Vérifier bouteilles dans l'emplacement
      const { data: positionIdsData } = await supabase
        .from('position').select('id').eq('storage_location_id', id);
      const positionIds = positionIdsData?.map(p => p.id) || [];

      let bottleCount = 0;
      let nonStockCount = 0;
      if (positionIds.length > 0) {
        const { data: bottlesInLocation, count, error: countError } = await supabase
          .from('bottle')
          .select('id,status', { count: 'exact' })
          .in('position_id', positionIds);

        if (countError) throw countError;
        bottleCount = count || 0;
        nonStockCount = (bottlesInLocation || []).filter(b => b.status !== 'in_stock').length;
      }

      // Confirmation utilisateur
      let confirmDelete = false;
      if (bottleCount > 0) {
        const warning = nonStockCount > 0
          ? `Attention: ${nonStockCount} bouteille(s) ne sont pas en stock (statut différent). Elles seront détachées avant suppression.\n\n`
          : '';
        confirmDelete = window.confirm(
          `${warning}Cet emplacement contient ${bottleCount} bouteille(s). Les déplacer vers le stock général et supprimer l'emplacement ?`
        );
        if (confirmDelete) {
          const { error: updateError } = await supabase
            .from('bottle').update({ position_id: null }).in('position_id', positionIds);
          if (updateError) throw updateError;
        }
      } else {
        confirmDelete = window.confirm(`Supprimer l'emplacement "${name}" (vide) ?`);
      }

      if (!confirmDelete) return;

      // Supprimer positions puis emplacement
      if (positionIds.length > 0) {
        const { error: positionError } = await supabase.from('position').delete().in('id', positionIds);
        if (positionError) console.error("Erreur suppression positions:", positionError); 
      }
      const { error } = await supabase.from('storage_location').delete().eq('id', id);
      if (error) throw error;
      
      // Mettre à jour l'état local
      const remainingLocations = locations.filter(location => location.id !== id);
      setLocations(remainingLocations);
      // Gérer la sélection si l'emplacement supprimé était sélectionné
      if (selectedLocation?.id === id) {
        const newSelected = remainingLocations[0] || null;
        setSelectedLocation(newSelected);
        if (newSelected && fetchPositionsAndBottlesRef.current) {
          fetchPositionsAndBottlesRef.current(newSelected.id);
        } else { 
          setPositions([]); 
          setBottles([]); 
        } 
      }
      
      showNotification('Emplacement supprimé', 'success');
    } catch (error: unknown) {
      console.error('Exception suppression:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur suppression'}`,
        'error'
      );
    }
  };

  return {
    locations,
    selectedLocation,
    setSelectedLocation,
    positions,
    bottles,
    unassignedBottles,
    locationBottleCounts,
    setBottles,
    loading,
    positionLoading,
    fetchLocations,
    fetchPositionsAndBottles: fetchPositionsAndBottlesRef.current || fetchPositionsAndBottles,
    deleteLocation
  };
};

// Ajout des imports manquants
import { useEffect } from 'react';