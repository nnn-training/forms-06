'use server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasUserAnswered } from '@/lib/prismaFinders';
import { answerFormSchema } from '@/schemas/answerSchema';
import type { OperationResult } from '@/lib/operationResultType';

export async function saveAnswersAction(
  data: unknown,
): Promise<OperationResult> {

  const parsed = answerFormSchema.safeParse(data);
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

  const answeredBy = session.user.id;
  const { formId, answers } = parsedData;

  const alreadyAnswered = await hasUserAnswered(formId, answeredBy);
  if (alreadyAnswered) {
    return { success: false, error: 'ALREADY_ANSWERED' };
  }

  // questionId の過不足や不正な questionId がないかを検証
  const submittedQuestionIds = Object.keys(answers);
  const formQuestions = await prisma.question.findMany({
    where: { formId },
    select: {
      questionId: true,
      questionType: true,
      choices: true,
    },
  });
  if (submittedQuestionIds.length !== formQuestions.length) {
    return { success: false, error: 'VALIDATION_ERROR' };
  }

  const formQuestionsMap = new Map(
    formQuestions.map((q) => [q.questionId, q]),
  );
  for (const questionId of submittedQuestionIds) {
    if (!formQuestionsMap.has(questionId)) {
      return { success: false, error: 'VALIDATION_ERROR' };
    }
  }

  // 各 question の回答内容を type/choices と照合して検証
  for (const question of formQuestions) {
    const answer = answers[question.questionId];

    switch (question.questionType) {
      case 'text':
      case 'paragraph': {
        if (typeof answer !== 'string') {
          return { success: false, error: 'VALIDATION_ERROR' };
        }
        break;
      }

      case 'radiobutton': {
        if (typeof answer !== 'string') {
          return { success: false, error: 'VALIDATION_ERROR' };
        }
        const choicesSet = new Set(question.choices);
        if (!choicesSet.has(answer)) {
          return { success: false, error: 'VALIDATION_ERROR' };
        }
        break;
      }

      case 'checkboxes': {
        if (!Array.isArray(answer)) {
          return { success: false, error: 'VALIDATION_ERROR' };
        }
        const choicesSet = new Set(question.choices);
        const selectedChoices = new Set<string>();
        for (const choice of answer) {
          // 重複した回答がないかチェック
          if (selectedChoices.has(choice)) {
            return { success: false, error: 'VALIDATION_ERROR' };
          }
          selectedChoices.add(choice);
          // 選択肢に不正なものがないかチェック
          if (!choicesSet.has(choice)) {
            return { success: false, error: 'VALIDATION_ERROR' };
          }
        }
        break;
      }

      default: {
        return { success: false, error: 'VALIDATION_ERROR' };
      }
    }
  }

  const answersData = Object.entries(answers).map(([questionId, answer]) => ({
    formId,
    answeredBy,
    questionId,
    answer: Array.isArray(answer) ? answer.join('\n') : answer,
  }));

  try {
    await prisma.answer.createMany({ data: answersData });
    return { success: true };
  } catch (error) {
    console.error('saveAnswersAction Error: ', error);
    return { success: false, error: 'ACTION_FAILED' };
  }
}