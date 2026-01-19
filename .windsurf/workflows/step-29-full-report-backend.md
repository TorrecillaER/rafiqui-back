---
description: Crear endpoint para generar reporte ESG completo en PDF
---

# Step 29: Full ESG Report Backend - Generación de Reporte Completo PDF

Este workflow crea el endpoint en el backend NestJS para generar un reporte ESG completo y detallado en formato PDF.

## Diferencia entre Certificado y Reporte Completo

| Aspecto | Certificado ESG | Reporte Completo |
|---------|-----------------|------------------|
| Páginas | 1 página | 4-6 páginas |
| Contenido | Métricas resumen | Datos detallados + históricos |
| Uso | Presentación rápida | Auditoría / Análisis profundo |
| Tablas | No | Sí (paneles, materiales, órdenes) |
| Gráficas | No | Datos tabulares de 12 meses |
| Metodología | No | Sí (factores de conversión) |

---

## Elementos del Reporte Completo

### Página 1: Portada y Resumen Ejecutivo
- Logo y branding Rafiqui
- Título: "Reporte de Impacto ESG"
- Período del reporte
- Resumen de métricas principales (5 cards)

### Página 2: Detalle de Paneles Procesados
- Tabla con conteo por estado (AssetStatus)
- Estadísticas de inspección
- Paneles por marca/modelo (top 5)

### Página 3: Materiales Reciclados
- Tabla de materiales (Aluminio, Vidrio, Silicio, Cobre)
- Kg totales por tipo
- Valor estimado del inventario
- Stock disponible vs vendido

### Página 4: Datos Históricos (12 meses)
- Tabla mensual: Paneles | CO₂ | Energía
- Totales acumulados
- Tendencias (crecimiento %)

### Página 5: Operaciones y Transacciones
- Solicitudes de recolección (pendientes, completadas)
- Órdenes de materiales
- Órdenes de paneles
- Órdenes de arte
- Hashes de blockchain (últimos 10)

### Página 6: Metodología y Notas
- Factores de conversión utilizados
- Fuentes de datos (CRE, EPA, NREL)
- Disclaimer legal
- Fecha de generación

---

## Paso 1: Crear el servicio de reporte completo

Crear archivo `src/dashboard/full-report.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardMetricsService, DashboardMetrics, DashboardCharts } from './dashboard-metrics.service';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import { AssetStatus } from '@prisma/client';

export interface FullReportData {
  reportId: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  metrics: DashboardMetrics;
  charts: DashboardCharts;
  panelsByStatus: { status: string; count: number }[];
  panelsByBrand: { brand: string; count: number }[];
  materialsDetail: {
    type: string;
    totalKg: number;
    availableKg: number;
    soldKg: number;
    estimatedValue: number;
  }[];
  collectionStats: {
    total: number;
    pending: number;
    completed: number;
    inProgress: number;
  };
  recentTransactions: {
    type: string;
    id: string;
    date: Date;
    blockchainTxHash: string | null;
  }[];
  ordersSummary: {
    materialOrders: { total: number; completed: number; totalValue: number };
    panelOrders: { total: number; completed: number; totalValue: number };
    artOrders: { total: number; completed: number; totalValue: number };
  };
}

// Factores de conversión para la metodología
const METHODOLOGY = {
  CO2_PER_KWH: { value: 0.423, unit: 'kg CO₂/kWh', source: 'CRE/Semarnat México' },
  CO2_PER_KG_ALUMINUM: { value: 11.5, unit: 'kg CO₂/kg Al', source: 'EPA' },
  CO2_PER_TREE_YEAR: { value: 20, unit: 'kg CO₂/árbol/año', source: 'Arbor Day Foundation' },
  SOLAR_HOURS_PER_DAY: { value: 5.5, unit: 'horas', source: 'INEGI México' },
  WATER_PER_KWH: { value: 0.7, unit: 'L/kWh', source: 'NREL' },
  WATER_PER_KG_ALUMINUM: { value: 20, unit: 'L/kg Al', source: 'World Aluminum' },
  DEFAULT_PANEL_WATTS: { value: 300, unit: 'W', source: 'Promedio industria' },
  HOME_CONSUMPTION_KWH_YEAR: { value: 3000, unit: 'kWh/año', source: 'CFE México' },
};

@Injectable()
export class FullReportService {
  private readonly logger = new Logger(FullReportService.name);

  constructor(
    private prisma: PrismaService,
    private dashboardMetricsService: DashboardMetricsService,
  ) {}

  async generateReport(): Promise<Buffer> {
    const reportData = await this.gatherReportData();
    return this.createPDF(reportData);
  }

  private async gatherReportData(): Promise<FullReportData> {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Obtener métricas y gráficas
    const [metrics, charts] = await Promise.all([
      this.dashboardMetricsService.calculateMetrics(),
      this.dashboardMetricsService.calculateCharts(),
    ]);

    // Paneles por estado
    const panelsByStatus = await this.prisma.asset.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Paneles por marca (top 5)
    const panelsByBrand = await this.prisma.asset.groupBy({
      by: ['brand'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    // Detalle de materiales
    const materialStock = await this.prisma.materialStock.findMany();
    const recycleRecords = await this.prisma.recycleRecord.aggregate({
      _sum: {
        aluminumKg: true,
        glassKg: true,
        siliconKg: true,
        copperKg: true,
      },
    });

    // Estadísticas de recolección
    const collectionTotal = await this.prisma.collectionRequest.count();
    const collectionPending = await this.prisma.collectionRequest.count({
      where: { status: 'PENDING' },
    });
    const collectionCompleted = await this.prisma.collectionRequest.count({
      where: { status: 'COMPLETED' },
    });

    // Resumen de órdenes
    const materialOrdersAgg = await this.prisma.materialOrder.aggregate({
      _count: { id: true },
      _sum: { totalPrice: true },
    });
    const materialOrdersCompleted = await this.prisma.materialOrder.count({
      where: { status: 'COMPLETED' },
    });

    const panelOrdersAgg = await this.prisma.panelOrder.aggregate({
      _count: { id: true },
      _sum: { price: true },
    });
    const panelOrdersCompleted = await this.prisma.panelOrder.count({
      where: { status: 'COMPLETED' },
    });

    const artOrdersAgg = await this.prisma.artOrder.aggregate({
      _count: { id: true },
      _sum: { price: true },
    });
    const artOrdersCompleted = await this.prisma.artOrder.count({
      where: { status: 'COMPLETED' },
    });

    // Transacciones recientes con blockchain
    const recentRecycles = await this.prisma.recycleRecord.findMany({
      where: { blockchainTxHash: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, createdAt: true, blockchainTxHash: true },
    });

    const recentPanelOrders = await this.prisma.panelOrder.findMany({
      where: { blockchainTxHash: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, createdAt: true, blockchainTxHash: true },
    });

    return {
      reportId: `RAFIQUI-RPT-${uuidv4().substring(0, 8).toUpperCase()}`,
      generatedAt: now,
      period: { start: twelveMonthsAgo, end: now },
      metrics,
      charts,
      panelsByStatus: panelsByStatus.map((p) => ({
        status: p.status,
        count: p._count.id,
      })),
      panelsByBrand: panelsByBrand.map((p) => ({
        brand: p.brand || 'Sin marca',
        count: p._count.id,
      })),
      materialsDetail: [
        {
          type: 'Aluminio',
          totalKg: recycleRecords._sum.aluminumKg || 0,
          availableKg: materialStock.find((m) => m.type === 'ALUMINUM')?.availableKg || 0,
          soldKg: (recycleRecords._sum.aluminumKg || 0) - (materialStock.find((m) => m.type === 'ALUMINUM')?.availableKg || 0),
          estimatedValue: (materialStock.find((m) => m.type === 'ALUMINUM')?.availableKg || 0) * (materialStock.find((m) => m.type === 'ALUMINUM')?.pricePerKg || 2.8),
        },
        {
          type: 'Vidrio',
          totalKg: recycleRecords._sum.glassKg || 0,
          availableKg: materialStock.find((m) => m.type === 'GLASS')?.availableKg || 0,
          soldKg: (recycleRecords._sum.glassKg || 0) - (materialStock.find((m) => m.type === 'GLASS')?.availableKg || 0),
          estimatedValue: (materialStock.find((m) => m.type === 'GLASS')?.availableKg || 0) * (materialStock.find((m) => m.type === 'GLASS')?.pricePerKg || 0.45),
        },
        {
          type: 'Silicio',
          totalKg: recycleRecords._sum.siliconKg || 0,
          availableKg: materialStock.find((m) => m.type === 'SILICON')?.availableKg || 0,
          soldKg: (recycleRecords._sum.siliconKg || 0) - (materialStock.find((m) => m.type === 'SILICON')?.availableKg || 0),
          estimatedValue: (materialStock.find((m) => m.type === 'SILICON')?.availableKg || 0) * (materialStock.find((m) => m.type === 'SILICON')?.pricePerKg || 15),
        },
        {
          type: 'Cobre',
          totalKg: recycleRecords._sum.copperKg || 0,
          availableKg: materialStock.find((m) => m.type === 'COPPER')?.availableKg || 0,
          soldKg: (recycleRecords._sum.copperKg || 0) - (materialStock.find((m) => m.type === 'COPPER')?.availableKg || 0),
          estimatedValue: (materialStock.find((m) => m.type === 'COPPER')?.availableKg || 0) * (materialStock.find((m) => m.type === 'COPPER')?.pricePerKg || 8.5),
        },
      ],
      collectionStats: {
        total: collectionTotal,
        pending: collectionPending,
        completed: collectionCompleted,
        inProgress: collectionTotal - collectionPending - collectionCompleted,
      },
      recentTransactions: [
        ...recentRecycles.map((r) => ({
          type: 'Reciclaje',
          id: r.id.substring(0, 8),
          date: r.createdAt,
          blockchainTxHash: r.blockchainTxHash,
        })),
        ...recentPanelOrders.map((o) => ({
          type: 'Venta Panel',
          id: o.id.substring(0, 8),
          date: o.createdAt,
          blockchainTxHash: o.blockchainTxHash,
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10),
      ordersSummary: {
        materialOrders: {
          total: materialOrdersAgg._count.id,
          completed: materialOrdersCompleted,
          totalValue: materialOrdersAgg._sum.totalPrice || 0,
        },
        panelOrders: {
          total: panelOrdersAgg._count.id,
          completed: panelOrdersCompleted,
          totalValue: panelOrdersAgg._sum.price || 0,
        },
        artOrders: {
          total: artOrdersAgg._count.id,
          completed: artOrdersCompleted,
          totalValue: artOrdersAgg._sum.price || 0,
        },
      },
    };
  }

  private createPDF(data: FullReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'portrait',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const primaryColor = '#E6086A';
      const secondaryColor = '#93E1D8';
      const darkColor = '#102038';
      const grayColor = '#6B7280';

      // ========== PÁGINA 1: PORTADA Y RESUMEN ==========
      this.drawHeader(doc, 'REPORTE DE IMPACTO ESG', darkColor, secondaryColor);
      
      doc.moveDown(2);
      doc.fontSize(12)
         .fillColor(grayColor)
         .text(`Reporte N° ${data.reportId}`, { align: 'center' });
      doc.text(`Período: ${this.formatDate(data.period.start)} - ${this.formatDate(data.period.end)}`, { align: 'center' });
      doc.text(`Generado: ${this.formatDate(data.generatedAt)}`, { align: 'center' });

      doc.moveDown(2);
      doc.fontSize(16)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text('Resumen Ejecutivo', { align: 'left' });
      
      doc.moveDown(1);
      
      // Métricas en grid
      const metricsY = doc.y;
      this.drawMetricCard(doc, 55, metricsY, 150, 60, {
        value: `${data.metrics.co2Saved.value} ${data.metrics.co2Saved.unit}`,
        label: 'CO₂ Ahorrado',
        color: '#10B981',
      });
      this.drawMetricCard(doc, 215, metricsY, 150, 60, {
        value: `${data.metrics.treesEquivalent.value}`,
        label: 'Árboles Equivalentes',
        color: '#059669',
      });
      this.drawMetricCard(doc, 375, metricsY, 150, 60, {
        value: `${data.metrics.energyRecovered.value} ${data.metrics.energyRecovered.unit}`,
        label: 'Energía Recuperada',
        color: '#F59E0B',
      });

      doc.y = metricsY + 70;
      this.drawMetricCard(doc, 135, doc.y, 150, 60, {
        value: `${data.metrics.waterSaved.value} ${data.metrics.waterSaved.unit}`,
        label: 'Agua Ahorrada',
        color: '#0EA5E9',
      });
      this.drawMetricCard(doc, 295, doc.y, 150, 60, {
        value: `${data.metrics.panelsProcessed.total}`,
        label: 'Paneles Procesados',
        color: '#8B5CF6',
      });

      this.drawFooter(doc, 1, darkColor);

      // ========== PÁGINA 2: DETALLE DE PANELES ==========
      doc.addPage();
      this.drawHeader(doc, 'DETALLE DE PANELES', darkColor, secondaryColor);

      doc.moveDown(2);
      doc.fontSize(14)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text('Paneles por Estado');
      
      doc.moveDown(0.5);
      this.drawTable(doc, data.panelsByStatus.map((p) => [
        this.translateStatus(p.status),
        p.count.toString(),
      ]), ['Estado', 'Cantidad'], [350, 100]);

      doc.moveDown(2);
      doc.fontSize(14)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text('Top 5 Marcas');
      
      doc.moveDown(0.5);
      this.drawTable(doc, data.panelsByBrand.map((p) => [
        p.brand,
        p.count.toString(),
      ]), ['Marca', 'Cantidad'], [350, 100]);

      this.drawFooter(doc, 2, darkColor);

      // ========== PÁGINA 3: MATERIALES RECICLADOS ==========
      doc.addPage();
      this.drawHeader(doc, 'MATERIALES RECICLADOS', darkColor, secondaryColor);

      doc.moveDown(2);
      doc.fontSize(14)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text('Inventario de Materiales');
      
      doc.moveDown(0.5);
      this.drawTable(doc, data.materialsDetail.map((m) => [
        m.type,
        `${m.totalKg.toFixed(1)} kg`,
        `${m.availableKg.toFixed(1)} kg`,
        `${m.soldKg.toFixed(1)} kg`,
        `$${m.estimatedValue.toFixed(2)}`,
      ]), ['Material', 'Total', 'Disponible', 'Vendido', 'Valor Est.'], [100, 80, 90, 80, 100]);

      const totalValue = data.materialsDetail.reduce((sum, m) => sum + m.estimatedValue, 0);
      doc.moveDown(1);
      doc.fontSize(12)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text(`Valor Total del Inventario: $${totalValue.toFixed(2)} USD`, { align: 'right' });

      this.drawFooter(doc, 3, darkColor);

      // ========== PÁGINA 4: DATOS HISTÓRICOS ==========
      doc.addPage();
      this.drawHeader(doc, 'DATOS HISTÓRICOS (12 MESES)', darkColor, secondaryColor);

      doc.moveDown(2);
      doc.fontSize(14)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text('Evolución Mensual');
      
      doc.moveDown(0.5);
      const monthlyRows = data.charts.panelsByMonth.map((p, i) => [
        p.month,
        p.value.toString(),
        `${data.charts.co2ByMonth[i]?.value || 0} kg`,
        `${data.charts.energyByMonth[i]?.value || 0} kWh`,
      ]);
      this.drawTable(doc, monthlyRows, ['Mes', 'Paneles', 'CO₂', 'Energía'], [100, 100, 120, 130]);

      // Totales
      const totalPanels = data.charts.panelsByMonth.reduce((sum, p) => sum + p.value, 0);
      const totalCO2 = data.charts.co2ByMonth.reduce((sum, p) => sum + p.value, 0);
      const totalEnergy = data.charts.energyByMonth.reduce((sum, p) => sum + p.value, 0);

      doc.moveDown(1);
      doc.fontSize(11)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text(`Totales: ${totalPanels} paneles | ${totalCO2} kg CO₂ | ${totalEnergy} kWh`);

      this.drawFooter(doc, 4, darkColor);

      // ========== PÁGINA 5: OPERACIONES ==========
      doc.addPage();
      this.drawHeader(doc, 'OPERACIONES Y TRANSACCIONES', darkColor, secondaryColor);

      doc.moveDown(2);
      doc.fontSize(14)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text('Solicitudes de Recolección');
      
      doc.moveDown(0.5);
      this.drawTable(doc, [
        ['Total', data.collectionStats.total.toString()],
        ['Pendientes', data.collectionStats.pending.toString()],
        ['En Progreso', data.collectionStats.inProgress.toString()],
        ['Completadas', data.collectionStats.completed.toString()],
      ], ['Estado', 'Cantidad'], [350, 100]);

      doc.moveDown(2);
      doc.fontSize(14)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text('Resumen de Órdenes');
      
      doc.moveDown(0.5);
      this.drawTable(doc, [
        ['Materiales', data.ordersSummary.materialOrders.total.toString(), data.ordersSummary.materialOrders.completed.toString(), `$${data.ordersSummary.materialOrders.totalValue.toFixed(2)}`],
        ['Paneles', data.ordersSummary.panelOrders.total.toString(), data.ordersSummary.panelOrders.completed.toString(), `$${data.ordersSummary.panelOrders.totalValue.toFixed(2)}`],
        ['Arte', data.ordersSummary.artOrders.total.toString(), data.ordersSummary.artOrders.completed.toString(), `$${data.ordersSummary.artOrders.totalValue.toFixed(2)}`],
      ], ['Tipo', 'Total', 'Completadas', 'Valor'], [120, 80, 100, 150]);

      if (data.recentTransactions.length > 0) {
        doc.moveDown(2);
        doc.fontSize(14)
           .fillColor(darkColor)
           .font('Helvetica-Bold')
           .text('Transacciones Blockchain Recientes');
        
        doc.moveDown(0.5);
        this.drawTable(doc, data.recentTransactions.slice(0, 5).map((t) => [
          t.type,
          t.id,
          this.formatDate(t.date),
          t.blockchainTxHash ? `${t.blockchainTxHash.substring(0, 16)}...` : 'N/A',
        ]), ['Tipo', 'ID', 'Fecha', 'TX Hash'], [80, 80, 100, 190]);
      }

      this.drawFooter(doc, 5, darkColor);

      // ========== PÁGINA 6: METODOLOGÍA ==========
      doc.addPage();
      this.drawHeader(doc, 'METODOLOGÍA Y NOTAS', darkColor, secondaryColor);

      doc.moveDown(2);
      doc.fontSize(14)
         .fillColor(darkColor)
         .font('Helvetica-Bold')
         .text('Factores de Conversión Utilizados');
      
      doc.moveDown(0.5);
      const methodologyRows = Object.entries(METHODOLOGY).map(([key, val]) => [
        key.replace(/_/g, ' '),
        `${val.value} ${val.unit}`,
        val.source,
      ]);
      this.drawTable(doc, methodologyRows, ['Factor', 'Valor', 'Fuente'], [180, 120, 150]);

      doc.moveDown(2);
      doc.fontSize(10)
         .fillColor(grayColor)
         .font('Helvetica')
         .text('DISCLAIMER: Este reporte es generado automáticamente con datos verificados en blockchain. Las métricas ESG son estimaciones basadas en factores de conversión estándar de la industria y pueden variar según condiciones específicas.', {
           align: 'justify',
           width: 450,
         });

      doc.moveDown(1);
      doc.text('Los datos de este reporte son propiedad de Rafiqui y están protegidos por derechos de autor. Se permite su uso para fines de auditoría y reportes de sostenibilidad corporativa.', {
        align: 'justify',
        width: 450,
      });

      this.drawFooter(doc, 6, darkColor);

      doc.end();
    });
  }

  private drawHeader(doc: PDFKit.PDFDocument, title: string, darkColor: string, secondaryColor: string) {
    doc.rect(0, 0, doc.page.width, 80).fill(darkColor);
    doc.fontSize(22)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text(title, 50, 30, { align: 'center' });
    doc.fontSize(10)
       .fillColor(secondaryColor)
       .text('Rafiqui - Economía Circular para Paneles Solares', 50, 55, { align: 'center' });
  }

  private drawFooter(doc: PDFKit.PDFDocument, pageNum: number, darkColor: string) {
    const y = doc.page.height - 40;
    doc.fontSize(9)
       .fillColor('#9CA3AF')
       .text(`Página ${pageNum}`, 50, y, { align: 'center' });
    doc.text('www.rafiqui.com', 50, y + 12, { align: 'center' });
  }

  private drawMetricCard(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    metric: { value: string; label: string; color: string }
  ) {
    doc.roundedRect(x, y, width, height, 6)
       .fillAndStroke('#F8FAFC', '#E2E8F0');
    doc.rect(x, y, 4, height).fill(metric.color);

    doc.fontSize(14)
       .fillColor('#1F2937')
       .font('Helvetica-Bold')
       .text(metric.value, x + 12, y + 12, { width: width - 20 });

    doc.fontSize(9)
       .fillColor('#6B7280')
       .font('Helvetica')
       .text(metric.label, x + 12, y + 32, { width: width - 20 });
  }

  private drawTable(
    doc: PDFKit.PDFDocument,
    rows: string[][],
    headers: string[],
    colWidths: number[]
  ) {
    const startX = 55;
    let y = doc.y;
    const rowHeight = 20;
    const headerHeight = 25;

    // Header
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), headerHeight)
       .fill('#102038');
    
    let x = startX;
    headers.forEach((header, i) => {
      doc.fontSize(9)
         .fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .text(header, x + 5, y + 7, { width: colWidths[i] - 10 });
      x += colWidths[i];
    });

    y += headerHeight;

    // Rows
    rows.forEach((row, rowIndex) => {
      const bgColor = rowIndex % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
         .fill(bgColor);

      x = startX;
      row.forEach((cell, i) => {
        doc.fontSize(9)
           .fillColor('#374151')
           .font('Helvetica')
           .text(cell, x + 5, y + 5, { width: colWidths[i] - 10 });
        x += colWidths[i];
      });

      y += rowHeight;
    });

    doc.y = y + 5;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      PENDING_COLLECTION: 'Pendiente Recolección',
      IN_TRANSIT: 'En Tránsito',
      WAREHOUSE_RECEIVED: 'Recibido en Almacén',
      INSPECTING: 'En Inspección',
      INSPECTED: 'Inspeccionado',
      RECYCLED: 'Reciclado',
      REUSED: 'Reusado',
      READY_FOR_REUSE: 'Listo para Reuso',
      REFURBISHING: 'En Reacondicionamiento',
      LISTED_FOR_SALE: 'En Venta',
      ART_CANDIDATE: 'Candidato Arte',
      ART_LISTED_FOR_SALE: 'Arte en Venta',
    };
    return translations[status] || status;
  }
}
```

---

## Paso 2: Crear el DTO de respuesta

Crear archivo `src/dashboard/dto/full-report-response.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class FullReportResponseDto {
  @ApiProperty({
    description: 'Unique report identifier',
    example: 'RAFIQUI-RPT-A1B2C3D4',
  })
  reportId: string;

  @ApiProperty({
    description: 'Report generation date',
    example: '2025-01-15T19:35:00.000Z',
  })
  generatedAt: Date;

  @ApiProperty({
    description: 'PDF file as base64 encoded string',
  })
  pdfBase64: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 125678,
  })
  fileSizeBytes: number;

  @ApiProperty({
    description: 'Number of pages in the report',
    example: 6,
  })
  pageCount: number;
}
```

---

## Paso 3: Actualizar el controlador del dashboard

Agregar el nuevo endpoint en `src/dashboard/dashboard.controller.ts`:

```typescript
import { FullReportService } from './full-report.service';
import { FullReportResponseDto } from './dto/full-report-response.dto';

// En el constructor agregar:
constructor(
  private metricsService: DashboardMetricsService,
  private certificateService: EsgCertificateService,
  private fullReportService: FullReportService,  // Agregar
) {}

// Agregar el nuevo endpoint:
@Get('full-report')
@ApiOperation({ 
  summary: 'Generar reporte ESG completo en PDF',
  description: 'Genera un reporte PDF detallado de 6 páginas con métricas ESG, paneles, materiales, históricos y metodología.'
})
@ApiResponse({ 
  status: 200, 
  description: 'Reporte generado exitosamente',
  type: FullReportResponseDto 
})
async generateFullReport(): Promise<FullReportResponseDto> {
  const pdfBuffer = await this.fullReportService.generateReport();
  const reportId = `RAFIQUI-RPT-${Date.now().toString(36).toUpperCase()}`;

  return {
    reportId,
    generatedAt: new Date(),
    pdfBase64: pdfBuffer.toString('base64'),
    fileSizeBytes: pdfBuffer.length,
    pageCount: 6,
  };
}
```

---

## Paso 4: Actualizar el módulo del dashboard

Modificar `src/dashboard/dashboard.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardMetricsService } from './dashboard-metrics.service';
import { EsgCertificateService } from './esg-certificate.service';
import { FullReportService } from './full-report.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardMetricsService, EsgCertificateService, FullReportService],
  exports: [DashboardMetricsService],
})
export class DashboardModule {}
```

---

## Paso 5: Probar el endpoint

```bash
curl http://localhost:4000/dashboard/full-report | jq '.reportId, .pageCount, .fileSizeBytes'
```

---

## Estructura del Reporte (6 páginas)

```
┌─────────────────────────────────────────────┐
│  PÁGINA 1: PORTADA Y RESUMEN EJECUTIVO      │
│  - Header con branding                      │
│  - Número de reporte y período              │
│  - 5 métricas principales en cards          │
├─────────────────────────────────────────────┤
│  PÁGINA 2: DETALLE DE PANELES               │
│  - Tabla: Paneles por estado                │
│  - Tabla: Top 5 marcas                      │
├─────────────────────────────────────────────┤
│  PÁGINA 3: MATERIALES RECICLADOS            │
│  - Tabla: Inventario (Al, Vidrio, Si, Cu)   │
│  - Total, Disponible, Vendido, Valor        │
├─────────────────────────────────────────────┤
│  PÁGINA 4: DATOS HISTÓRICOS                 │
│  - Tabla: 12 meses de datos                 │
│  - Paneles, CO₂, Energía por mes            │
├─────────────────────────────────────────────┤
│  PÁGINA 5: OPERACIONES                      │
│  - Solicitudes de recolección               │
│  - Resumen de órdenes                       │
│  - Transacciones blockchain recientes       │
├─────────────────────────────────────────────┤
│  PÁGINA 6: METODOLOGÍA                      │
│  - Factores de conversión                   │
│  - Fuentes de datos                         │
│  - Disclaimer legal                         │
└─────────────────────────────────────────────┘
```
