export interface AuditLogInterface {
    id: number,
    tableName: string,
    recordId: string,
    actionType: string,
    actionTimestamp: string,
    performedBy: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
}

const AuditLog: AuditLogInterface = {
    id: 0,
    tableName: '',
    recordId: '',
    actionType: '',
    actionTimestamp: '',
    performedBy: '',
    oldValues: {},
    newValues: {}
}