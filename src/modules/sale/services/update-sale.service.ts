import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Sale } from '../entities/sale.entity';

@Injectable()
export class UpdateSaleService {
  async charge(sale: Sale, manager: EntityManager) {
    sale.status = 'charged';
    await manager.save(sale);
    return sale;
  }
}
