import { StockDetailPage } from "@/components/features/FeaturePages";
import { AppShell } from "@/components/layout/AppShell";

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return (
    <AppShell>
      <StockDetailPage symbol={symbol.toUpperCase()} />
    </AppShell>
  );
}
