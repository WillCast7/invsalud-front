import { PersonTableInitializer, PersonTableInterface } from "./person-interface";
import { RoleInitializer, RoleInterface } from "./role-interface";


export interface UserTableInterface {
    id: number;
    email: string;
    userName: string;
    documentType: string;
    documentNumber: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    birthDate: Date;
}

export const UserTableInitializer: UserTableInterface = {
    id: 0,
    email: '',
    userName: '',
    documentType: '',
    documentNumber: '',
    fullName: '',
    phoneNumber: '',
    address: '',
    birthDate: new Date()
};

export interface UserInterface {
    id: number;
    email: string;
    userName: string;
    enable: boolean;
    role: RoleInterface;
    person: PersonTableInterface;
}

export const UserInitializer: UserInterface = {
    id: 0,
    email: '',
    userName: '',
    enable: true,
    role: RoleInitializer,
    person: PersonTableInitializer
};