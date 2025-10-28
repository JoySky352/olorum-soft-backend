export interface ProductLegacy {
  _id: {
    $oid: string;
  };
  nombre: string;
  descripcion: string;
  precioCosto: number;
  precioVenta: number;
  stock: number;
  categoria?: string;
  proveedor?: string;
  createdAt: {
    $date: string;
  };
  updatedAt: {
    $date: string;
  };
}
