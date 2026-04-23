// Global types definition
export type Role = 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN';

export interface BaseResponse<T> {
  data: T;
  message?: string;
  status: number;
}
