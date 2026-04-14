import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { NotificationInterface } from "../models/notifications/notification-interface";


@Injectable({providedIn: 'root'})
export class NotificationStoreService{
    private readonly storageKey = 'notifications';
    private notificationsSubject = new BehaviorSubject<NotificationInterface[]>(this.getFromLocalStorage());
    notifications$ = this.notificationsSubject.asObservable();

    private getFromLocalStorage(): NotificationInterface[] {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    private updateState(notifications: NotificationInterface[]) {
        localStorage.setItem(this.storageKey, JSON.stringify(notifications));
        this.notificationsSubject.next(notifications);
    }

    setInitialNotifications(list: NotificationInterface[]) {
        this.updateState(list);
    }

    addNotification(notification: NotificationInterface) {
        const current = this.notificationsSubject.value;
        this.updateState([notification, ...current]);
    }

    markAsRead(id: number) {
        const updated = this.notificationsSubject.value.map(n =>
            n.id === id ? {
          ...n,
          recipient: { ...n.recipient, status: 'VISTO' }
        } : n
        );
        this.updateState(updated);
    }

    clearAll() {
        this.updateState([]);
    }
}