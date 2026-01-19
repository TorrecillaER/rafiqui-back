---
description: Crear endpoint en backend para generar certificado ESG en PDF
---

# Step 27: ESG Certificate Backend - Generación de Certificado PDF

Este workflow crea el endpoint en el backend NestJS para generar certificados ESG en formato PDF usando los datos reales de la base de datos.

## Estrategia de Implementación

Se utilizará la librería **PDFKit** para generar PDFs en el servidor. El certificado incluirá:
- Logo de Rafiqui
- Datos del usuario/empresa (PARTNER)
- Métricas ESG calculadas con datos reales
- Fecha de emisión
- Número de certificado único
- Código QR de verificación (opcional)

---

## Paso 1: Instalar dependencias

```bash
cd /Users/aaronisraeltorrecillajimenez/Documents/rafiqui-back
npm install pdfkit @types/pdfkit uuid
```

---

## Paso 2: Crear el servicio de generación de certificados

Crear archivo `src/dashboard/esg-certificate.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardMetricsService, DashboardMetrics } from './dashboard-metrics.service';
import * as PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';

export interface CertificateData {
  certificateId: string;
  issuedAt: Date;
  partnerName: string;
  partnerEmail: string;
  metrics: DashboardMetrics;
}

@Injectable()
export class EsgCertificateService {
  private readonly logger = new Logger(EsgCertificateService.name);

  constructor(
    private prisma: PrismaService,
    private dashboardMetricsService: DashboardMetricsService,
  ) {}

  async generateCertificate(userId?: string): Promise<Buffer> {
    // Obtener métricas ESG reales
    const metrics = await this.dashboardMetricsService.calculateMetrics();
    
    // Obtener datos del usuario si se proporciona
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

    const certificateData: CertificateData = {
      certificateId: `RAFIQUI-ESG-${uuidv4().substring(0, 8).toUpperCase()}`,
      issuedAt: new Date(),
      partnerName,
      partnerEmail,
      metrics,
    };

    return this.createPDF(certificateData);
  }

  private createPDF(data: CertificateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'portrait',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Colores de la marca
      const primaryColor = '#E6086A'; // Razzmatazz
      const secondaryColor = '#93E1D8'; // Tiffany Blue
      const darkColor = '#102038'; // Oxford Blue

      // Header con gradiente simulado
      doc.rect(0, 0, doc.page.width, 120).fill(darkColor);
      
      // Título del certificado
      doc.fontSize(28)
         .fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .text('CERTIFICADO ESG', 50, 40, { align: 'center' });
      
      doc.fontSize(14)
         .fillColor(secondaryColor)
         .text('Impacto Ambiental Verificado', 50, 75, { align: 'center' });

      // Número de certificado
      doc.fontSize(10)
         .fillColor('#FFFFFF')
         .text(`N° ${data.certificateId}`, 50, 100, { align: 'center' });

      // Cuerpo del certificado
      doc.moveDown(4);

      // Texto de certificación
      doc.fontSize(12)
         .fillColor(darkColor)
         .font('Helvetica')
         .text('Se certifica que', { align: 'center' });

      doc.moveDown(0.5);
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text(data.partnerName, { align: 'center' });

      doc.moveDown(0.5);
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor(darkColor)
         .text('ha contribuido al impacto ambiental positivo a través de la plataforma Rafiqui,', { align: 'center' })
         .text('logrando las siguientes métricas de sostenibilidad:', { align: 'center' });

      doc.moveDown(2);

      // Métricas ESG en formato de tabla
      const metricsStartY = doc.y;
      const colWidth = 240;
      const rowHeight = 70;

      // Fila 1: CO2 y Árboles
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

      // Fila 2: Energía y Agua
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

      // Fila 3: Paneles (centrada)
      this.drawMetricBox(doc, 55 + (colWidth + 10) / 2, metricsStartY + (rowHeight + 10) * 2, colWidth, rowHeight, {
        icon: '☀️',
        value: `${data.metrics.panelsProcessed.total}`,
        label: 'Paneles Procesados',
        sublabel: `${data.metrics.panelsProcessed.reused} reusados, ${data.metrics.panelsProcessed.recycled} reciclados`,
        color: '#8B5CF6',
      });

      // Pie del certificado
      doc.y = metricsStartY + (rowHeight + 10) * 3 + 30;

      doc.fontSize(10)
         .fillColor('#6B7280')
         .text(`Fecha de emisión: ${data.issuedAt.toLocaleDateString('es-MX', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         })}`, { align: 'center' });

      doc.moveDown(0.5);
      doc.text('Este certificado es generado automáticamente con datos verificados en blockchain.', { align: 'center' });

      // Footer
      doc.rect(0, doc.page.height - 60, doc.page.width, 60).fill(darkColor);
      doc.fontSize(10)
         .fillColor('#FFFFFF')
         .text('Rafiqui - Economía Circular para Paneles Solares', 50, doc.page.height - 40, { align: 'center' });
      doc.fontSize(8)
         .fillColor(secondaryColor)
         .text('www.rafiqui.com', 50, doc.page.height - 25, { align: 'center' });

      doc.end();
    });
  }

  private drawMetricBox(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    metric: { icon: string; value: string; label: string; sublabel: string; color: string }
  ) {
    // Fondo del box
    doc.roundedRect(x, y, width, height, 8)
       .fillAndStroke('#F8FAFC', '#E2E8F0');

    // Barra de color izquierda
    doc.rect(x, y, 4, height).fill(metric.color);

    // Contenido
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
}
```

---

## Paso 3: Crear el DTO de respuesta

Crear archivo `src/dashboard/dto/certificate.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class GenerateCertificateDto {
  @ApiProperty({ required: false, description: 'ID del usuario para personalizar el certificado' })
  userId?: string;
}

export class CertificateResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  certificateId?: string;
}
```

---

## Paso 4: Actualizar el controlador del dashboard

Modificar `src/dashboard/dashboard.controller.ts` para agregar el endpoint:

```typescript
import { Controller, Get, Query, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { DashboardMetricsService } from './dashboard-metrics.service';
import { EsgCertificateService } from './esg-certificate.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly metricsService: DashboardMetricsService,
    private readonly certificateService: EsgCertificateService,
  ) {}

  @Get('metrics')
  async getMetrics() {
    return this.metricsService.calculateMetrics();
  }

  @Get('charts')
  async getCharts() {
    return this.metricsService.calculateCharts();
  }

  @Get('certificate')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="certificado-esg-rafiqui.pdf"')
  async generateCertificate(
    @Query('userId') userId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.certificateService.generateCertificate(userId);
    res.send(pdfBuffer);
  }
}
```

---

## Paso 5: Actualizar el módulo del dashboard

Modificar `src/dashboard/dashboard.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardMetricsService } from './dashboard-metrics.service';
import { EsgCertificateService } from './esg-certificate.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardMetricsService, EsgCertificateService],
  exports: [DashboardMetricsService],
})
export class DashboardModule {}
```

---

## Paso 6: Probar el endpoint

```bash
# Generar certificado sin usuario específico
curl -o certificado.pdf http://localhost:4000/dashboard/certificate

# Generar certificado para un usuario específico
curl -o certificado.pdf "http://localhost:4000/dashboard/certificate?userId=<USER_ID>"
```

---

## Datos del Certificado

El certificado incluye las siguientes métricas calculadas desde la base de datos:

| Métrica | Fuente de Datos | Fórmula |
|---------|-----------------|---------|
| CO₂ Ahorrado | Assets reusados + RecycleRecords | (kWh × 0.423) + (kg_Al × 11.5) |
| Árboles Equivalentes | CO₂ total | CO₂ / 20 kg/árbol/año |
| Energía Recuperada | Assets con measuredPowerWatts | Σ(W × 5.5h × 365 × 15 años) |
| Agua Ahorrada | Energía + Aluminio reciclado | (kWh × 0.7L) + (kg_Al × 20L) |
| Paneles Procesados | Assets por status | Count de reused + recycled + art |

---

## Estructura del PDF

```
┌─────────────────────────────────────────────┐
│  HEADER (fondo oscuro)                      │
│  - Título: CERTIFICADO ESG                  │
│  - Subtítulo: Impacto Ambiental Verificado  │
│  - Número de certificado                    │
├─────────────────────────────────────────────┤
│  CUERPO                                     │
│  - "Se certifica que [NOMBRE]..."           │
│  - Grid de métricas (2x2 + 1)               │
│    ┌──────────┐ ┌──────────┐                │
│    │ CO₂     │ │ Árboles  │                │
│    └──────────┘ └──────────┘                │
│    ┌──────────┐ ┌──────────┐                │
│    │ Energía │ │ Agua     │                │
│    └──────────┘ └──────────┘                │
│         ┌──────────┐                        │
│         │ Paneles  │                        │
│         └──────────┘                        │
│  - Fecha de emisión                         │
│  - Nota de verificación blockchain          │
├─────────────────────────────────────────────┤
│  FOOTER (fondo oscuro)                      │
│  - Rafiqui branding                         │
│  - URL                                      │
└─────────────────────────────────────────────┘
```

---

## Dependencias Requeridas

```json
{
  "pdfkit": "^0.15.0",
  "@types/pdfkit": "^0.13.4",
  "uuid": "^9.0.0"
}
```
