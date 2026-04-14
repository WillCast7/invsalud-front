export interface DepartmentInterface{
    name: string;
    code: string;
    phoneCode?: number;
}

export const DepartmentInitializer: DepartmentInterface ={
    name: '',  
    code: ''
}