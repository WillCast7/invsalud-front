import { BatchExample, BatchInterface } from "./batch-interface";
import { ProductExample, ProductInterface } from "./product-interface";

export interface PurchasingItemInterface {
    id: number,
    product: ProductInterface,
    batch: BatchInterface,
    priceUnit: number,
    units: number,
    sellPrice: number,
    expirationDate: Date,
    priceTotal: number,

}

export const PurchasingItemExample: PurchasingItemInterface = {
    id: 0,
    batch: BatchExample,
    product: ProductExample,
    priceUnit: 0,
    units: 0,
    sellPrice: 0,
    expirationDate: new Date(),
    priceTotal: 0
}