import { PurchasingItemInterface } from "./purchasing-item-interface";
import { ThirdPartyExample, ThirdPartyInterface } from "./thirdparty-interface";

export interface PurchaseTableInterface {
    id: number,
    thirdParty: string,
    total: number,
    type: string,
    createdAt: string,
    purchasedBy: string,
    purchasedCode: string,
    isActive: boolean,
    purchasingItems?: PurchasingItemInterface[],
}

export const PurchaseTableExample: PurchaseTableInterface = {
    id: 0,
    thirdParty: '',
    total: 0,
    type: '',
    createdAt: '',
    purchasedBy: '',
    purchasedCode: '',
    isActive: false,
    purchasingItems: [],
}

export interface PurchaseInterface {
    id: number,
    thirdParty: ThirdPartyInterface,
    total: number,
    type: string,
    createdAt: string,
    purchasedBy: string,
    purchasedCode: string,
    isActive: boolean,
    items?: PurchasingItemInterface[],
}

export const PurchaseExample: PurchaseInterface = {
    id: 0,
    thirdParty: ThirdPartyExample,
    total: 0,
    type: '',
    createdAt: '',
    purchasedBy: '',
    purchasedCode: '',
    isActive: false,
    items: [],
}

