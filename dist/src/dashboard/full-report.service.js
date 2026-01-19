"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var FullReportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullReportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dashboard_metrics_service_1 = require("./dashboard-metrics.service");
const pdfkit_1 = __importDefault(require("pdfkit"));
const uuid_1 = require("uuid");
const METHODOLOGY = {
    CO2_PER_KWH: { value: 0.423, unit: 'kg CO2/kWh', source: 'CRE/Semarnat Mexico' },
    CO2_PER_KG_ALUMINUM: { value: 11.5, unit: 'kg CO2/kg Al', source: 'EPA' },
    CO2_PER_TREE_YEAR: { value: 20, unit: 'kg CO2/arbol/ano', source: 'Arbor Day Foundation' },
    SOLAR_HOURS_PER_DAY: { value: 5.5, unit: 'horas', source: 'INEGI Mexico' },
    WATER_PER_KWH: { value: 0.7, unit: 'L/kWh', source: 'NREL' },
    WATER_PER_KG_ALUMINUM: { value: 20, unit: 'L/kg Al', source: 'World Aluminum' },
    DEFAULT_PANEL_WATTS: { value: 300, unit: 'W', source: 'Promedio industria' },
    HOME_CONSUMPTION_KWH_YEAR: { value: 3000, unit: 'kWh/ano', source: 'CFE Mexico' },
};
let FullReportService = FullReportService_1 = class FullReportService {
    prisma;
    dashboardMetricsService;
    logger = new common_1.Logger(FullReportService_1.name);
    constructor(prisma, dashboardMetricsService) {
        this.prisma = prisma;
        this.dashboardMetricsService = dashboardMetricsService;
    }
    async generateReport() {
        const reportData = await this.gatherReportData();
        return this.createPDF(reportData);
    }
    async gatherReportData() {
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const [metrics, charts] = await Promise.all([
            this.dashboardMetricsService.calculateMetrics(),
            this.dashboardMetricsService.calculateCharts(),
        ]);
        const panelsByStatus = await this.prisma.asset.groupBy({
            by: ['status'],
            _count: { id: true },
        });
        const panelsByBrand = await this.prisma.asset.groupBy({
            by: ['brand'],
            _count: { id: true },
            where: { brand: { not: null } },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });
        const materialStock = await this.prisma.materialStock.findMany();
        const recycleRecords = await this.prisma.recycleRecord.aggregate({
            _sum: {
                aluminumKg: true,
                glassKg: true,
                siliconKg: true,
                copperKg: true,
            },
        });
        const collectionTotal = await this.prisma.collectionRequest.count();
        const collectionPending = await this.prisma.collectionRequest.count({
            where: { status: 'PENDING' },
        });
        const collectionCompleted = await this.prisma.collectionRequest.count({
            where: { status: 'COMPLETED' },
        });
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
        const recentTransactions = [
            ...recentRecycles.map(r => ({
                type: 'Reciclaje',
                id: r.id,
                date: r.createdAt,
                blockchainTxHash: r.blockchainTxHash,
            })),
            ...recentPanelOrders.map(p => ({
                type: 'Venta Panel',
                id: p.id,
                date: p.createdAt,
                blockchainTxHash: p.blockchainTxHash,
            })),
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
        const aluminumStock = materialStock.find(m => m.type === 'ALUMINUM');
        const glassStock = materialStock.find(m => m.type === 'GLASS');
        const siliconStock = materialStock.find(m => m.type === 'SILICON');
        const copperStock = materialStock.find(m => m.type === 'COPPER');
        return {
            reportId: `RAFIQUI-RPT-${(0, uuid_1.v4)().substring(0, 8).toUpperCase()}`,
            generatedAt: now,
            period: { start: twelveMonthsAgo, end: now },
            metrics,
            charts,
            panelsByStatus: panelsByStatus.map(p => ({
                status: p.status,
                count: p._count.id,
            })),
            panelsByBrand: panelsByBrand.map(p => ({
                brand: p.brand || 'Sin marca',
                count: p._count.id,
            })),
            materialsDetail: [
                {
                    type: 'Aluminio',
                    totalKg: recycleRecords._sum.aluminumKg || 0,
                    availableKg: aluminumStock?.availableKg || 0,
                    soldKg: (recycleRecords._sum.aluminumKg || 0) - (aluminumStock?.availableKg || 0),
                    estimatedValue: (aluminumStock?.availableKg || 0) * (aluminumStock?.pricePerKg || 2.8),
                },
                {
                    type: 'Vidrio',
                    totalKg: recycleRecords._sum.glassKg || 0,
                    availableKg: glassStock?.availableKg || 0,
                    soldKg: (recycleRecords._sum.glassKg || 0) - (glassStock?.availableKg || 0),
                    estimatedValue: (glassStock?.availableKg || 0) * (glassStock?.pricePerKg || 0.15),
                },
                {
                    type: 'Silicio',
                    totalKg: recycleRecords._sum.siliconKg || 0,
                    availableKg: siliconStock?.availableKg || 0,
                    soldKg: (recycleRecords._sum.siliconKg || 0) - (siliconStock?.availableKg || 0),
                    estimatedValue: (siliconStock?.availableKg || 0) * (siliconStock?.pricePerKg || 15.0),
                },
                {
                    type: 'Cobre',
                    totalKg: recycleRecords._sum.copperKg || 0,
                    availableKg: copperStock?.availableKg || 0,
                    soldKg: (recycleRecords._sum.copperKg || 0) - (copperStock?.availableKg || 0),
                    estimatedValue: (copperStock?.availableKg || 0) * (copperStock?.pricePerKg || 8.5),
                },
            ],
            collectionStats: {
                total: collectionTotal,
                pending: collectionPending,
                completed: collectionCompleted,
                inProgress: collectionTotal - collectionPending - collectionCompleted,
            },
            recentTransactions,
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
    createPDF(data) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({
                size: 'A4',
                layout: 'portrait',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
            });
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            const primaryColor = '#E6086A';
            const secondaryColor = '#93E1D8';
            const darkColor = '#102038';
            const pageWidth = doc.page.width;
            const contentWidth = pageWidth - 100;
            this.renderCoverPage(doc, data, primaryColor, secondaryColor, darkColor, pageWidth, contentWidth);
            doc.addPage();
            this.renderPanelsDetailPage(doc, data, primaryColor, darkColor, contentWidth);
            doc.addPage();
            this.renderMaterialsPage(doc, data, primaryColor, darkColor, contentWidth);
            doc.addPage();
            this.renderHistoricalDataPage(doc, data, primaryColor, darkColor, contentWidth);
            doc.addPage();
            this.renderOperationsPage(doc, data, primaryColor, darkColor, contentWidth);
            doc.addPage();
            this.renderMethodologyPage(doc, data, primaryColor, darkColor, contentWidth, pageWidth);
            doc.end();
        });
    }
    renderCoverPage(doc, data, primaryColor, secondaryColor, darkColor, pageWidth, contentWidth) {
        doc.rect(0, 0, pageWidth, 150).fill(darkColor);
        doc.fontSize(32)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text('REPORTE DE IMPACTO ESG', 50, 50, { width: contentWidth, align: 'center' });
        doc.fontSize(16)
            .fillColor(secondaryColor)
            .text('Economia Circular para Paneles Solares', 50, 95, { width: contentWidth, align: 'center' });
        doc.fontSize(10)
            .fillColor('#FFFFFF')
            .text(`ID: ${data.reportId}`, 50, 125, { width: contentWidth, align: 'center' });
        doc.y = 180;
        doc.fontSize(12)
            .fillColor(darkColor)
            .font('Helvetica')
            .text(`Periodo: ${data.period.start.toLocaleDateString('es-MX')} - ${data.period.end.toLocaleDateString('es-MX')}`, 50, doc.y, { width: contentWidth, align: 'center' });
        doc.moveDown(2);
        doc.fontSize(16)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('Resumen Ejecutivo', 50, doc.y, { width: contentWidth, align: 'center' });
        doc.moveDown(1);
        const metricsY = doc.y;
        const boxWidth = 230;
        const boxHeight = 60;
        const spacing = 10;
        this.drawSummaryBox(doc, 60, metricsY, boxWidth, boxHeight, {
            label: 'CO2 Ahorrado',
            value: `${data.metrics.co2Saved.value} ${data.metrics.co2Saved.unit}`,
            color: '#10B981',
        });
        this.drawSummaryBox(doc, 60 + boxWidth + spacing, metricsY, boxWidth, boxHeight, {
            label: 'Arboles Equivalentes',
            value: `${data.metrics.treesEquivalent.value}`,
            color: '#059669',
        });
        this.drawSummaryBox(doc, 60, metricsY + boxHeight + spacing, boxWidth, boxHeight, {
            label: 'Energia Recuperada',
            value: `${data.metrics.energyRecovered.value} ${data.metrics.energyRecovered.unit}`,
            color: '#F59E0B',
        });
        this.drawSummaryBox(doc, 60 + boxWidth + spacing, metricsY + boxHeight + spacing, boxWidth, boxHeight, {
            label: 'Agua Ahorrada',
            value: `${data.metrics.waterSaved.value} ${data.metrics.waterSaved.unit}`,
            color: '#0EA5E9',
        });
        this.drawSummaryBox(doc, 60 + (boxWidth + spacing) / 2, metricsY + (boxHeight + spacing) * 2, boxWidth, boxHeight, {
            label: 'Paneles Procesados',
            value: `${data.metrics.panelsProcessed.total}`,
            color: '#8B5CF6',
        });
        doc.y = metricsY + (boxHeight + spacing) * 3 + 20;
        doc.fontSize(10)
            .fillColor('#6B7280')
            .font('Helvetica')
            .text(`Generado: ${data.generatedAt.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 50, doc.y, { width: contentWidth, align: 'center' });
    }
    renderPanelsDetailPage(doc, data, primaryColor, darkColor, contentWidth) {
        doc.fontSize(18)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('Detalle de Paneles Procesados', 50, 50);
        doc.moveDown(1);
        doc.fontSize(12)
            .fillColor(darkColor)
            .font('Helvetica-Bold')
            .text('Paneles por Estado', 50, doc.y);
        doc.moveDown(0.5);
        const tableY = doc.y;
        this.drawTable(doc, 60, tableY, [
            { header: 'Estado', width: 250 },
            { header: 'Cantidad', width: 100 },
        ], data.panelsByStatus.map(p => [p.status, p.count.toString()]));
        doc.y = tableY + (data.panelsByStatus.length + 1) * 25 + 20;
        doc.fontSize(12)
            .fillColor(darkColor)
            .font('Helvetica-Bold')
            .text('Top 5 Marcas de Paneles', 50, doc.y);
        doc.moveDown(0.5);
        const brandsTableY = doc.y;
        this.drawTable(doc, 60, brandsTableY, [
            { header: 'Marca', width: 250 },
            { header: 'Cantidad', width: 100 },
        ], data.panelsByBrand.map(p => [p.brand, p.count.toString()]));
    }
    renderMaterialsPage(doc, data, primaryColor, darkColor, contentWidth) {
        doc.fontSize(18)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('Materiales Reciclados', 50, 50);
        doc.moveDown(1);
        const tableY = doc.y;
        this.drawTable(doc, 60, tableY, [
            { header: 'Material', width: 100 },
            { header: 'Total (kg)', width: 90 },
            { header: 'Disponible (kg)', width: 90 },
            { header: 'Vendido (kg)', width: 90 },
            { header: 'Valor USD', width: 90 },
        ], data.materialsDetail.map(m => [
            m.type,
            m.totalKg.toFixed(2),
            m.availableKg.toFixed(2),
            m.soldKg.toFixed(2),
            `$${m.estimatedValue.toFixed(2)}`,
        ]));
        doc.y = tableY + (data.materialsDetail.length + 1) * 25 + 30;
        const totalValue = data.materialsDetail.reduce((sum, m) => sum + m.estimatedValue, 0);
        const totalKg = data.materialsDetail.reduce((sum, m) => sum + m.totalKg, 0);
        doc.fontSize(12)
            .fillColor(darkColor)
            .font('Helvetica-Bold')
            .text(`Total Materiales Recuperados: ${totalKg.toFixed(2)} kg`, 60, doc.y);
        doc.moveDown(0.5);
        doc.text(`Valor Total del Inventario: $${totalValue.toFixed(2)} USD`, 60, doc.y);
    }
    renderHistoricalDataPage(doc, data, primaryColor, darkColor, contentWidth) {
        doc.fontSize(18)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('Datos Historicos (12 Meses)', 50, 50);
        doc.moveDown(1);
        const tableY = doc.y;
        const monthlyData = data.charts.panelsByMonth.map((panel, idx) => ({
            month: panel.month,
            panelsProcessed: panel.value,
            co2Saved: data.charts.co2ByMonth[idx]?.value || 0,
            energyRecovered: data.charts.energyByMonth[idx]?.value || 0,
        }));
        this.drawTable(doc, 60, tableY, [
            { header: 'Mes', width: 120 },
            { header: 'Paneles', width: 80 },
            { header: 'CO2 (kg)', width: 100 },
            { header: 'Energia (kWh)', width: 120 },
        ], monthlyData.map(m => [
            m.month,
            m.panelsProcessed.toString(),
            m.co2Saved.toFixed(2),
            m.energyRecovered.toFixed(2),
        ]));
        doc.y = tableY + (monthlyData.length + 1) * 25 + 30;
        const totals = monthlyData.reduce((acc, m) => ({
            panels: acc.panels + m.panelsProcessed,
            co2: acc.co2 + m.co2Saved,
            energy: acc.energy + m.energyRecovered,
        }), { panels: 0, co2: 0, energy: 0 });
        doc.fontSize(12)
            .fillColor(darkColor)
            .font('Helvetica-Bold')
            .text('Totales Acumulados:', 60, doc.y);
        doc.moveDown(0.5);
        doc.font('Helvetica')
            .text(`Paneles: ${totals.panels}`, 70, doc.y);
        doc.moveDown(0.3);
        doc.text(`CO2 Ahorrado: ${totals.co2.toFixed(2)} kg`, 70, doc.y);
        doc.moveDown(0.3);
        doc.text(`Energia Recuperada: ${totals.energy.toFixed(2)} kWh`, 70, doc.y);
    }
    renderOperationsPage(doc, data, primaryColor, darkColor, contentWidth) {
        doc.fontSize(18)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('Operaciones y Transacciones', 50, 50);
        doc.moveDown(1);
        doc.fontSize(12)
            .fillColor(darkColor)
            .font('Helvetica-Bold')
            .text('Solicitudes de Recoleccion', 50, doc.y);
        doc.moveDown(0.5);
        doc.font('Helvetica')
            .text(`Total: ${data.collectionStats.total}`, 60, doc.y);
        doc.moveDown(0.3);
        doc.text(`Completadas: ${data.collectionStats.completed}`, 60, doc.y);
        doc.moveDown(0.3);
        doc.text(`Pendientes: ${data.collectionStats.pending}`, 60, doc.y);
        doc.moveDown(1);
        doc.fontSize(12)
            .fillColor(darkColor)
            .font('Helvetica-Bold')
            .text('Resumen de Ordenes', 50, doc.y);
        doc.moveDown(0.5);
        doc.font('Helvetica')
            .text(`Materiales: ${data.ordersSummary.materialOrders.total} ordenes ($${data.ordersSummary.materialOrders.totalValue.toFixed(2)} USD)`, 60, doc.y);
        doc.moveDown(0.3);
        doc.text(`Paneles: ${data.ordersSummary.panelOrders.total} ordenes ($${data.ordersSummary.panelOrders.totalValue.toFixed(2)} USD)`, 60, doc.y);
        doc.moveDown(0.3);
        doc.text(`Arte: ${data.ordersSummary.artOrders.total} ordenes ($${data.ordersSummary.artOrders.totalValue.toFixed(2)} USD)`, 60, doc.y);
        doc.moveDown(1.5);
        doc.fontSize(12)
            .fillColor(darkColor)
            .font('Helvetica-Bold')
            .text('Ultimas Transacciones Blockchain', 50, doc.y);
        doc.moveDown(0.5);
        const txTableY = doc.y;
        this.drawTable(doc, 60, txTableY, [
            { header: 'Tipo', width: 100 },
            { header: 'Fecha', width: 100 },
            { header: 'TX Hash', width: 250 },
        ], data.recentTransactions.slice(0, 8).map(t => [
            t.type,
            t.date.toLocaleDateString('es-MX'),
            t.blockchainTxHash ? `${t.blockchainTxHash.substring(0, 20)}...` : 'N/A',
        ]));
    }
    renderMethodologyPage(doc, data, primaryColor, darkColor, contentWidth, pageWidth) {
        const secondaryColor = '#93E1D8';
        doc.fontSize(18)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('Metodologia y Factores de Conversion', 50, 50);
        doc.moveDown(1);
        doc.fontSize(10)
            .fillColor(darkColor)
            .font('Helvetica')
            .text('Los calculos de impacto ambiental se basan en los siguientes factores:', 50, doc.y);
        doc.moveDown(1);
        Object.entries(METHODOLOGY).forEach(([key, value]) => {
            doc.fontSize(9)
                .fillColor('#374151')
                .font('Helvetica-Bold')
                .text(`${key.replace(/_/g, ' ')}:`, 60, doc.y);
            doc.font('Helvetica')
                .text(`${value.value} ${value.unit} (Fuente: ${value.source})`, 70, doc.y + 12);
            doc.moveDown(0.8);
        });
        doc.moveDown(1);
        doc.fontSize(12)
            .fillColor(darkColor)
            .font('Helvetica-Bold')
            .text('Notas Legales', 50, doc.y);
        doc.moveDown(0.5);
        doc.fontSize(8)
            .fillColor('#6B7280')
            .font('Helvetica')
            .text('Este reporte ha sido generado automaticamente por la plataforma Rafiqui. Los datos presentados son calculados en base a registros verificados en blockchain y bases de datos internas. Las metricas de impacto ambiental utilizan factores de conversion de fuentes reconocidas internacionalmente.', 50, doc.y, { width: contentWidth, align: 'justify' });
        doc.moveDown(1);
        doc.text('Los valores monetarios son estimaciones basadas en precios de mercado actuales y pueden variar. Para auditoria completa, consulte los hashes de transacciones blockchain proporcionados.', 50, doc.y, { width: contentWidth, align: 'justify' });
        const footerY = doc.page.height - 60;
        doc.rect(0, footerY, pageWidth, 60).fill(darkColor);
        doc.fontSize(10)
            .fillColor('#FFFFFF')
            .text('Rafiqui - Economia Circular para Paneles Solares', 50, footerY + 20, { width: contentWidth, align: 'center' });
        doc.fontSize(8)
            .fillColor(secondaryColor)
            .text('www.rafiqui.com | Reporte generado automaticamente', 50, footerY + 35, { width: contentWidth, align: 'center' });
    }
    drawSummaryBox(doc, x, y, width, height, data) {
        doc.roundedRect(x, y, width, height, 8)
            .fillAndStroke('#F8FAFC', '#E2E8F0');
        doc.rect(x, y, 4, height).fill(data.color);
        doc.fontSize(14)
            .fillColor('#1F2937')
            .font('Helvetica-Bold')
            .text(data.value, x + 15, y + 12, { width: width - 25 });
        doc.fontSize(10)
            .fillColor('#374151')
            .font('Helvetica')
            .text(data.label, x + 15, y + 35, { width: width - 25 });
    }
    drawTable(doc, x, y, columns, rows) {
        const rowHeight = 25;
        let currentY = y;
        doc.fontSize(9)
            .fillColor('#374151')
            .font('Helvetica-Bold');
        columns.forEach((col, i) => {
            const colX = x + columns.slice(0, i).reduce((sum, c) => sum + c.width, 0);
            doc.rect(colX, currentY, col.width, rowHeight).stroke('#E2E8F0');
            doc.text(col.header, colX + 5, currentY + 7, { width: col.width - 10 });
        });
        currentY += rowHeight;
        doc.font('Helvetica')
            .fillColor('#1F2937');
        rows.forEach(row => {
            columns.forEach((col, i) => {
                const colX = x + columns.slice(0, i).reduce((sum, c) => sum + c.width, 0);
                doc.rect(colX, currentY, col.width, rowHeight).stroke('#E2E8F0');
                doc.text(row[i] || '', colX + 5, currentY + 7, { width: col.width - 10 });
            });
            currentY += rowHeight;
        });
    }
};
exports.FullReportService = FullReportService;
exports.FullReportService = FullReportService = FullReportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dashboard_metrics_service_1.DashboardMetricsService])
], FullReportService);
//# sourceMappingURL=full-report.service.js.map