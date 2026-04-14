
export interface BatchInterface {
    id: number;
    code: string;
    details: string;
    createdAt: Date;
    createdBy: number;
    isActive: boolean;
}

export const BatchExample: BatchInterface = {
    id: 0,
    code: '',
    details: '',
    createdAt: new Date(),
    createdBy: 0,
    isActive: true
}