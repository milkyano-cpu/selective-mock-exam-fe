import mdwClient from '@/lib/mdwClient';
import type {
  ActionResponse,
  StudentCalendarReminderResponse,
  StudentCalendarRemindersResponse,
  UpsertStudentCalendarReminderPayload,
} from '../types/student-calendar.types';

export const studentCalendarService = {
  listReminders: async (): Promise<StudentCalendarRemindersResponse> => {
    const response = await mdwClient.get('/student-calendar/reminders');
    return response.data;
  },

  saveReminder: async (
    payload: UpsertStudentCalendarReminderPayload,
  ): Promise<StudentCalendarReminderResponse> => {
    const response = await mdwClient.post('/student-calendar/reminders', payload);
    return response.data;
  },

  importReminders: async (
    reminders: UpsertStudentCalendarReminderPayload[],
  ): Promise<StudentCalendarRemindersResponse> => {
    const response = await mdwClient.post('/student-calendar/reminders/bulk', { reminders });
    return response.data;
  },

  removeReminder: async (id: string): Promise<ActionResponse> => {
    const response = await mdwClient.delete(`/student-calendar/reminders/${id}`);
    return response.data;
  },
};
