import { ResolutionInterface } from "./resolution-interface";
import { ThirdpartyRoleInterface } from "./thirdparty-role-interface";

export interface ThirdPartyInterface {
    id: number,
    documentType: string,
    documentNumber: string,
    fullName: string,
    email: string,
    phoneNumber: string,
    phone?: string,
    address: string,
    createdAt: Date,
    createdBySystemUserId: number,
    roles: Set<ThirdpartyRoleInterface>,
    resolutions?: ResolutionInterface[]
}

export const ThirdPartyExample: ThirdPartyInterface = {
    id: 0,
    documentType: '',
    documentNumber: '',
    fullName: '',
    email: '',
    address: '',
    phoneNumber: '',
    phone: '',
    createdAt: new Date(),
    createdBySystemUserId: 0,
    roles: new Set<ThirdpartyRoleInterface>()
}