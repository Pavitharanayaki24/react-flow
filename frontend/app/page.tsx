// app/page.tsx
'use client';

import ArchPlanner from '../components/ArchPlanner';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="w-full h-screen">
        <ArchPlanner />
      </div>
    </main>
  );
}
