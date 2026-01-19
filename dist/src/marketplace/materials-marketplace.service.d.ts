import { PrismaService } from '../prisma/prisma.service';
import { MaterialsBlockchainService } from '../blockchain/materials-blockchain.service';
import { CreateMaterialOrderDto, MaterialOrderResponseDto, MaterialAvailabilityDto } from './dto/material-order.dto';
export declare class MaterialsMarketplaceService {
    private prisma;
    private materialsBlockchain;
    private readonly logger;
    constructor(prisma: PrismaService, materialsBlockchain: MaterialsBlockchainService);
    getAvailability(): Promise<MaterialAvailabilityDto[]>;
    createOrder(dto: CreateMaterialOrderDto): Promise<MaterialOrderResponseDto>;
    getOrdersByBuyer(buyerId: string): Promise<({
        buyer: {
            id: string;
            email: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        completedAt: Date | null;
        buyerWallet: string;
        blockchainTxHash: string | null;
        buyerId: string | null;
        materialType: import(".prisma/client").$Enums.MaterialType;
        quantityKg: number;
        destination: import(".prisma/client").$Enums.MaterialDestination;
        destinationNotes: string | null;
        pricePerKg: number;
        totalPrice: number;
    })[]>;
    getOrderById(orderId: string): Promise<{
        buyer: {
            id: string;
            email: string;
            name: string;
            walletAddress: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        completedAt: Date | null;
        buyerWallet: string;
        blockchainTxHash: string | null;
        buyerId: string | null;
        materialType: import(".prisma/client").$Enums.MaterialType;
        quantityKg: number;
        destination: import(".prisma/client").$Enums.MaterialDestination;
        destinationNotes: string | null;
        pricePerKg: number;
        totalPrice: number;
    }>;
}
