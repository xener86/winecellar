'use client';

import React from 'react';
import { Container } from '@mui/material';
import Navbar from '../components/Navbar';
import WineLabelGenerator from '../components/WineLabelGenerator';

export default function GenerateLabelPage() {
  return (
    <>
      <Navbar />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <WineLabelGenerator />
      </Container>
    </>
  );
}

