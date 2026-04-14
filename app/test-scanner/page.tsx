'use client';

import CardScanner from '@/components/CardScanner';

export default function TestScannerPage() {
  return (
    <div className="min-h-[100dvh] bg-zinc-950 md:p-4">
      <div className="mx-auto w-full md:max-w-2xl h-[100dvh] md:h-auto flex flex-col">
        <div className="px-4 pt-4 pb-2 md:px-0">
          <h1 className="text-white text-xl font-bold text-center">Card Scanner Test</h1>
        </div>

        <div className="flex-1 min-h-0 px-2 pb-2 md:px-0">
          <CardScanner 
            batchMode={true}
            onCapture={(img) => console.log('Captured:', img.substring(0, 50))}
            onBatchComplete={(batch) => console.log('Batch complete:', batch.length)}
          />
        </div>
      </div>
    </div>
  );
}
