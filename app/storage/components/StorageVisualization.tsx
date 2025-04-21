'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  useTheme,
} from '@mui/material';

import {
  Bottle,
  Position,
  StorageLocation,
  WineAgingInfo
} from '@/utils/types';

import LegendDisplay from './LegendDisplay';
import StatisticsPanel from './StatisticsPanel';
import QuickAddDialog from './QuickAddDialog';
import BottleCell from './BottleCell';

interface Props {
  selectedLocation: StorageLocation | null;
  positions: Position[];
  bottles: Bottle[];
  loading: boolean;
  currentTab: number;
  onTabChange: (e: React.SyntheticEvent, val: number) => void;
  displayMode: string;
  onDisplayModeChange: (e: React.MouseEvent<HTMLElement>, mode: string | null) => void;
  onPositionClick: (position: Position) => void;
  hoveredPositionInfo: { row: number; col: number } | null;
  onPositionHover: (info: { row: number; col: number } | null) => void;
  fetchBottles?: () => void;
}

const StorageVisualization: React.FC<Props> = ({
  selectedLocation,
  positions,
  bottles,
  loading,
  currentTab,
  onTabChange,
  displayMode,
  onDisplayModeChange,
  onPositionClick,
  hoveredPositionInfo,
  onPositionHover,
  fetchBottles
}) => {
  const theme = useTheme();
  const cellSize = 60;

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [filteredBottles, setFilteredBottles] = useState<Bottle[]>([]);
  const [agingInfo, setAgingInfo] = useState<Record<string, WineAgingInfo>>({});

  useEffect(() => {
    const fetchAgingInfo = async () => {
      const { default: WineAIService } = await import('@/services/WineAIService');
      const wineAIService = new WineAIService();

      const data: Record<string, WineAgingInfo> = {};

      for (const bottle of bottles) {
        const wine = bottle.wine;
        if (wine && wine.vintage !== null && wine.region !== null) {
          try {
            const info = await wineAIService.getAgingData(
              {
                name: wine.name,
                vintage: wine.vintage, // number
                color: wine.color,
                region: wine.region ?? undefined // string | undefined
              },
              { enhanceWithAI: false }
            );

            if (info) {
              data[bottle.id] = info;
            }
          } catch (err) {
            console.error(err);
          }
        }
      }

      setAgingInfo(data);
    };

    fetchAgingInfo();
  }, [bottles]);

  useEffect(() => {
    // Filtrer les bouteilles en fonction du mode d'affichage
    setFilteredBottles(bottles);
  }, [bottles, displayMode]);

  // Fonction explicitement définie pour gérer l'ajout d'une bouteille
  const handleBottleAdded = useCallback(() => {
    console.log("Bouteille ajoutée avec succès - handleBottleAdded dans StorageVisualization");
    // Rafraîchir les bouteilles si la fonction est disponible
    if (typeof fetchBottles === 'function') {
      fetchBottles();
    }
  }, [fetchBottles]);

  const getBottleAtPosition = (positionId: string): Bottle | null =>
    bottles.find((b) => b.position_id === positionId) || null;

  const getBottleStyle = (bottle: Bottle | null): React.CSSProperties => {
    if (!bottle || !bottle.wine) return {};
    const colorMap: Record<string, { bg: string; color: string }> = {
      red: { bg: '#8B0000', color: 'white' },
      white: { bg: '#F5F5DC', color: 'black' },
      rose: { bg: '#FFB6C1', color: 'black' },
      sparkling: { bg: '#B0C4DE', color: 'black' },
      fortified: { bg: '#8B4513', color: 'white' },
    };

    const style = colorMap[bottle.wine.color] || { bg: '#AAA', color: 'white' };

    return {
      borderRadius: '50%',
      background: style.bg,
      color: style.color,
      fontWeight: 'bold',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    };
  };

  const renderGrid = () => {
    if (!selectedLocation?.row_count || !selectedLocation?.column_count) return null;

    const rows = selectedLocation.row_count;
    const cols = selectedLocation.column_count;

    return (
      <Box maxWidth={Math.min(cols * (cellSize + 4), 1200)} mx="auto">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <Box key={rowIndex} display="flex" mb={0.5}>
            {Array.from({ length: cols }, (_, colIndex) => {
              const position = positions.find(
                (p) =>
                  p.row_position === rowIndex + 1 &&
                  p.column_position === colIndex + 1
              );

              const bottle = position ? getBottleAtPosition(position.id) : null;

              return (
                <BottleCell
                  key={`${rowIndex}-${colIndex}`}
                  bottle={bottle}
                  filteredBottles={filteredBottles}
                  hovered={
                    hoveredPositionInfo?.row === rowIndex + 1 &&
                    hoveredPositionInfo?.col === colIndex + 1
                  }
                  displayMode={displayMode}
                  onClick={() => {
                    if (position) {
                      if (bottle) {
                        onPositionClick(position);
                      } else {
                        setSelectedPosition(position);
                        setShowQuickAdd(true);
                      }
                    }
                  }}
                  onHover={(hovered) =>
                    onPositionHover(
                      hovered ? { row: rowIndex + 1, col: colIndex + 1 } : null
                    )
                  }
                  getBottleStyle={getBottleStyle}
                  agingInfo={agingInfo}
                />
              );
            })}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        height: '100%',
      }}
    >
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Tabs value={currentTab} onChange={onTabChange}>
          <Tab label="Vue Graphique" />
        </Tabs>
        
        {/* Menu de sélection du mode d'affichage */}
        <Box>
          <Tab 
            label={displayMode === 'default' ? 'Mode Couleur' : 
                  displayMode === 'temperature' ? 'Mode Température' : 
                  'Mode Étiquettes'}
            onClick={(e) => {
              // Rotation des modes d'affichage
              const modes = ['default', 'temperature', 'labels'];
              const currentIndex = modes.indexOf(displayMode);
              const nextIndex = (currentIndex + 1) % modes.length;
              onDisplayModeChange(e as React.MouseEvent<HTMLElement>, modes[nextIndex]);
            }}
            sx={{ minWidth: 'auto', opacity: 1 }}
          />
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <LegendDisplay displayMode={displayMode} />
          {renderGrid()}
          <StatisticsPanel
            selectedLocation={selectedLocation}
            bottles={bottles}
            positions={positions}
          />
          <QuickAddDialog
            open={showQuickAdd}
            onClose={() => setShowQuickAdd(false)}
            selectedPosition={selectedPosition}
            onBottleAdded={handleBottleAdded}
          />
        </>
      )}
    </Paper>
  );
};

export default StorageVisualization;