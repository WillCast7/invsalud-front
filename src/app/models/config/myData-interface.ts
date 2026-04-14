

export interface MyDataInterface {
    id: number;
    userName: string;
    nombre: string;
    email: string;
    extension: string;
    status: number;
    sedeId: number;
    idDepartament: number;
    CreatedAt: Date;
    Role: string;
    
}

export const MyDataInitializer: MyDataInterface = {
    id: 0,
    userName: "",
    nombre: "",
    email: "",
    extension: "",
    status: 0,
    sedeId: 0,
    idDepartament: 0,
    CreatedAt: new Date(),
    Role: "",
   
};
