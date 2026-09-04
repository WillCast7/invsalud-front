export interface NotificationInterface {
    id: number;              // ID de user_notification
    notificationId?: number;  // ID de notification
    userId?: number;
    title: string;
    message: string;
    category: string;        // 'SECURITY', 'EXPIRATION_MEDICINE', 'CONTRACT'
    priority: 'INFO' | 'WARNING' | 'CRITICAL' | string;
    targetUrl?: string;      // Ruta interna en Angular para navegación directa
    createdAt: string;
    isRead: boolean;
    readAt?: string | null;
}

export const NotificationInitializer: NotificationInterface = {
    id: 0,
    notificationId: 0,
    userId: 0,
    title: '',
    message: '',
    category: 'SECURITY',
    priority: 'INFO',
    targetUrl: '',
    createdAt: new Date().toISOString(),
    isRead: false,
    readAt: null
};