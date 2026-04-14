export interface OrderInterface {
    id: number,
    thirdParty: string,
    total: number,
    status: string,
    observations: string,
    orderCode: string,
    soldCode: string, //no
    createdAt: Date,
    expirateAt: Date,
    soldAt: Date, //no
    soldBy: Date, //no
    isActive: boolean, //no
    isSold: boolean, //no
    type: string //no
}

export const OrderExample: OrderInterface = {
    id: 0,
    thirdParty: '',
    total: 0,
    status: '',
    observations: '',
    orderCode: '',
    soldCode: '',
    createdAt: new Date(),
    expirateAt: new Date(),
    soldAt: new Date(),
    soldBy: new Date(),
    isActive: false,
    isSold: false,
    type: ''
}