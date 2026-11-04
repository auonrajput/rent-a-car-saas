import ClientTrackView from './ClientTrackView';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  return <ClientTrackView token={resolvedParams.token} />;
}