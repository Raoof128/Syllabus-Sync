// lib/services/notificationService.ts
'use client';

import { STORAGE_KEYS } from '@/lib/constants';
import { logger } from '@/lib/logger';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
  onClick?: () => void;
}

/**
 * NotificationService handles browser push notifications
 * and in-app notification preferences
 */
class NotificationService {
  private static instance: NotificationService;
  private notificationClickHandlers: Map<string, () => void> = new Map();
  private isInitialized = false;

  private constructor() {
    // Initialize only once
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Set up notification click handler
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Listen for service worker messages (for notification clicks)
      if ('serviceWorker' in navigator) {
        try {
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'NOTIFICATION_CLICK') {
              const handler = this.notificationClickHandlers.get(event.data.tag);
              if (handler) {
                handler();
                this.notificationClickHandlers.delete(event.data.tag);
              }
            }
          });
        } catch (error) {
          logger.error('Failed to register service worker message listener:', error);
        }
      }
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Check if browser notifications are supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermissionStatus {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission as NotificationPermissionStatus;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) return 'unsupported';

    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermissionStatus;
    } catch (error) {
      logger.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Send a browser notification
   */
  async sendNotification(options: NotificationOptions): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    const permission = this.getPermissionStatus();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      // Prefer service worker notifications if available (more resilient when tab is hidden)
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration?.showNotification) {
            await registration.showNotification(options.title, {
              body: options.body,
              icon: options.icon || '/MQ_Logo_Final.png',
              tag: options.tag,
              data: options.data,
            });
            // Register click handler for service worker notifications
            if (options.tag && options.onClick) {
              this.notificationClickHandlers.set(options.tag, options.onClick);
            }
            return true;
          }
        } catch (swError) {
          console.warn(
            'Service worker notification failed, falling back to standard notification:',
            swError,
          );
        }
      }

      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/MQ_Logo_Final.png',
        tag: options.tag,
        data: options.data,
      });

      if (options.onClick && options.tag) {
        this.notificationClickHandlers.set(options.tag, options.onClick);
      }

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) {
          options.onClick();
        }
      };

      return true;
    } catch (error) {
      logger.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Check if a specific notification type is enabled
   */
  isNotificationTypeEnabled(type: 'deadlines' | 'classes' | 'events'): boolean {
    if (typeof window === 'undefined') return false;

    const storageKey =
      type === 'deadlines'
        ? STORAGE_KEYS.NOTIFICATION_DEADLINES
        : type === 'classes'
          ? STORAGE_KEYS.NOTIFICATION_CLASSES
          : STORAGE_KEYS.NOTIFICATION_EVENTS;

    const value = localStorage.getItem(storageKey);
    return value === null ? true : value === 'true';
  }

  /**
   * Set notification type preference
   */
  setNotificationTypeEnabled(type: 'deadlines' | 'classes' | 'events', enabled: boolean): void {
    if (typeof window === 'undefined') return;

    const storageKey =
      type === 'deadlines'
        ? STORAGE_KEYS.NOTIFICATION_DEADLINES
        : type === 'classes'
          ? STORAGE_KEYS.NOTIFICATION_CLASSES
          : STORAGE_KEYS.NOTIFICATION_EVENTS;

    localStorage.setItem(storageKey, enabled.toString());
  }

  /**
   * Send deadline reminder notification
   */
  async sendDeadlineReminder(
    deadlineTitle: string,
    unitCode: string,
    dueDate: Date,
    deadlineId: string,
  ): Promise<boolean> {
    if (!this.isNotificationTypeEnabled('deadlines')) return false;

    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const minutesUntil = Math.floor(timeDiff / (1000 * 60));
    const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
    const daysUntil = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    let timeText: string;
    if (minutesUntil < 60) {
      // Less than an hour - show minutes
      timeText = minutesUntil <= 1 ? 'in 1 minute' : `in ${minutesUntil} minutes`;
    } else if (hoursUntil < 24) {
      // Less than a day - show hours
      timeText = hoursUntil === 1 ? 'in 1 hour' : `in ${hoursUntil} hours`;
    } else {
      // Days
      timeText = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
    }

    return this.sendNotification({
      title: `📅 Deadline Reminder: ${unitCode}`,
      body: `"${deadlineTitle}" is due ${timeText}`,
      tag: `deadline-${deadlineId}`,
      data: { type: 'deadline', id: deadlineId },
      onClick: () => {
        window.location.href = '/calendar';
      },
    });
  }

  /**
   * Send class reminder notification
   */
  async sendClassReminder(
    unitCode: string,
    unitName: string,
    building: string,
    room: string,
    startTime: string,
  ): Promise<boolean> {
    if (!this.isNotificationTypeEnabled('classes')) return false;

    return this.sendNotification({
      title: `📚 Class Starting Soon: ${unitCode}`,
      body: `${unitName} at ${building} ${room} - ${startTime}`,
      tag: `class-${unitCode}-${Date.now()}`,
      data: { type: 'class', unitCode },
      onClick: () => {
        window.location.href = '/home';
      },
    });
  }

  /**
   * Send event reminder notification
   */
  async sendEventReminder(
    eventTitle: string,
    eventLocation: string,
    eventTime: string,
    eventId: string,
  ): Promise<boolean> {
    if (!this.isNotificationTypeEnabled('events')) return false;

    return this.sendNotification({
      title: `🎉 Event Reminder`,
      body: `${eventTitle} at ${eventLocation} - ${eventTime}`,
      tag: `event-${eventId}`,
      data: { type: 'event', id: eventId },
      onClick: () => {
        window.location.href = '/feed';
      },
    });
  }
}

export const notificationService = NotificationService.getInstance();
