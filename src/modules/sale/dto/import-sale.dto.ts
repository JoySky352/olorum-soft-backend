export interface ImportSaleItemDto {
  productId: number;
  quantity: number;
  quantityRefunded: number;
  refunded: number;
  total: number;
  unitPrice: number;
}
export interface ImportSaleDto {
  paymentMethod: string;
  createdAt: Date;
  refunded: number;
  status: 'created' | 'charged' | 'refunded';
  total: number;
  updatedAt: Date;
  items: ImportSaleItemDto[];
}
