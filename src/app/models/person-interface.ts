

export interface PersonTableInterface {
    id: number;
    documentType: string;
    documentNumber: string;
    names: string;
    surnames: string;
    phoneNumber: string;
    address: string;
    birthDate: Date;
}

export const PersonTableInitializer: PersonTableInterface = {
    id: 0,
    documentType: '',
    documentNumber: '',
    names: '',
    surnames: '',
    phoneNumber: '',
    address: '',
    birthDate: new Date()
};
