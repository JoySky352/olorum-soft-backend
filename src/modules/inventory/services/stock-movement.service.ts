import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StockMovement } from "../entities/stock-movement.entity";
import { Product } from "../entities/product.entity";
import { CreateStockMovementDto, GetStockMovementsDto } from "../dto/stock-movement.dto";
import { PaginatedResponseDto } from "src/core/dto/paginated-response.dto";

@Injectable()
export class StockMovementService {
    constructor(
        @InjectRepository(StockMovement)
        private movementRepository: Repository<StockMovement>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) { }

    async create(
        dto: CreateStockMovementDto,
        userId: number,
        userName: string,
    ): Promise<StockMovement> {
        const product = await this.productRepository.findOne({
            where: { id: dto.productId },
        });

        if (!product) {
            throw new NotFoundException(`Producto con ID ${dto.productId} no encontrado`);
        }

        // Determinar el tipo de movimiento
        let type = "stock_update";
        const hasCostChange = dto.newUnitCost && dto.newUnitCost !== product.unitCost;
        const hasPriceChange = dto.newUnitPrice && dto.newUnitPrice !== product.unitPrice;
        const hasStockChange = dto.quantityAdded > 0;

        if (hasCostChange && hasPriceChange && hasStockChange) {
            type = "full_update";
        } else if (hasCostChange && hasPriceChange) {
            type = "price_update";
        } else if (hasCostChange) {
            type = "cost_update";
        } else if (hasPriceChange) {
            type = "sale_price_update";
        }

        // Calcular nuevo stock
        const newStock = Number(product.stock) + Number(dto.quantityAdded);

        // Crear el movimiento
        const movement = new StockMovement();
        movement.productId = product.id;
        movement.productName = product.name;
        movement.previousStock = Number(product.stock);
        movement.previousUnitCost = Number(product.unitCost);
        movement.previousUnitPrice = Number(product.unitPrice);
        movement.newStock = newStock;
        movement.newUnitCost = dto.newUnitCost ? Number(dto.newUnitCost) : Number(product.unitCost);
        movement.newUnitPrice = dto.newUnitPrice ? Number(dto.newUnitPrice) : Number(product.unitPrice);
        movement.quantityAdded = Number(dto.quantityAdded);
        movement.type = type;
        movement.reason = dto.reason || null;
        movement.userId = userId;
        movement.userName = userName;

        // Actualizar el producto
        product.stock = newStock;
        if (dto.newUnitCost) product.unitCost = Number(dto.newUnitCost);
        if (dto.newUnitPrice) product.unitPrice = Number(dto.newUnitPrice);
        await this.productRepository.save(product);

        return this.movementRepository.save(movement);
    }

    async findAll(dto: GetStockMovementsDto): Promise<PaginatedResponseDto<StockMovement>> {
        const { limit = 10, offset = 0, productId, startDate, endDate } = dto;

        const query = this.movementRepository
            .createQueryBuilder("movement")
            .orderBy("movement.created_at", "DESC")
            .skip(offset)
            .take(limit);

        if (productId) {
            query.andWhere("movement.product_id = :productId", { productId });
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.andWhere("movement.created_at BETWEEN :start AND :end", { start, end });
        }

        const [data, total] = await query.getManyAndCount();
        return new PaginatedResponseDto(data, total, limit, offset);
    }

    async findByProduct(productId: number): Promise<StockMovement[]> {
        return this.movementRepository.find({
            where: { productId },
            order: { createdAt: "DESC" },
        });
    }
}