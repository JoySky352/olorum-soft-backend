import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { appendFile } from 'fs/promises';

@Injectable()
export class ProductPictureService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async savePicture(id: number, file: Express.Multer.File) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product)
      throw new BadRequestException(`Producto con ID: ${id} no encontrado`);
    const name = randomUUID();
    await appendFile(`uploads/${name}`, file.buffer);
    product.picture = name;
    await this.productRepository.save(product);
  }
}
