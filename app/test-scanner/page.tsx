'use client';

import CardScanner from '@/components/CardScanner';

export default function TestScannerPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      <h1 className="text-white text-xl font-bold mb-4 text-center">Card Scanner Test</h1>
      <CardScanner 
        batchMode={true}
        onCapture={(img) => console.log('Captured:', img.substring(0, 50))}
        onBatchComplete={(batch) => console.log('Batch complete:', batch.length)}
      />
    </div>
  );
}
