export type AiRubricWritingType = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ListWritingTypesResponse = {
  success: boolean;
  message: string;
  data: AiRubricWritingType[];
};
