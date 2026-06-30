export interface CompanyInterface {
    id: number;
    nit: string;
    name: string;
    legalName: string;
    taxId: string;
    email: string;
    phone: string;
    address: string;
    country: string;
    type: string;
    city: string;
    website: string;
    logoUrl: string;
    logoOrder: string;
    logoSold: string;
    logoPurchasing: string;
    subscriptionPlan: string;
    nameApp: string;
    createdAt: Date;
    isActive: boolean;
}

export const CompanyInitializer: CompanyInterface = {
    id: 0,
    nit: '',
    name: '',
    legalName: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    type: '',
    city: '',
    website: '',
    logoUrl: '',
    logoOrder: '',
    logoSold: '',
    logoPurchasing: '',
    subscriptionPlan: '',
    nameApp: '',
    createdAt: new Date(),
    isActive: true
}