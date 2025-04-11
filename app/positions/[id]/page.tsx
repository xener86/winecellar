import PositionsView from './PositionsView';

// La fonction Page devient 'async' et on type 'params' comme une Promise
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  
  // On attend la résolution de la Promise pour obtenir l'objet params
  const resolvedParams = await params; 
  
  // On passe l'objet résolu (qui est bien de type { id: string }) au composant enfant
  return <PositionsView params={resolvedParams} />; 
}