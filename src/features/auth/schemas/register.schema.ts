import { z } from 'zod';

export const studentSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Student name must be at least 2 characters')
    .max(100, 'Student name is too long'),
  email: z
    .string()
    .email('Invalid student email address'),
  gender: z.enum(['MALE', 'FEMALE'], {
    error: () => ({ message: 'Gender is required' })
  }),
  yearLevel: z.string().min(1, 'Year level is required'),
  schoolName: z
    .string()
    .min(2, 'School name must be at least 2 characters')
    .max(200, 'School name is too long'),
});

export const registerSchema = z.object({
  parent: z.object({
    fullName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long'),
    email: z
      .string()
      .email('Invalid parent email address'),
    phoneNumber: z
      .string()
      .min(6, 'Phone number is too short')
      .max(20, 'Phone number is too long'),
    address: z
      .string()
      .min(5, 'Address is too short'),
  }),
  students: z
    .array(studentSchema)
    .min(1, 'At least one student is required'),
});

export type RegisterValues = z.infer<typeof registerSchema>;
