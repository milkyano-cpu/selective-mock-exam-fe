import mdwClient, { buildFeedbackHeaders, type MdwRequestOptions } from '@/lib/mdwClient';
import type { ListWritingTypesResponse } from '../types/ai-rubric-writing-types.types';

export const aiRubricWritingTypesService = {
  list: async (options?: MdwRequestOptions): Promise<ListWritingTypesResponse> => {
    const response = await mdwClient.get('/ai-rubric-writing-types', { headers: buildFeedbackHeaders(options) });
    return response.data;
  },
};
