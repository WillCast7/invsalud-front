export interface DetailsCustomerInterface {
    docEntry: number;
    createDate: Date;
    docTotal: number;
    productNames: string;
    slpName: string;
}

export const DetailsCustomerInitializer: DetailsCustomerInterface = {
    docEntry: 0,
    createDate: new Date(),
    docTotal: 0,
    productNames: '',
    slpName: '',
}
