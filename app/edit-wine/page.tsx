'use client';

import React, { Suspense } from 'react';
import { CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';

// Import dynamique du contenu principal avec désactivation du rendu côté serveur
const EditWineContent = dynamic(() => import('../components/EditWineContent'), {
  ssr: false,
  loading: () => (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-16">
      <div className="flex justify-center my-16">
        <CircularProgress />
      </div>
    </div>
  )
});

// Composant principal simple avec Suspense
export default function EditWinePage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-16">
          <div className="flex justify-center my-16">
            <CircularProgress />
          </div>
        </div>
      }>
        <EditWineContent />
      </Suspense>
    </>
  );
}