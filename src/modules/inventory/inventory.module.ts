import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { ProductController } from './controllers/product.controller';
import { StockMovementController } from './controllers/stock-movement.controller';
import { ProductService } from './services/product.service';
import { ProductPictureService } from './services/product-picture.service';
import { StockMovementService } from './services/stock-movement.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, StockMovement])], // StockMovement está aquí
  controllers: [ProductController, StockMovementController],
  providers: [ProductService, ProductPictureService, StockMovementService],
  exports: [ProductService, StockMovementService],
})
export class InventoryModule { }