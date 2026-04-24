import { z } from 'zod';
import { nonEmptyString } from '@/schemas/_utils';

// 質問 1 件あたりの回答スキーマ
export const answerSchema = z.union([
  nonEmptyString('回答'),
  z.array(nonEmptyString('回答')).min(1, '回答を 1 つ以上選択してください'),
]);
export type AnswerType = z.infer<typeof answerSchema>;

// 回答フォーム全体のスキーマ
export const answerFormSchema = z.object({
  formId: z.string(),
  answers: z.record(z.string(), answerSchema),
});
export type AnswerFormType = z.infer<typeof answerFormSchema>;