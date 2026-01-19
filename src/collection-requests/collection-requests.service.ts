import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCollectionRequestDto } from './dto/create-collection-request.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

import { UpdateCollectionRequestDto } from './dto/update-collection-request.dto';

@Injectable()
export class CollectionRequestsService {
  constructor(private prisma: PrismaService) {}

  create(createCollectionRequestDto: CreateCollectionRequestDto) {
    return this.prisma.collectionRequest.create({
      data: createCollectionRequestDto as Prisma.CollectionRequestUncheckedCreateInput,
    });
  }

  async findAll(status?: string, assignedCollectorId?: string) {
    const where: any = {};

    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      where.status = { in: statuses };
    }

    if (assignedCollectorId) {
      where.assignedCollectorId = assignedCollectorId;
    }

    return this.prisma.collectionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { assets: true },
    });
  }

  findOne(id: string) {
    return this.prisma.collectionRequest.findUnique({
      where: { id },
      include: { assets: true },
    });
  }

  async update(id: string, updateData: UpdateCollectionRequestDto) {
    const dataToUpdate: any = { ...updateData };

    // Si se proporciona assignedCollectorEmail, buscar el ID del usuario
    if (updateData.assignedCollectorEmail) {
      const collector = await this.prisma.user.findUnique({
        where: { email: updateData.assignedCollectorEmail },
      });

      if (!collector) {
        throw new NotFoundException(
          `Usuario con email ${updateData.assignedCollectorEmail} no encontrado`
        );
      }

      // Reemplazar el email por el ID
      dataToUpdate.assignedCollectorId = collector.id;
      delete dataToUpdate.assignedCollectorEmail;
    }

    // Validar que el assignedCollectorId existe si se proporciona directamente
    if (dataToUpdate.assignedCollectorId) {
      const collector = await this.prisma.user.findUnique({
        where: { id: dataToUpdate.assignedCollectorId },
      });

      if (!collector) {
        throw new NotFoundException(
          `Usuario con ID ${dataToUpdate.assignedCollectorId} no encontrado`
        );
      }
    }

    return this.prisma.collectionRequest.update({
      where: { id },
      data: dataToUpdate,
      include: { 
        assets: true,
        assignedCollector: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async getCollectorHistory(collectorId: string, status?: string) {
    const where: any = {
      assignedCollectorId: collectorId,
    };

    // Por defecto, incluir ASSIGNED, IN_PROGRESS y COMPLETED. Si se pasa status, filtrar por ese
    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      where.status = { in: statuses };
    } else {
      where.status = { in: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] };
    }

    const requests = await this.prisma.collectionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assets: {
          select: {
            id: true,
            status: true,
            brand: true,
            model: true,
          },
        },
      },
    });

    // Transformar para incluir información agregada
    return requests.map((request) => ({
      id: request.id,
      pickupAddress: request.pickupAddress,
      city: request.city,
      postalCode: request.postalCode,
      contactName: request.contactName,
      contactPhone: request.contactPhone,
      panelType: request.panelType,
      estimatedCount: request.estimatedCount,
      actualCount: request.assets.length,
      status: request.status,
      createdAt: request.createdAt,
      completedAt: request.completedAt,
      assets: request.assets,
    }));
  }

  async getCollectorHistoryByEmail(email: string, status?: string) {
    const collector = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!collector) {
      throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    }

    return this.getCollectorHistory(collector.id, status);
  }

  async getCollectorStats(collectorId: string) {
    const [completed, inProgress, totalAssets] = await Promise.all([
      this.prisma.collectionRequest.count({
        where: {
          assignedCollectorId: collectorId,
          status: 'COMPLETED',
        },
      }),
      this.prisma.collectionRequest.count({
        where: {
          assignedCollectorId: collectorId,
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.asset.count({
        where: {
          collectionRequest: {
            assignedCollectorId: collectorId,
          },
        },
      }),
    ]);

    // Calcular peso estimado (20kg por panel promedio)
    const estimatedWeightKg = totalAssets * 20;
    const estimatedWeightTons = estimatedWeightKg / 1000;

    return {
      completedCollections: completed,
      activeCollections: inProgress,
      totalPanelsCollected: totalAssets,
      estimatedWeightKg,
      estimatedWeightTons: Math.round(estimatedWeightTons * 10) / 10,
    };
  }
}
