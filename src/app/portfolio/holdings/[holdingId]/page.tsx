import { HoldingDetailPage } from "@/components/features/FeaturePages";
import { AppShell } from "@/components/layout/AppShell";

export default async function Page({ params }: { params: Promise<{ holdingId: string }> }) {
  const { holdingId } = await params;

  return (
    <AppShell>
      <HoldingDetailPage holdingId={holdingId} />
    </AppShell>
  );
}
