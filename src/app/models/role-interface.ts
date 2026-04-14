import { PermissionInterface } from "./permission-interface";


export interface RoleInterface {
    id: number;
    role: string;
    roleDescription: string;
    roleName: string;
    status: boolean;
    permissionList: PermissionInterface[];
}

export const RoleInitializer: RoleInterface = {
    id: 0,
    role: '',
    roleDescription: '',
    roleName: '',
    status: true,
    permissionList: []
};