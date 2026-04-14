import { ProductInterface } from "./product-interface"
import { ThirdPartyExample, ThirdPartyInterface } from "./thirdparty-interface"

export interface ResolutionInterface {
    id: number,
    thirdParty: ThirdPartyInterface,
    code: string,
    startDate: string,
    expirationDate: string,
    description: string,
    isActive: boolean,
    createdAt: Date,
    createdBy: string,
    products?: ProductInterface[]
}

export const ResolutionInitializer: ResolutionInterface = {
    id: 0,
    thirdParty: ThirdPartyExample,
    code: '',
    startDate: '',
    expirationDate: '',
    description: '',
    isActive: false,
    createdAt: new Date(),
    createdBy: ''
}
