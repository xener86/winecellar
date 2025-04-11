'use client';

import { useParams } from 'next/navigation';
import TastingDetailPage from './TastingDetailPage';

export default function TastingDetailRoute() {
  const params = useParams();
  return <TastingDetailPage params={params} />;
}