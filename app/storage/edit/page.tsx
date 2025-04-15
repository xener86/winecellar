'use client';

import React, { Suspense } from 'react';
import { CircularProgress, Container } from '@mui/material';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';

// Import dynamique du contenu principal pour éviter les problèmes avec useSearchParams
const StorageEditContent = dynamic(() => import('@/components/StorageEditContent'), {
  ssr: false,
  loading: () => (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '40vh', alignItems: 'center' }}>
        <CircularProgress />
      </div>
    </Container>
  )
});

// Composant principal avec Suspense
export default function StorageEditPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'center', minHeight: '40vh', alignItems: 'center' }}>
            <CircularProgress />
          </div>
        </Container>
      }>
        <StorageEditContent />
      </Suspense>
    </>
  );
}