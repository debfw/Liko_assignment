'use client';

import dynamic from 'next/dynamic';

const WorldMapDiagram = dynamic(() => import('@/components/WorldMapDiagram'), {
  ssr: false,
  loading: () => <div className="w-full h-screen flex items-center justify-center">Loading visualization...</div>
});

export default function Home() {
  return <WorldMapDiagram />;
}
