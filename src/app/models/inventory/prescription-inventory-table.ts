import { BatchExample, BatchInterface } from "./batch-interface"
import { ProductExample, ProductInterface } from "./product-interface"


export interface PrescriptionInventoryTableInterface {
    id: number,
    code?: string,
    client?: string,
    product: string,
    presentation?: string,
    pharmaceuticalForm?: string,
    batch: string,
    purchasePrice: number,
    salePrice: number,
    totalPrice?: number,
    totalUnits: number,
    availableUnits: number,
    expirationDate: Date,
    date?: Date,
    isActive: boolean,
    /*     withdrawalBy: number,
        withdrawnAt: Date,
        withdrawalCode: string,
        withdrawalType: string */
}

export const PrescriptionInventoryTableExample: PrescriptionInventoryTableInterface = {
    id: 0,
    code: '',
    client: '',
    product: '',
    presentation: '',
    pharmaceuticalForm: '',
    batch: '',
    purchasePrice: 0,
    salePrice: 0,
    totalPrice: 0,
    totalUnits: 0,
    availableUnits: 0,
    expirationDate: new Date(),
    date: new Date(),
    isActive: false,
    /*     withdrawalBy: 0,
        withdrawnAt: new Date(),
        withdrawalCode: '',
        withdrawalType: '' */
}