// ============================================================
// src/services/notificationService.js
// WHAT:   Local (on-device) daily reminder for collectors, listing
//         how many of their customers haven't paid today.
//
// WHY LOCAL, NOT PUSH:   SusuPro has no backend server to trigger a
//         push notification at 9am with a live count, and this is a
//         managed Expo app run through Expo Go. So instead: every
//         time the Dashboard loads fresh data, it recomputes the
//         collector's "not paid today" count and reschedules this
//         local notification for the next 9am with that count. The
//         reminder is accurate as of the collector's last time in
//         the app, which is close enough for a "don't forget"
//         nudge — it doesn't need to be live-live.
// ============================================================

import * as Notifications from 'expo-notifications';

const UNPAID_REMINDER_ID = 'susupro-unpaid-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── PERMISSIONS ────────────────────────────────────────────────
export async function requestNotificationPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── SCHEDULE / REPLACE THE DAILY REMINDER ───────────────────────
// count = number of the collector's customers who haven't paid
// today. Pass 0 (or omit) to clear the reminder — nothing to remind
// them about.
export async function scheduleUnpaidReminder(count) {
  await Notifications.cancelScheduledNotificationAsync(UNPAID_REMINDER_ID).catch(() => {});

  if (!count || count <= 0) return;

  await Notifications.scheduleNotificationAsync({
    identifier: UNPAID_REMINDER_ID,
    content: {
      title: 'SusuPro reminder',
      body: `${count} customer${count === 1 ? '' : 's'} ${count === 1 ? "hasn't" : "haven't"} paid today.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
}

export async function cancelUnpaidReminder() {
  await Notifications.cancelScheduledNotificationAsync(UNPAID_REMINDER_ID).catch(() => {});
}
