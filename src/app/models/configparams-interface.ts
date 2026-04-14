export interface ConfigparamsInterface {
    id?: number;
    name: string;
    parent: string;
    shortname: string;
    definition: string;
    isActive: boolean;
    active?: boolean;
    order: number;
}

export const ConfigparamsInitializer: ConfigparamsInterface = {
    id: 0,
    name: '',
    parent: '',
    shortname: '',
    definition: '',
    isActive: true,
    order: 0
}