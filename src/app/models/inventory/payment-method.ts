export interface PaymentMethod{
    id: number,
    code: string,
    name: string,
    description: string,
    isActive: boolean,
    order: number
}
export const PaymentMethodExample: PaymentMethod = {
    id: 0,
    code: '',
    name: '',
    description: '',
    isActive: false,
    order: 0
}