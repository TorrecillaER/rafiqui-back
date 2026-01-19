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
var EsgCertificateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EsgCertificateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dashboard_metrics_service_1 = require("./dashboard-metrics.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const pdfkit_1 = __importDefault(require("pdfkit"));
const uuid_1 = require("uuid");
let EsgCertificateService = EsgCertificateService_1 = class EsgCertificateService {
    prisma;
    dashboardMetricsService;
    blockchainService;
    logger = new common_1.Logger(EsgCertificateService_1.name);
    constructor(prisma, dashboardMetricsService, blockchainService) {
        this.prisma = prisma;
        this.dashboardMetricsService = dashboardMetricsService;
        this.blockchainService = blockchainService;
    }
    async generateCertificate(userId) {
        const metrics = await this.dashboardMetricsService.calculateMetrics();
        let partnerName = 'Socio Rafiqui';
        let partnerEmail = '';
        if (userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, email: true },
            });
            if (user) {
                partnerName = user.name;
                partnerEmail = user.email;
            }
        }
        const certificateId = `RAFIQUI-ESG-${(0, uuid_1.v4)().substring(0, 8).toUpperCase()}`;
        const blockchain = await this.getBlockchainVerification(certificateId);
        const certificateData = {
            certificateId,
            issuedAt: new Date(),
            partnerName,
            partnerEmail,
            metrics,
            blockchain,
        };
        return this.createPDF(certificateData);
    }
    async getBlockchainVerification(certificateId) {
        const assets = await this.prisma.asset.findMany({
            where: {
                OR: [
                    { status: 'RECYCLED' },
                    { status: 'REUSED' },
                    { status: 'LISTED_FOR_SALE' },
                    { status: 'ART_LISTED_FOR_SALE' },
                    { inspection: { isNot: null } },
                    { recycleRecord: { isNot: null } },
                    { artPiece: { isNot: null } },
                    { panelOrders: { some: {} } },
                    { refurbishedAt: { not: null } },
                ],
            },
            include: {
                collectionRequest: {
                    select: {
                        pickupAddress: true,
                        city: true,
                    },
                },
                inspection: {
                    select: {
                        createdAt: true,
                        aiRecommendation: true,
                    },
                },
                recycleRecord: {
                    select: {
                        blockchainTxHash: true,
                        materialsTxHash: true,
                        createdAt: true,
                    },
                },
                artPiece: {
                    select: {
                        id: true,
                        title: true,
                        contractAddress: true,
                        tokenId: true,
                        createdAt: true,
                        orders: {
                            select: {
                                blockchainTxHash: true,
                                createdAt: true,
                            },
                        },
                    },
                },
                panelOrders: {
                    select: {
                        blockchainTxHash: true,
                        destination: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        const panelJourneys = await Promise.all(assets.map(async (asset) => {
            const transactions = [];
            let finalDestination = 'REUTILIZACIÓN';
            let destinationDetails = '';
            if (asset.qrCode && this.blockchainService.isConnected()) {
                try {
                    const blockchainHistory = await this.blockchainService.getPanelHistory(asset.qrCode);
                    blockchainHistory.forEach((history) => {
                        const txType = this.mapPanelStatusToTransactionType(history.status);
                        if (txType) {
                            transactions.push({
                                type: txType,
                                txHash: `ONCHAIN-${history.timestamp}`,
                                timestamp: new Date(history.timestamp * 1000),
                                details: `${this.getPanelStatusLabel(history.status)} - ${history.location}`,
                            });
                        }
                    });
                    if (blockchainHistory.length > 0) {
                        const lastStatus = blockchainHistory[blockchainHistory.length - 1].status;
                        if (lastStatus === blockchain_service_1.PanelStatus.RECYCLED) {
                            finalDestination = 'RECICLAJE';
                            destinationDetails = 'Panel reciclado (verificado en blockchain)';
                        }
                        else if (lastStatus === blockchain_service_1.PanelStatus.SOLD || lastStatus === blockchain_service_1.PanelStatus.REUSE_APPROVED) {
                            finalDestination = 'REUTILIZACIÓN';
                            destinationDetails = 'Panel vendido para reutilización (verificado en blockchain)';
                        }
                        else if (lastStatus === blockchain_service_1.PanelStatus.ART_MINTED || lastStatus === blockchain_service_1.PanelStatus.ART_LISTED) {
                            finalDestination = 'ARTE';
                            destinationDetails = 'Panel convertido en arte (verificado en blockchain)';
                        }
                    }
                }
                catch (error) {
                    this.logger.warn(`No se pudo obtener historial blockchain para panel ${asset.qrCode}`);
                }
            }
            if (asset.inspection) {
                const recommendation = asset.inspection.aiRecommendation;
                if (recommendation === 'RECYCLE') {
                    finalDestination = 'RECICLAJE';
                }
                else if (recommendation === 'ART') {
                    finalDestination = 'ARTE';
                }
            }
            if (asset.refurbishedAt && asset.tokenId) {
                transactions.push({
                    type: 'REFURBISHMENT',
                    txHash: asset.tokenId,
                    timestamp: asset.refurbishedAt,
                    details: `Potencia: ${asset.measuredPowerWatts || 'N/A'}W, Salud: ${asset.healthPercentage || 'N/A'}%`,
                });
            }
            if (asset.recycleRecord) {
                if (asset.recycleRecord.blockchainTxHash) {
                    transactions.push({
                        type: 'RECYCLE',
                        txHash: asset.recycleRecord.blockchainTxHash,
                        timestamp: asset.recycleRecord.createdAt,
                        details: 'Panel procesado para reciclaje',
                    });
                }
                else {
                    transactions.push({
                        type: 'RECYCLE',
                        txHash: `LOCAL-${asset.id.substring(0, 16)}`,
                        timestamp: asset.recycleRecord.createdAt,
                        details: 'Panel procesado para reciclaje (sin blockchain)',
                    });
                }
                if (asset.recycleRecord.materialsTxHash) {
                    transactions.push({
                        type: 'MATERIAL_MINT',
                        txHash: asset.recycleRecord.materialsTxHash,
                        timestamp: asset.recycleRecord.createdAt,
                        details: 'Materiales minteados como tokens ERC-1155',
                    });
                }
                finalDestination = 'RECICLAJE';
                destinationDetails = 'Materiales recuperados y tokenizados';
            }
            else if (asset.status === 'RECYCLED') {
                transactions.push({
                    type: 'RECYCLE',
                    txHash: `LOCAL-${asset.id.substring(0, 16)}`,
                    timestamp: asset.createdAt,
                    details: 'Panel marcado como reciclado',
                });
                finalDestination = 'RECICLAJE';
                destinationDetails = 'En proceso de reciclaje';
            }
            if (asset.artPiece) {
                if (asset.artPiece.contractAddress) {
                    transactions.push({
                        type: 'ART_CREATION',
                        txHash: asset.artPiece.contractAddress,
                        timestamp: asset.artPiece.createdAt,
                        details: `NFT de arte creado: ${asset.artPiece.title}`,
                    });
                }
                asset.artPiece.orders.forEach(order => {
                    if (order.blockchainTxHash) {
                        transactions.push({
                            type: 'ART_SALE',
                            txHash: order.blockchainTxHash,
                            timestamp: order.createdAt,
                            details: 'Obra de arte vendida',
                        });
                    }
                });
                finalDestination = 'ARTE';
                destinationDetails = `Obra de arte: ${asset.artPiece.title}`;
            }
            if (asset.panelOrders.length > 0) {
                asset.panelOrders.forEach(order => {
                    if (order.blockchainTxHash) {
                        transactions.push({
                            type: 'PANEL_SALE',
                            txHash: order.blockchainTxHash,
                            timestamp: order.createdAt,
                            details: `Vendido para: ${order.destination}`,
                        });
                    }
                    else {
                        transactions.push({
                            type: 'PANEL_SALE',
                            txHash: `LOCAL-${asset.id.substring(0, 16)}`,
                            timestamp: order.createdAt,
                            details: `Vendido para: ${order.destination} (sin blockchain)`,
                        });
                    }
                    finalDestination = 'REUTILIZACIÓN';
                    destinationDetails = `Destino: ${order.destination}`;
                });
            }
            else if (asset.status === 'REUSED' || asset.status === 'LISTED_FOR_SALE') {
                if (asset.refurbishedAt) {
                    finalDestination = 'REUTILIZACIÓN';
                    destinationDetails = 'Panel reacondicionado listo para venta';
                }
            }
            const collectionAddress = asset.collectionRequest
                ? `${asset.collectionRequest.pickupAddress}, ${asset.collectionRequest.city}`
                : 'Dirección no registrada';
            return {
                panelId: asset.id,
                nfcTagId: asset.nfcTagId,
                collectionAddress,
                transactions: transactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
                finalDestination,
                destinationDetails,
            };
        }));
        this.logger.log(`Generando certificado con ${panelJourneys.length} paneles procesados`);
        const artDonationsCount = await this.prisma.artPiece.count({
            where: {
                sourceAssetId: { not: null },
            },
        });
        const artPieces = await this.prisma.artPiece.findMany({
            where: {
                contractAddress: { not: null },
            },
            select: {
                contractAddress: true,
            },
        });
        const uniqueContracts = [...new Set(artPieces.map(a => a.contractAddress).filter((addr) => addr !== null))];
        const totalTxCount = await this.prisma.recycleRecord.count({
            where: { blockchainTxHash: { not: null } },
        }) + await this.prisma.panelOrder.count({
            where: { blockchainTxHash: { not: null } },
        }) + await this.prisma.artOrder.count({
            where: { blockchainTxHash: { not: null } },
        });
        return {
            totalTransactions: totalTxCount,
            panelJourneys,
            contractAddresses: uniqueContracts,
            verificationUrl: `https://rafiqui.com/verify/${certificateId}`,
            artDonationsCount,
        };
    }
    createPDF(data) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({
                size: 'A4',
                layout: 'portrait',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                autoFirstPage: true,
            });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            const primaryColor = '#E6086A';
            const secondaryColor = '#93E1D8';
            const darkColor = '#102038';
            const pageWidth = doc.page.width;
            const contentWidth = pageWidth - 100;
            doc.rect(0, 0, pageWidth, 120).fill(darkColor);
            doc.fontSize(28)
                .fillColor('#FFFFFF')
                .font('Helvetica-Bold')
                .text('CERTIFICADO ESG', 50, 40, { width: contentWidth, align: 'center' });
            doc.fontSize(14)
                .fillColor(secondaryColor)
                .text('Impacto Ambiental Verificado', 50, 75, { width: contentWidth, align: 'center' });
            doc.fontSize(10)
                .fillColor('#FFFFFF')
                .text(`N° ${data.certificateId}`, 50, 100, { width: contentWidth, align: 'center' });
            doc.y = 150;
            doc.fontSize(12)
                .fillColor(darkColor)
                .font('Helvetica')
                .text('Se certifica que', 50, doc.y, { width: contentWidth, align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(20)
                .font('Helvetica-Bold')
                .fillColor(primaryColor)
                .text(data.partnerName, 50, doc.y, { width: contentWidth, align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12)
                .font('Helvetica')
                .fillColor(darkColor)
                .text('ha contribuido al impacto ambiental positivo a través de la plataforma Rafiqui,', 50, doc.y, { width: contentWidth, align: 'center' });
            doc.moveDown(0.3);
            doc.text('logrando las siguientes métricas de sostenibilidad:', 50, doc.y, { width: contentWidth, align: 'center' });
            doc.moveDown(1.5);
            const metricsStartY = doc.y;
            const colWidth = 240;
            const rowHeight = 70;
            this.drawMetricBox(doc, 55, metricsStartY, colWidth, rowHeight, {
                icon: '🌿',
                value: `${data.metrics.co2Saved.value} ${data.metrics.co2Saved.unit}`,
                label: 'CO₂ Ahorrado',
                sublabel: 'Emisiones evitadas',
                color: '#10B981',
            });
            this.drawMetricBox(doc, 55 + colWidth + 10, metricsStartY, colWidth, rowHeight, {
                icon: '🌳',
                value: `${data.metrics.treesEquivalent.value}`,
                label: 'Árboles Equivalentes',
                sublabel: data.metrics.treesEquivalent.description,
                color: '#059669',
            });
            this.drawMetricBox(doc, 55, metricsStartY + rowHeight + 10, colWidth, rowHeight, {
                icon: '⚡',
                value: `${data.metrics.energyRecovered.value} ${data.metrics.energyRecovered.unit}`,
                label: 'Energía Recuperada',
                sublabel: `Alimenta ${data.metrics.energyRecovered.homesPerYear} hogares/año`,
                color: '#F59E0B',
            });
            this.drawMetricBox(doc, 55 + colWidth + 10, metricsStartY + rowHeight + 10, colWidth, rowHeight, {
                icon: '💧',
                value: `${data.metrics.waterSaved.value} ${data.metrics.waterSaved.unit}`,
                label: 'Agua Ahorrada',
                sublabel: 'En procesos industriales',
                color: '#0EA5E9',
            });
            const artDonationText = data.blockchain.artDonationsCount > 0
                ? `, ${data.blockchain.artDonationsCount} donados para arte`
                : '';
            this.drawMetricBox(doc, 55 + (colWidth + 10) / 2, metricsStartY + (rowHeight + 10) * 2, colWidth, rowHeight, {
                icon: '☀️',
                value: `${data.metrics.panelsProcessed.total}`,
                label: 'Paneles Procesados',
                sublabel: `${data.metrics.panelsProcessed.reused} reusados, ${data.metrics.panelsProcessed.recycled} reciclados${artDonationText}`,
                color: '#8B5CF6',
            });
            doc.y = metricsStartY + (rowHeight + 10) * 3 + 20;
            doc.fontSize(14)
                .fillColor(darkColor)
                .font('Helvetica-Bold')
                .text('Trazabilidad Blockchain de Paneles', 50, doc.y, { width: contentWidth, align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(9)
                .fillColor('#6B7280')
                .font('Helvetica')
                .text(`${data.blockchain.totalTransactions} transacciones totales registradas en blockchain`, 50, doc.y, { width: contentWidth, align: 'center' });
            doc.moveDown(1);
            if (data.blockchain.panelJourneys.length > 0) {
                data.blockchain.panelJourneys.forEach((journey, index) => {
                    if (doc.y > doc.page.height - 200) {
                        doc.addPage();
                        doc.y = 50;
                    }
                    const panelIdentifier = journey.nfcTagId
                        ? `Panel NFC: ${journey.nfcTagId.substring(0, 8)}...`
                        : `Panel ID: ${journey.panelId.substring(0, 8)}...`;
                    doc.fontSize(10)
                        .fillColor(primaryColor)
                        .font('Helvetica-Bold')
                        .text(panelIdentifier, 60, doc.y);
                    doc.moveDown(0.3);
                    doc.fontSize(8)
                        .fillColor('#374151')
                        .font('Helvetica')
                        .text(`[ORIGEN] Recolectado en: ${journey.collectionAddress}`, 60, doc.y);
                    doc.moveDown(0.5);
                    if (journey.transactions.length > 0) {
                        doc.fontSize(8)
                            .fillColor('#6B7280')
                            .text('Transacciones:', 60, doc.y);
                        doc.moveDown(0.3);
                        journey.transactions.forEach((tx, txIndex) => {
                            const txTypeLabel = {
                                'INSPECTION': '[INSPECCION]',
                                'REFURBISHMENT': '[REACONDICIONAMIENTO]',
                                'RECYCLE': '[RECICLAJE]',
                                'MATERIAL_MINT': '[MATERIALES MINTEADOS]',
                                'PANEL_SALE': '[VENTA PANEL]',
                                'ART_CREATION': '[CREACION ARTE]',
                                'ART_SALE': '[VENTA ARTE]',
                            }[tx.type] || tx.type;
                            const shortHash = `${tx.txHash.substring(0, 12)}...${tx.txHash.substring(tx.txHash.length - 8)}`;
                            doc.fontSize(7)
                                .fillColor('#4B5563')
                                .text(`  ${txIndex + 1}. ${txTypeLabel}`, 70, doc.y);
                            doc.moveDown(0.2);
                            doc.fontSize(7)
                                .fillColor('#9CA3AF')
                                .text(`     TX: ${shortHash}`, 70, doc.y);
                            if (tx.details) {
                                doc.moveDown(0.2);
                                doc.fontSize(6)
                                    .fillColor('#6B7280')
                                    .text(`     ${tx.details}`, 70, doc.y);
                            }
                            doc.moveDown(0.3);
                        });
                    }
                    const destinationLabel = {
                        'RECICLAJE': '[RECICLAJE]',
                        'REUTILIZACIÓN': '[REUTILIZACION]',
                        'ARTE': '[ARTE]',
                    }[journey.finalDestination] || '[OTRO]';
                    doc.fontSize(9)
                        .fillColor(primaryColor)
                        .font('Helvetica-Bold')
                        .text(`${destinationLabel} Destino Final: ${journey.finalDestination}`, 60, doc.y);
                    if (journey.destinationDetails) {
                        doc.moveDown(0.2);
                        doc.fontSize(7)
                            .fillColor('#6B7280')
                            .font('Helvetica')
                            .text(`   ${journey.destinationDetails}`, 60, doc.y);
                    }
                    doc.moveDown(0.8);
                    if (index < data.blockchain.panelJourneys.length - 1) {
                        doc.moveTo(60, doc.y)
                            .lineTo(pageWidth - 60, doc.y)
                            .strokeColor('#E5E7EB')
                            .stroke();
                        doc.moveDown(0.5);
                    }
                });
            }
            else {
                doc.fontSize(9)
                    .fillColor('#9CA3AF')
                    .font('Helvetica-Oblique')
                    .text('No hay paneles con transacciones blockchain registradas aún.', 50, doc.y, { width: contentWidth, align: 'center' });
            }
            doc.moveDown(1);
            if (data.blockchain.contractAddresses.length > 0) {
                doc.fontSize(10)
                    .fillColor(darkColor)
                    .font('Helvetica-Bold')
                    .text('Contratos NFT Activos:', 50, doc.y, { width: contentWidth, align: 'center' });
                doc.moveDown(0.3);
                data.blockchain.contractAddresses.forEach((addr) => {
                    const shortAddr = `${addr.substring(0, 12)}...${addr.substring(addr.length - 10)}`;
                    doc.fontSize(7)
                        .fillColor('#6B7280')
                        .font('Helvetica')
                        .text(shortAddr, 50, doc.y, { width: contentWidth, align: 'center' });
                    doc.moveDown(0.2);
                });
            }
            doc.moveDown(1);
            doc.fontSize(10)
                .fillColor('#6B7280')
                .font('Helvetica')
                .text(`Fecha de emisión: ${data.issuedAt.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`, 50, doc.y, { width: contentWidth, align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(9)
                .text('Este certificado contiene datos verificados en blockchain.', 50, doc.y, { width: contentWidth, align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(8)
                .fillColor('#9CA3AF')
                .text(`Verifica en: ${data.blockchain.verificationUrl}`, 50, doc.y, { width: contentWidth, align: 'center' });
            const footerY = doc.page.height - 60;
            doc.rect(0, footerY, pageWidth, 60).fill(darkColor);
            doc.fontSize(10)
                .fillColor('#FFFFFF')
                .text('Rafiqui - Economía Circular para Paneles Solares', 50, footerY + 20, { width: contentWidth, align: 'center' });
            doc.fontSize(8)
                .fillColor(secondaryColor)
                .text('www.rafiqui.com', 50, footerY + 35, { width: contentWidth, align: 'center' });
            doc.end();
        });
    }
    drawMetricBox(doc, x, y, width, height, metric) {
        doc.roundedRect(x, y, width, height, 8)
            .fillAndStroke('#F8FAFC', '#E2E8F0');
        doc.rect(x, y, 4, height).fill(metric.color);
        doc.fontSize(16)
            .fillColor('#1F2937')
            .font('Helvetica-Bold')
            .text(metric.value, x + 15, y + 12, { width: width - 25 });
        doc.fontSize(11)
            .fillColor('#374151')
            .font('Helvetica-Bold')
            .text(metric.label, x + 15, y + 32, { width: width - 25 });
        doc.fontSize(9)
            .fillColor('#6B7280')
            .font('Helvetica')
            .text(metric.sublabel, x + 15, y + 48, { width: width - 25 });
    }
    mapPanelStatusToTransactionType(status) {
        switch (status) {
            case blockchain_service_1.PanelStatus.COLLECTED:
                return null;
            case blockchain_service_1.PanelStatus.WAREHOUSE_RECEIVED:
                return null;
            case blockchain_service_1.PanelStatus.INSPECTED:
                return 'INSPECTION';
            case blockchain_service_1.PanelStatus.REUSE_APPROVED:
                return 'REFURBISHMENT';
            case blockchain_service_1.PanelStatus.RECYCLE_APPROVED:
                return 'RECYCLE';
            case blockchain_service_1.PanelStatus.ART_APPROVED:
                return 'ART_CREATION';
            case blockchain_service_1.PanelStatus.SOLD:
                return 'PANEL_SALE';
            case blockchain_service_1.PanelStatus.RECYCLED:
                return 'RECYCLE';
            case blockchain_service_1.PanelStatus.ART_MINTED:
                return 'ART_CREATION';
            case blockchain_service_1.PanelStatus.ART_LISTED:
                return 'ART_SALE';
            default:
                return null;
        }
    }
    getPanelStatusLabel(status) {
        switch (status) {
            case blockchain_service_1.PanelStatus.COLLECTED:
                return 'Recolectado';
            case blockchain_service_1.PanelStatus.WAREHOUSE_RECEIVED:
                return 'Recibido en almacén';
            case blockchain_service_1.PanelStatus.INSPECTED:
                return 'Inspeccionado';
            case blockchain_service_1.PanelStatus.REUSE_APPROVED:
                return 'Aprobado para reutilización';
            case blockchain_service_1.PanelStatus.RECYCLE_APPROVED:
                return 'Aprobado para reciclaje';
            case blockchain_service_1.PanelStatus.ART_APPROVED:
                return 'Aprobado para arte';
            case blockchain_service_1.PanelStatus.SOLD:
                return 'Vendido';
            case blockchain_service_1.PanelStatus.RECYCLED:
                return 'Reciclado';
            case blockchain_service_1.PanelStatus.ART_MINTED:
                return 'Arte minteado';
            case blockchain_service_1.PanelStatus.ART_LISTED:
                return 'Arte listado';
            default:
                return 'Estado desconocido';
        }
    }
};
exports.EsgCertificateService = EsgCertificateService;
exports.EsgCertificateService = EsgCertificateService = EsgCertificateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dashboard_metrics_service_1.DashboardMetricsService,
        blockchain_service_1.BlockchainService])
], EsgCertificateService);
//# sourceMappingURL=esg-certificate.service.js.map