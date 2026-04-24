'use server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createFormSchema } from '@/schemas/createSchema';
import type { QuestionInputType } from '@/schemas/createSchema';
import type { OperationResultWithFormId } from '@/lib/operationResultType';

export async function createFormAction(
  data: unknown,
): Promise<OperationResultWithFormId> {

  const parsed = createFormSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: 'VALIDATION_ERROR',
    };
  }
  const parsedData = parsed.data;

  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: 'LOGIN_REQUIRED' };
  }
  const userId = session.user.id;

  try {
    const createdFormId = await prisma.$transaction(async (tx) => {
      // フォームを保存
      const createdForm = await tx.form.create({
        data: {
          formTitle: parsedData.formTitle,
          description: parsedData.description ?? '',
          createdBy: userId,
        },
      });

      // formId と紐付けて、質問を保存
      const questions = parsedData.questions.map((question: QuestionInputType) => ({
        formId: createdForm.formId,
        questionText: question.questionText,
        questionType: question.questionType,
        choices: question.choices
          ? question.choices.map((choice) => choice.choiceText.trim())
          : [],
      }));
      await tx.question.createMany({
        data: questions,
      });
      return createdForm.formId;
    });

    return {
      success: true,
      formId: createdFormId,
    };
  } catch (error) {
    console.error('createFormAction Error: ', error);
    return { success: false, error: 'ACTION_FAILED' };
  }
}