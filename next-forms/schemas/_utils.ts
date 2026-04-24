import { z } from 'zod';

// 空文字・空白のみ禁止＋255文字上限＋フィールド名付きメッセージ
export const nonEmptyString = (field: string) =>
  z
    .string({ message: `${field}を入力してください。` })
    .max(255, { message: `${field}は255文字以内で入力してください。` })
    .refine((v) => Boolean(v.trim()), {
      message: `${field}を入力してください。`,
    });