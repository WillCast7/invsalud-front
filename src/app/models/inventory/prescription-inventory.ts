import { BatchExample, BatchInterface } from "./batch-interface"
import { ProductExample, ProductInterface } from "./product-interface"


export interface PrescriptionInventoryInterface {
    id: number,
    product: ProductInterface,
    batch: BatchInterface,
    purchasePrice: number,
    salePrice: number,
    totalUnits: number,
    availableUnits: number,
    expirationDate: Date,
    createdBy: string,
    createdAt: Date,
    isActive: boolean,
    withdrawalBy: number,
    withdrawnAt: Date,
    withdrawalCode: string,
    withdrawalType: string
}

export const PrescriptionInventoryExample: PrescriptionInventoryInterface = {
    id: 0,
    product: ProductExample,
    batch: BatchExample,
    purchasePrice: 0,
    salePrice: 0,
    totalUnits: 0,
    availableUnits: 0,
    expirationDate: new Date(),
    createdBy: '',
    createdAt: new Date(),
    isActive: false,
    withdrawalBy: 0,
    withdrawnAt: new Date(),
    withdrawalCode: '',
    withdrawalType: ''
}