// tests/settings/NotificationSettings.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationSettings from '@/app/settings/components/NotificationSettings';

// Mock toast utils
vi.mock('@/lib/utils/toast', () => ({
  toastUtils: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock notification preferences store
const mockStore = {
  permissionStatus: 'default' as NotificationPermission,
  pushEnabled: false,
  deadlinesEnabled: true,
  classesEnabled: true,
  eventsEnabled: false,
  deadlineReminderTiming: 30,
  classReminderTiming: 15,
  eventReminderTiming: 60,
  initialize: vi.fn(),
  requestPermission: vi.fn().mockResolvedValue('granted'),
  setDeadlinesEnabled: vi.fn(),
  setClassesEnabled: vi.fn(),
  setEventsEnabled: vi.fn(),
  setPushEnabled: vi.fn(),
  setDeadlineReminderTiming: vi.fn(),
  setClassReminderTiming: vi.fn(),
  setEventReminderTiming: vi.fn(),
};

vi.mock('@/lib/store/notificationPreferencesStore', () => ({
  useNotificationPreferencesStore: (selector?: (state: typeof mockStore) => unknown) =>
    selector ? selector(mockStore) : mockStore,
}));

// Mock Notification API in window
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  },
  writable: true,
});

describe('NotificationSettings', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      notifications: 'Notifications',
      deadlineReminders: 'Deadline Reminders',
      deadlineRemindersDesc: 'Get notified before deadlines',
      classReminders: 'Class Reminders',
      classRemindersDesc: 'Get notified before classes',
      eventUpdates: 'Event Updates',
      eventUpdatesDesc: 'Get notified about events',
      enabled: 'Enabled',
      disabled: 'Disabled',
      enable: 'Enable',
      on: 'On',
      off: 'Off',
      are: 'are',
      clickTo: 'Click to',
      pushNotificationsActive: 'Push notifications active',
      pushNotificationsBlocked: 'Push notifications blocked',
      enablePushNotifications: 'Enable push notifications',
      pushActiveDesc: 'You will receive browser notifications',
      pushBlockedDesc: 'Notifications are blocked in your browser',
      pushPromptDesc: 'Allow notifications to stay updated',
      pushNotifications: 'Push notifications',
      preferenceUpdated: 'Preference Updated',
      pushNotificationsToggle: 'Push notifications {{status}}',
      notificationsEnabled: 'Notifications Enabled',
      notificationsEnabledMsg: 'You will now receive notifications',
      permissionDenied: 'Permission Denied',
      permissionDeniedMsg: 'Notifications are blocked',
      remindMe: 'Remind me',
      reminderTimingFor: 'Reminder timing for {{type}}',
      reminderTimingUpdated: 'Reminder timing updated',
      reminderTimingUpdatedMsg: 'You will be reminded {{timing}} before',
      timing15min: '15 minutes',
      timing30min: '30 minutes',
      timing1hour: '1 hour',
      timing2hours: '2 hours',
      timing1day: '1 day',
      timing2days: '2 days',
      before: 'before',
      browserNotificationInfo: 'Notifications will appear in your browser',
    };
    return translations[key] || key;
  });

  const defaultProps = {
    notifications: { deadlines: true, classes: true, events: false },
    setNotifications: vi.fn(),
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock store state
    mockStore.permissionStatus = 'default';
    mockStore.pushEnabled = false;
    mockStore.deadlinesEnabled = true;
    mockStore.classesEnabled = true;
    mockStore.eventsEnabled = false;
  });

  it('renders notification settings card', () => {
    render(<NotificationSettings {...defaultProps} />);

    expect(screen.getByTestId('notification-settings')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders notification type items', () => {
    render(<NotificationSettings {...defaultProps} />);

    expect(screen.getByTestId('notification-item-deadlines')).toBeInTheDocument();
    expect(screen.getByTestId('notification-item-classes')).toBeInTheDocument();
    expect(screen.getByTestId('notification-item-events')).toBeInTheDocument();
  });

  it('renders toggle buttons for each notification type', () => {
    render(<NotificationSettings {...defaultProps} />);

    expect(screen.getByTestId('toggle-deadlines-notifications')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-classes-notifications')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-events-notifications')).toBeInTheDocument();
  });

  it('shows enabled/disabled state correctly', () => {
    render(<NotificationSettings {...defaultProps} />);

    const deadlinesToggle = screen.getByTestId('toggle-deadlines-notifications');
    const eventsToggle = screen.getByTestId('toggle-events-notifications');

    expect(deadlinesToggle).toHaveAttribute('aria-checked', 'true');
    expect(eventsToggle).toHaveAttribute('aria-checked', 'false');
  });

  it('calls setDeadlinesEnabled when deadline toggle is clicked', () => {
    render(<NotificationSettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('toggle-deadlines-notifications'));
    expect(mockStore.setDeadlinesEnabled).toHaveBeenCalledWith(false);
  });

  it('calls setClassesEnabled when class toggle is clicked', () => {
    render(<NotificationSettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('toggle-classes-notifications'));
    expect(mockStore.setClassesEnabled).toHaveBeenCalledWith(false);
  });

  it('calls setEventsEnabled when events toggle is clicked', () => {
    render(<NotificationSettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('toggle-events-notifications'));
    expect(mockStore.setEventsEnabled).toHaveBeenCalledWith(true);
  });

  it('renders push notification banner', () => {
    render(<NotificationSettings {...defaultProps} />);

    expect(screen.getByTestId('push-notification-banner')).toBeInTheDocument();
  });

  it('shows enable button when permission is default', () => {
    render(<NotificationSettings {...defaultProps} />);

    expect(screen.getByTestId('enable-notifications-button')).toBeInTheDocument();
  });

  it('calls requestPermission when enable button is clicked', async () => {
    render(<NotificationSettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('enable-notifications-button'));
    await waitFor(() => {
      expect(mockStore.requestPermission).toHaveBeenCalled();
    });
  });

  it('shows push toggle when permission is granted', () => {
    mockStore.permissionStatus = 'granted';
    render(<NotificationSettings {...defaultProps} />);

    expect(screen.getByTestId('toggle-push-notifications')).toBeInTheDocument();
  });

  it('toggles push notifications when button is clicked', () => {
    mockStore.permissionStatus = 'granted';
    render(<NotificationSettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('toggle-push-notifications'));
    expect(mockStore.setPushEnabled).toHaveBeenCalledWith(true);
  });

  it('initializes store on mount', () => {
    render(<NotificationSettings {...defaultProps} />);
    expect(mockStore.initialize).toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<NotificationSettings {...defaultProps} />);

    const region = screen.getByRole('region', { name: 'Notifications' });
    expect(region).toBeInTheDocument();
  });
});
