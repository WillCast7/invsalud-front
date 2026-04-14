
export interface CustomerTypeInterface{
    id: number;
    name: string;
    type: string;
    locked: string;
    dataSource: string;
}

export const CustomerTypeInitializer: CustomerTypeInterface ={
    id: 0,
    name: '',  
    type: '',
    locked: '',
    dataSource: ''
}