import { Suspense } from 'react';
import ClientTrackView from './ClientTrackView';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl text-center">
          <h1 className="text-xl font-bold text-amber-400 mb-2">ROYAL RENT A CAR</h1>
          <p className="text-sm text-gray-400 animate-pulse">Loading tracking console...</p>
        </div>
      </div>
    }>
      <ClientTrackView token={resolvedParams.token} />
    </Suspense>
  );
}