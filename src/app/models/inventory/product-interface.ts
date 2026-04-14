
export interface ProductInterface {
    id: number;
    name: string;
    type: string;
    code: string;
    concentration: string;
    presentation: string;
    pharmaceuticalForm: string;
    active: boolean;
    details: string;
    isPublicHealth: boolean;
    isActive: boolean;
}

export const ProductExample: ProductInterface = {
    id: 0,
    name: '',
    type: '',
    code: '',
    concentration: '',
    presentation: '',
    pharmaceuticalForm: '',
    active: false,
    details: '',
    isPublicHealth: false,
    isActive: false
}