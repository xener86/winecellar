import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import Link from 'next/link';
import WineBarIcon from '@mui/icons-material/WineBar';

export default function MobileNavbar({ minimal = false }) {
  return (
    <AppBar position="static" sx={{ bgcolor: '#8B0000', boxShadow: 2 }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <WineBarIcon sx={{ mr: 1, fontSize: 28 }} />
          <Typography 
            variant="h6" 
            component={Link} 
            href="/" 
            sx={{ 
              textDecoration: 'none', 
              color: 'inherit',
              fontWeight: 600,
              letterSpacing: 1
            }}
          >
            WINECELLAR
          </Typography>
        </Box>
        {minimal && (
          <Button 
            component={Link}
            href="/storage"
            variant="text"
            color="inherit"
          >
            Retour
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}s