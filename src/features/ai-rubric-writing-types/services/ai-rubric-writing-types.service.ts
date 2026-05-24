import mdwClient from '@/lib/mdwClient';
import type { ListWritingTypesResponse } from '../types/ai-rubric-writing-types.types';

export const aiRubricWritingTypesService = {
  list: async (): Promise<ListWritingTypesResponse> => {
    const response = await mdwClient.get('/ai-rubric-writing-types');
    return response.data;
  },
};
