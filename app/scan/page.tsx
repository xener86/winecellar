'use client';

import React, { Suspense } from 'react';
import { CircularProgress, Container } from '@mui/material';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';

// Import dynamique du contenu principal pour éviter les problèmes avec useSearchParams
const EditWineContent = dynamic(() => import('@/components/EditWineContent'), {
  ssr: false,
  loading: () => (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <div className="flex justify-center items-center min-h-[50vh]">
        <CircularProgress />
      </div>
    </Container>
  )
});

// Composant principal simple avec Suspense
export default function EditWinePage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <div className="flex justify-center items-center min-h-[50vh]">
            <CircularProgress />
          </div>
        </Container>
      }>
        <EditWineContent />
      </Suspense>
    </>
  );
}