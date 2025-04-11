'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  Divider,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox
} from '@mui/material';
import dynamic from 'next/dynamic';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import Navbar from '../components/Navbar';
import { supabase } from '../utils/supabase';

const QRCodeWrapper = dynamic(() => import('../components/QRCodeWrapper'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: 100,
        height: 100,
        background: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      Chargement...
    </div>
  )
});

// Types
type StorageLocation = {
  id: string;
  name: string;
  type: string;
};

type Position = {
  id: string;
  storage_location_id: string;
  row_position: number;
  column_position: number;
  qr_code: string | null;
};

export default function GenerateQRPage() {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [baseUrl, setBaseUrl] = useState(
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}/scan`
      : 'http://localhost:3000/scan'
  );
  const [qrSize, setQrSize] = useState<number>(100);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedCols, setSelectedCols] = useState<number[]>([]);
  const [selectedAll, setSelectedAll] = useState(true);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const qrCodesRef = useRef<HTMLDivElement>(null);
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchPositions(selectedLocation);
    }
  }, [selectedLocation]);

  const filterPositions = useCallback(() => {
    if (selectedAll) {
      setFilteredPositions(positions);
    } else {
      const filtered = positions.filter(
        pos =>
          selectedRows.includes(pos.row_position) &&
          selectedCols.includes(pos.column_position)
      );
      setFilteredPositions(filtered);
    }
  }, [positions, selectedRows, selectedCols, selectedAll]);

  useEffect(() => {
    filterPositions();
  }, [positions, selectedRows, selectedCols, selectedAll, filterPositions]);

  const fetchLocations = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('storage_location')
        .select('*')
        .order('name');
      if (error) throw error;

      setLocations(data || []);
      if (data && data.length > 0) {
        setSelectedLocation(data[0].id);
      }
      setLoading(false);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Exception:', err);
      setNotification({
        open: true,
        message: `Erreur: ${err.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const fetchPositions = async (locationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('position')
        .select('*')
        .eq('storage_location_id', locationId)
        .order('row_position', { ascending: true })
        .order('column_position', { ascending: true });
      if (error) throw error;

      setPositions(data || []);

      // Extraction des valeurs uniques pour les filtres
      if (data && data.length > 0) {
        const rows = Array.from(new Set(data.map(p => p.row_position))).sort(
          (a, b) => a - b
        );
        const cols = Array.from(new Set(data.map(p => p.column_position))).sort(
          (a, b) => a - b
        );
        setSelectedRows(rows);
        setSelectedCols(cols);
      }
      setLoading(false);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Exception:', err);
      setNotification({
        open: true,
        message: `Erreur: ${err.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const handleRowToggle = (row: number) => {
    if (selectedRows.includes(row)) {
      setSelectedRows(selectedRows.filter(r => r !== row));
    } else {
      setSelectedRows([...selectedRows, row].sort((a, b) => a - b));
    }
    setSelectedAll(false);
  };

  const handleColToggle = (col: number) => {
    if (selectedCols.includes(col)) {
      setSelectedCols(selectedCols.filter(c => c !== col));
    } else {
      setSelectedCols([...selectedCols, col].sort((a, b) => a - b));
    }
    setSelectedAll(false);
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectedAll;
    setSelectedAll(newSelectAll);
    if (!newSelectAll) {
      const rows = Array.from(new Set(positions.map(p => p.row_position))).sort(
        (a, b) => a - b
      );
      const cols = Array.from(new Set(positions.map(p => p.column_position))).sort(
        (a, b) => a - b
      );
      setSelectedRows(rows);
      setSelectedCols(cols);
    }
  };

  const printQRCodes = () => {
    if (!qrCodesRef.current || !isClient) return;
    const locationName =
      locations.find(l => l.id === selectedLocation)?.name || 'Cave à vin';
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Codes - ${locationName}</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { display: flex; flex-wrap: wrap; }
              .qr-item { 
                width: 33.33%; 
                box-sizing: border-box; 
                padding: 10px; 
                page-break-inside: avoid;
                text-align: center;
              }
              .qr-item svg { max-width: 100%; height: auto; }
              @media print {
                .qr-item { page-break-inside: avoid; }
                @page { size: A4; margin: 0.5cm; }
              }
            </style>
          </head>
          <body>
            <h1 style="text-align: center;">${locationName}</h1>
            <div class="container">
              ${qrCodesRef.current.innerHTML}
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
    }
  };

  const exportToPDF = async () => {
    if (!qrCodesRef.current) return;
    try {
      setNotification({
        open: true,
        message: 'Génération du PDF en cours...',
        severity: 'info'
      });

      const canvas = await html2canvas(qrCodesRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      const locationName =
        locations.find(l => l.id === selectedLocation)?.name || 'cave';
      pdf.save(`qrcodes-${locationName.toLowerCase().replace(/\s+/g, '-')}.pdf`);

      setNotification({
        open: true,
        message: 'PDF généré avec succès',
        severity: 'success'
      });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Erreur lors de la génération du PDF:', err);
      setNotification({
        open: true,
        message: `Erreur: ${err.message || 'Une erreur est survenue lors de la génération du PDF'}`,
        severity: 'error'
      });
    }
  };

  const renderQRCodes = () => {
    if (filteredPositions.length === 0) {
      return (
        <Box textAlign="center" p={4}>
          <Typography color="text.secondary">
            Aucune position à afficher. Veuillez sélectionner au moins une ligne et une colonne.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {filteredPositions.map(position => (
          <Grid item xs={12} sm={6} md={4} key={position.id}>
            <Card
              sx={{
                p: 2,
                textAlign: 'center',
                height: '100%',
                pageBreakInside: 'avoid'
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                Position {position.row_position}/{position.column_position}
              </Typography>
              <Box display="flex" justifyContent="center" my={2}>
                <QRCodeWrapper
                  value={`${baseUrl}?position=${position.id}`}
                  size={qrSize}
                  level="M"
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {locations.find(l => l.id === selectedLocation)?.name || 'Cave à vin'}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="500" gutterBottom>
          Génération de QR codes
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Générez des QR codes pour vos emplacements de stockage afin de faciliter la gestion de votre cave à vin.
        </Typography>
        <Grid container spacing={3}>
          {/* Section Options */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                height: '100%'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Options
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel id="location-select-label">Emplacement</InputLabel>
                <Select
                  labelId="location-select-label"
                  value={selectedLocation}
                  label="Emplacement"
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  disabled={loading}
                >
                  {locations.map(location => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="URL de base"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                margin="normal"
                helperText="URL de base pour les QR codes"
              />
              <TextField
                fullWidth
                label="Taille des QR codes"
                type="number"
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                margin="normal"
                InputProps={{ inputProps: { min: 50, max: 300 } }}
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Filtrer les positions
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Checkbox
                  checked={selectedAll}
                  onChange={handleSelectAll}
                  color="primary"
                />
                <Typography variant="body2">
                  Sélectionner tout
                </Typography>
              </Box>
              {!loading && (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Lignes</TableCell>
                        <TableCell>Colonnes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ verticalAlign: 'top' }}>
                          {Array.from(new Set(positions.map(p => p.row_position)))
                            .sort((a, b) => a - b)
                            .map(row => (
                              <Box key={row} display="flex" alignItems="center">
                                <Checkbox
                                  checked={selectedRows.includes(row)}
                                  onChange={() => handleRowToggle(row)}
                                  disabled={selectedAll}
                                  size="small"
                                />
                                <Typography variant="body2">
                                  {row}
                                </Typography>
                              </Box>
                            ))}
                        </TableCell>
                        <TableCell sx={{ verticalAlign: 'top' }}>
                          {Array.from(new Set(positions.map(p => p.column_position)))
                            .sort((a, b) => a - b)
                            .map(col => (
                              <Box key={col} display="flex" alignItems="center">
                                <Checkbox
                                  checked={selectedCols.includes(col)}
                                  onChange={() => handleColToggle(col)}
                                  disabled={selectedAll}
                                  size="small"
                                />
                                <Typography variant="body2">
                                  {col}
                                </Typography>
                              </Box>
                            ))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <Box mt={3}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<PrintIcon />}
                  onClick={printQRCodes}
                  disabled={loading || filteredPositions.length === 0}
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  Imprimer
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={exportToPDF}
                  disabled={loading || filteredPositions.length === 0}
                  sx={{ borderRadius: 2 }}
                >
                  Exporter en PDF
                </Button>
              </Box>
            </Paper>
          </Grid>
          {/* Section Aperçu */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  Aperçu ({filteredPositions.length} QR codes)
                </Typography>
                {selectedLocation && !loading && (
                  <Typography variant="subtitle2" color="text.secondary">
                    {locations.find(l => l.id === selectedLocation)?.name || 'Emplacement'}
                  </Typography>
                )}
              </Box>
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box ref={qrCodesRef}>
                  {renderQRCodes()}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setNotification({ ...notification, open: false })}
            severity={notification.severity}
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}
