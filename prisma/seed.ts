import { PrismaClient } from "@prisma/client";
import { alerts, brokerSetup, documents, holdings, stocks, transactions, watchlist } from "../src/lib/data";

const prisma = new PrismaClient();

async function main() {
  await prisma.aiAnalysis.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.document.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.dividend.deleteMany();
  await prisma.priceSnapshot.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.brokerSetup.deleteMany();

  const stockBySymbol = new Map<string, { id: string }>();
  for (const stock of stocks) {
    const created = await prisma.stock.create({
      data: {
        symbol: stock.symbol,
        company: stock.company,
        sector: stock.sector,
        price: stock.price,
        change: stock.change,
        volume: stock.volume,
        marketCap: stock.marketCap,
        dividendYield: stock.dividendYield,
        pe: stock.pe,
        roe: stock.roe,
        payoutRatio: stock.payoutRatio,
        opportunityScore: stock.opportunityScore,
        dividendScore: stock.dividendScore,
        valuationScore: stock.valuationScore,
        liquidityScore: stock.liquidityScore,
        riskScore: stock.riskScore,
        riskLevel: stock.riskLevel,
        label: stock.label,
        reason: stock.reason,
        snapshots: {
          create: stock.trend.slice(-4).map((price, index) => ({
            price,
            change: index === 0 ? 0 : price - stock.trend[index - 1],
            volume: stock.volume,
            source: "seed",
          })),
        },
        dividends: {
          create: {
            dividendYear: 2026,
            dividendType: "final",
            dividendPerShare: Number(((stock.price * stock.dividendYield) / 100).toFixed(2)),
            status: stock.dividendYield > 0 ? "expected" : "unknown",
          },
        },
      },
    });
    stockBySymbol.set(stock.symbol, created);
  }

  const broker = await prisma.brokerSetup.create({
    data: {
      brokerName: brokerSetup.brokerName,
      accountNickname: brokerSetup.accountNickname,
      cscsNumber: brokerSetup.cscsNumber,
      chn: brokerSetup.chn,
      checklistJson: JSON.stringify(brokerSetup.checklist),
    },
  });

  for (const item of watchlist) {
    const stock = stockBySymbol.get(item.symbol);
    if (stock) {
      await prisma.watchlistItem.create({
        data: { stockId: stock.id, targetPrice: item.targetPrice, note: item.note },
      });
    }
  }

  const holdingBySymbol = new Map<string, { id: string }>();
  for (const holding of holdings) {
    const stock = stockBySymbol.get(holding.symbol);
    const created = await prisma.holding.create({
      data: {
        stockId: stock?.id,
        brokerSetupId: broker.id,
        symbol: holding.symbol,
        company: holding.company,
        sector: holding.sector,
        quantity: holding.quantity,
        averagePrice: holding.averagePrice,
        currentPrice: holding.currentPrice,
        dividendsReceived: holding.dividendsReceived,
        expectedAnnualDividend: holding.expectedAnnualDividend,
        thesis: holding.thesis,
        tag: holding.tag,
        riskLevel: holding.riskLevel,
      },
    });
    holdingBySymbol.set(holding.symbol, created);
  }

  for (const transaction of transactions) {
    await prisma.transaction.create({
      data: {
        holdingId: holdingBySymbol.get(transaction.symbol)?.id,
        brokerSetupId: broker.id,
        date: new Date(transaction.date),
        symbol: transaction.symbol,
        type: transaction.type,
        quantity: transaction.quantity,
        price: transaction.price,
        charges: transaction.charges,
        netAmount: transaction.netAmount,
        reference: transaction.reference,
      },
    });
  }

  for (const document of documents) {
    await prisma.document.create({
      data: {
        title: document.title,
        documentType: document.type,
        brokerSetupId: broker.id,
        holdingId: document.relatedStock ? holdingBySymbol.get(document.relatedStock)?.id : undefined,
        relatedStock: document.relatedStock,
        documentDate: new Date(document.date),
        filePath: document.path,
      },
    });
  }

  for (const alert of alerts) {
    await prisma.alert.create({
      data: { title: alert.title, severity: alert.severity, detail: alert.detail },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
