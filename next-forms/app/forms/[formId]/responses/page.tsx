import { notFound } from 'next/navigation';

import AnswersSummary from '@/components/formComponents/AnswersSummary';
import dateFormat from '@/lib/dateFormat';
import prisma from '@/lib/prisma';
import fetchFormById from '@/lib/prismaFinders';

type ChoiceCount = { choice: string; value: number };
export type Summary =
  | {
      questionId: string;
      questionText: string;
      questionType: 'radiobutton' | 'checkboxes';
      totalAnswers: number;
      choiceCounts: ChoiceCount[];
    }
  | {
      questionId: string;
      questionText: string;
      questionType: 'text' | 'paragraph';
      totalAnswers: number;
      textAnswers: string[];
    };

export default async function ResultPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const form = await fetchFormById(formId);

  if (!form) {
    return notFound();
  }
  const formattedCreatedAt = dateFormat(form.createdAt);
  const formattedUpdatedAt = dateFormat(form.updatedAt);

  const allAnswers = await prisma.answer.findMany({
    where: { formId },
    select: { questionId: true, answer: true },
  });
  const questions = form.questions;
  if (!questions || questions.length === 0) {
    throw new Error('質問がありません。');
  }

  const answersMap = new Map<string, string[]>();
  for (const answer of allAnswers) {
    const list = answersMap.get(answer.questionId) ?? [];
    list.push(answer.answer);
    answersMap.set(answer.questionId, list);
  }

  const summaries: Summary[] = questions.map((question) => {
    const answers = answersMap.get(question.questionId) ?? [];
    const totalAnswers = answers.length;

    switch (question.questionType) {
      case 'radiobutton':
      case 'checkboxes': {
        const choiceCountsMap = new Map<string, number>(
          question.choices.map((choice) => [choice, 0]),
        );

        answers.forEach((answer) => {
          answer.split('\n').forEach((choice) => {
            const currentChoiceCount = choiceCountsMap.get(choice);
            if (currentChoiceCount !== undefined) {
              choiceCountsMap.set(choice, currentChoiceCount + 1);
            }
          });
        });

        const choiceCounts: ChoiceCount[] = Array.from(choiceCountsMap.entries()).map(
          ([choice, value]) => ({ choice, value }),
        );
        return {
          questionId: question.questionId,
          questionText: question.questionText,
          questionType: question.questionType,
          totalAnswers,
          choiceCounts,
        };
      }

      case 'text':
      case 'paragraph': {
        return {
          questionId: question.questionId,
          questionText: question.questionText,
          questionType: question.questionType,
          totalAnswers,
          textAnswers: answers,
        };
      }

      default: {
        throw new Error(`Unexpected question type: ${(question as any).questionType}`);
      }
    }
  });

  return (
    <>
      <div className="border rounded p-3 m-3">
        <h1>{form.formTitle}</h1>
        <p>{form.description}</p>
        <p>作成日時：{formattedCreatedAt}</p>
        {formattedUpdatedAt === formattedCreatedAt ? null : (
          <p>更新日時：{formattedUpdatedAt}</p>
        )}
        <p>作成者：{form.user.username}</p>
      </div>
      <h2>回答結果</h2>
      {summaries.map((summary, index) => {
        const questionNumber = index + 1;
        return (
          <div key={summary.questionId} className="my-5">
            <p>
              質問 {questionNumber} : {summary.questionText}
            </p>
            <p>回答数: {summary.totalAnswers}</p>
            <AnswersSummary summary={summary} />
          </div>
        );
      })}
    </>
  );
}