export interface StudentCalendarReminder {
  id: string;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertStudentCalendarReminderPayload {
  date: string;
  note: string;
}

export interface StudentCalendarRemindersResponse {
  success: boolean;
  message: string;
  data: StudentCalendarReminder[];
}

export interface StudentCalendarReminderResponse {
  success: boolean;
  message: string;
  data: StudentCalendarReminder;
}

export interface ActionResponse {
  success: boolean;
  message: string;
}
