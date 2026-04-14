export interface SalesInterface {
    itemCode: string;
    cardName: string;
    itemName: string;
    firmName: string;
    createDate: Date;
    total: number;
    quantity: number;
    billNumber: number;
    docEntry: number;
}

export const SalesInitializer: SalesInterface = {
    itemCode: '',
    cardName: '',
    itemName: '',
    firmName: '',
    createDate: new Date(),
    total: 0,
    quantity: 0,
    billNumber: 0,
    docEntry: 0
}
