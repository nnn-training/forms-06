import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import AnswerForm from '@/components/formComponents/AnswerForm';
import { auth } from '@/lib/auth';
import dateFormat from '@/lib/dateFormat';
import fetchFormById, { hasUserAnswered } from '@/lib/prismaFinders';

export default async function AnswerPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/api/auth/signin?callbackUrl=/forms/${formId}`);
  }

  const answeredBy = session.user.id;

  const alreadyAnswered = await hasUserAnswered(formId, answeredBy);
  if (alreadyAnswered) {
    return (
      <div className="flex flex-col items-center justify-center mt-20">
        <h2>回答済みのフォームです</h2>
        <Link
          href="/"
          className="my-3 mx-1 p-3 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition cursor-pointer"
        >
          トップページに戻る
        </Link>
        <Link
          href={`/forms/${formId}/responses`}
          className="mx-1 p-3 bg-blue-500 hover:bg-blue-700 text-white rounded-full"
        >
          集計結果を見る
        </Link>
      </div>
    );
  }

  const form = await fetchFormById(formId);

  if (!form) {
    return notFound();
  }

  const formattedCreatedAt = dateFormat(form.createdAt);
  const formattedUpdatedAt = dateFormat(form.updatedAt);

  const { formTitle, description, user } = form;
  const answerFormData = {
    formId,
    formTitle,
    description,
    formattedCreatedAt,
    formattedUpdatedAt,
    createdBy: user.username,
    questions: form.questions.map((question) => ({
      questionId: question.questionId,
      questionText: question.questionText,
      questionType: question.questionType,
      choices: question.choices,
    })),
  };

  return <AnswerForm form={answerFormData} />;
}