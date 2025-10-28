export interface SaleItemLegacy {
  _id: {
    $oid: string;
  };
  producto: {
    $oid: string;
  };
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface SaleLegacy {
  _id: {
    $oid: string;
  };
  fecha: {
    $date: string;
  };
  items: SaleItemLegacy[];
  total: number;
  metodoPago: string;
  createdAt: {
    $date: string;
  };
  updatedAt: {
    $date: string;
  };
}
