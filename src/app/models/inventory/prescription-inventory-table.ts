import { BatchExample, BatchInterface } from "./batch-interface"
import { ProductExample, ProductInterface } from "./product-interface"


export interface PrescriptionInventoryTableInterface {
    id: number,
    product: string,
    batch: string,
    purchasePrice: number,
    salePrice: number,
    totalUnits: number,
    availableUnits: number,
    expirationDate: Date,
    isActive: boolean,
    /*     withdrawalBy: number,
        withdrawnAt: Date,
        withdrawalCode: string,
        withdrawalType: string */
}

export const PrescriptionInventoryTableExample: PrescriptionInventoryTableInterface = {
    id: 0,
    product: '',
    batch: '',
    purchasePrice: 0,
    salePrice: 0,
    totalUnits: 0,
    availableUnits: 0,
    expirationDate: new Date(),
    isActive: false,
    /*     withdrawalBy: 0,
        withdrawnAt: new Date(),
        withdrawalCode: '',
        withdrawalType: '' */
}