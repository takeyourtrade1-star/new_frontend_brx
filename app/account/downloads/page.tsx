import { DownloadsContent } from '@/components/feature/account/DownloadsContent';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';

export const metadata = {
  title: 'Downloads | Ebartex',
  description: 'Scarica fatture e documenti',
};

export default function DownloadsPage() {
  return (
    <>
      <PrestoInArrivoBanner />
      <div className="pointer-events-none opacity-60">
        <DownloadsContent />
      </div>
    </>
  );
}
