import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateProductDto } from '../dto/create-product.dto';
import { GetProductsDto } from '../dto/get-products.dto';
import { PaginatedResponseDto } from 'src/core/dto/paginated-response.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

export interface IReport {
  totalCost: number;
  totalPrice: number;
  earns: number;
}

interface PictureIndex {
  [picture: string]: number;
}

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  create(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(dto);
    return this.productRepository.save(product);
  }

  async createMany(dtos: CreateProductDto[]): Promise<void> {
    const products = this.productRepository.create(dtos);
    await this.productRepository.save(products);
  }

  async findAll(dto: GetProductsDto): Promise<PaginatedResponseDto<Product>> {
    const { limit = 10, offset = 0, name, category, investor, skipEmpty } = dto;

    const query = this.productRepository
      .createQueryBuilder('product')
      .skip(offset)
      .take(limit);

    if (name) query.andWhere('product.name LIKE :name', { name: `%${name}%` });

    if (category) query.andWhere('product.category = :category', { category });

    if (investor) query.andWhere('product.investor = :investor', { investor });

    if (skipEmpty) query.andWhere('product.stock > 0');

    const [data, total] = await query.getManyAndCount();

    return new PaginatedResponseDto(data, total, limit, offset);
  }

  async getIndexByPicture(pictures: string[]): Promise<PictureIndex> {
    const query = await this.productRepository
      .createQueryBuilder('product')
      .where('product.picture IN (:...pictures)', { pictures })
      .getMany();

    const index: PictureIndex = query.reduce((prev, curr) => {
      if (!curr.picture) return prev;
      const index = prev;
      index[curr.picture] = curr.id;
      return index;
    }, {} as PictureIndex);
    return index;
  }

  async update(id: number, dto: UpdateProductDto): Promise<void> {
    const data = await this.productRepository.update(id, dto);
    if (!data.affected)
      throw new NotFoundException(`Producto con ID ${id} no se pudo editar`);
  }

  async updateStock(
    id: number,
    quantity: number,
    manager: EntityManager,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
    });
    if (!product)
      throw new NotFoundException(
        `Producto con ID ${id.toString()} no encontrado`,
      );
    if (+product.stock + quantity < 0)
      throw new BadRequestException(
        `El Stock del producto ${product.name} no puede ser menor que 0`,
      );

    product.stock = +product.stock + quantity;

    return manager?.save(product);
  }

  async calculateAllStock(): Promise<IReport> {
    const products = await this.productRepository.find();

    let totalCost = 0;
    let totalPrice = 0;

    for (const product of products) {
      const stock = product.stock;
      const cost = product.unitCost;
      const price = product.unitPrice;

      totalCost += +cost * +stock;
      totalPrice += +price * +stock;
    }

    return {
      totalCost,
      totalPrice,
      earns: totalPrice - totalCost,
    };
  }
}
