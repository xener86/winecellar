/**
 * Cette fonction optimise le placement des bouteilles en utilisant un algorithme plus avancé
 * qui tente de regrouper les bouteilles du même vin ou de types similaires ensemble
 */
async function advancedOptimizePlacement() {
    try {
      // 1. Récupérer toutes les bouteilles non placées
      const { data: unpositionedBottles, error: bottlesError } = await supabase
        .from('bottle')
        .select(`
          id,
          wine_id,
          wine:wine_id (
            id,
            name,
            color,
            region,
            vintage
          )
        `)
        .eq('status', 'in_stock')
        .is('position_id', null);
      
      if (bottlesError) throw bottlesError;
      
      // 2. Récupérer toutes les positions disponibles
      const { data: availablePositionsData, error: positionsError } = await supabase
        .from('position')
        .select(`
          id,
          storage_location_id,
          row_position,
          column_position,
          storage_location:storage_location_id (
            id,
            name,
            type
          )
        `)
        .not('id', 'in', (supabase.from('bottle').select('position_id').not('position_id', 'is', null)));
      
      if (positionsError) throw positionsError;
      const availablePositions = availablePositionsData || [];
      
      if (unpositionedBottles.length === 0 || availablePositions.length === 0) {
        console.log('Rien à placer ou pas d\'emplacements disponibles');
        return { success: false, message: 'Rien à placer ou pas d\'emplacements disponibles' };
      }
      
      // 3. Analyser les bouteilles déjà placées pour comprendre l'organisation
      const { data: positionedBottles, error: positionedError } = await supabase
        .from('bottle')
        .select(`
          id,
          wine_id,
          position_id,
          wine:wine_id (
            id,
            name,
            color,
            region,
            vintage
          ),
          position:position_id (
            id,
            storage_location_id,
            row_position,
            column_position
          )
        `)
        .eq('status', 'in_stock')
        .not('position_id', 'is', null);
      
      if (positionedError) throw positionedError;
      
      // 4. Regrouper par emplacement et par vin
      const locationWineGroups = {};
      const colorGroups = {};
      const regionGroups = {};
      
      // Initialiser les groupes pour tous les emplacements
      availablePositions.forEach(pos => {
        const locationId = pos.storage_location_id;
        if (!locationWineGroups[locationId]) {
          locationWineGroups[locationId] = {};
          colorGroups[locationId] = {};
          regionGroups[locationId] = {};
        }
      });
      
      // Analyser les bouteilles déjà placées
      positionedBottles.forEach(bottle => {
        const locationId = bottle.position.storage_location_id;
        const wineId = bottle.wine_id;
        const color = bottle.wine.color;
        const region = bottle.wine.region;
        
        // Compter les bouteilles par vin dans chaque emplacement
        if (!locationWineGroups[locationId]) locationWineGroups[locationId] = {};
        if (!locationWineGroups[locationId][wineId]) locationWineGroups[locationId][wineId] = 0;
        locationWineGroups[locationId][wineId]++;
        
        // Compter les bouteilles par couleur dans chaque emplacement
        if (!colorGroups[locationId]) colorGroups[locationId] = {};
        if (!colorGroups[locationId][color]) colorGroups[locationId][color] = 0;
        colorGroups[locationId][color]++;
        
        // Compter les bouteilles par région dans chaque emplacement
        if (region) {
          if (!regionGroups[locationId]) regionGroups[locationId] = {};
          if (!regionGroups[locationId][region]) regionGroups[locationId][region] = 0;
          regionGroups[locationId][region]++;
        }
      });
      
      // 5. Calculer un score pour chaque emplacement et chaque bouteille
      const placements = [];
      
      for (const bottle of unpositionedBottles) {
        const wineId = bottle.wine_id;
        const color = bottle.wine.color;
        const region = bottle.wine.region;
        
        // Calculer un score pour chaque emplacement disponible
        const scores = [];
        
        for (const position of availablePositions) {
          const locationId = position.storage_location_id;
          let score = 0;
          
          // Bonus si le même vin existe déjà dans cet emplacement
          if (locationWineGroups[locationId]?.[wineId]) {
            score += 10 * locationWineGroups[locationId][wineId];
          }
          
          // Bonus si la même couleur est présente
          if (colorGroups[locationId]?.[color]) {
            score += 5 * colorGroups[locationId][color];
          }
          
          // Bonus si la même région est présente
          if (region && regionGroups[locationId]?.[region]) {
            score += 3 * regionGroups[locationId][region];
          }
          
          scores.push({
            bottle: bottle.id,
            position: position.id,
            score
          });
        }
        
        // Prendre la meilleure correspondance
        if (scores.length > 0) {
          const bestMatch = scores.sort((a, b) => b.score - a.score)[0];
          placements.push(bestMatch);
          
          // Retirer la position utilisée
          availablePositions.splice(
            availablePositions.findIndex(p => p.id === bestMatch.position),
            1
          );
          
          // Mettre à jour les compteurs pour les prochaines bouteilles
          const locationId = availablePositionsData.find(p => p.id === bestMatch.position).storage_location_id;
          
          if (!locationWineGroups[locationId][wineId]) locationWineGroups[locationId][wineId] = 0;
          locationWineGroups[locationId][wineId]++;
          
          if (!colorGroups[locationId][color]) colorGroups[locationId][color] = 0;
          colorGroups[locationId][color]++;
          
          if (region) {
            if (!regionGroups[locationId][region]) regionGroups[locationId][region] = 0;
            regionGroups[locationId][region]++;
          }
        }
      }
      
      // 6. Effectuer les mises à jour en base de données
      for (const placement of placements) {
        const { error } = await supabase
          .from('bottle')
          .update({ position_id: placement.position })
          .eq('id', placement.bottle);
        
        if (error) throw error;
      }
      
      return { 
        success: true, 
        count: placements.length,
        message: `${placements.length} bouteilles placées de manière optimisée` 
      };
    } catch (error) {
      console.error('Erreur lors de l\'optimisation avancée:', error);
      return { success: false, error: error.message };
    }
  }