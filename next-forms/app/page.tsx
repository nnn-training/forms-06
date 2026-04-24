import Link from 'next/link';

import dateFormat from '@/lib/dateFormat';
import prisma from '@/lib/prisma';

export default async function TopPage() {
  const forms = await prisma.form.findMany({
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  const formCards = forms.map((form) => {
    const formattedCreatedAt = dateFormat(form.createdAt);
    const formattedUpdatedAt = dateFormat(form.updatedAt);
    return (
      <div key={form.formId} className="border border-gray-300 rounded p-3 m-3">
        <h2>タイトル：{form.formTitle}</h2>
        <p>説明：{form.description}</p>
        <p>作成日時：{formattedCreatedAt}</p>
        {formattedCreatedAt === formattedUpdatedAt ? null : (
          <p>更新日時：{formattedUpdatedAt}</p>
        )}
        <p className="mb-3">作成者：{form.user.username}</p>
        <Link
          href={`/forms/${form.formId}`}
          className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded-full"
        >
          回答する
        </Link>
        <Link
          href={`/forms/${form.formId}/responses`}
          className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-full"
        >
          結果を見る
        </Link>
      </div>
    );
  });

  return (
    <>
      {formCards}
    </>
  );
}