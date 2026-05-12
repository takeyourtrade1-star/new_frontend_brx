import { DisputeDetailContent } from '@/components/feature/dispute/DisputeDetailContent';

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = await params;
  const id = Number(disputeId);
  if (!Number.isFinite(id) || id <= 0) {
    return <div className="p-6 text-sm text-red-700">ID contestazione non valido.</div>;
  }
  return <DisputeDetailContent disputeId={id} />;
}
