'use server';

import prisma from '@/lib/prisma';

export default async function fetchFormById(formId: string) {
  try {
    const form = await prisma.form.findUnique({
      where: { formId },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        questions: {
          orderBy: { questionId: 'asc' },
        },
      },
    });
    return form;
  } catch (error) {
    console.error('fetchFormById:', error);
    return null;
  }
}

export async function hasUserAnswered(formId: string, userId: string) {
  try {
    const result = await prisma.answer.findFirst({
      where: {
        formId: formId,
        answeredBy: userId,
      },
    });
    return result ? true : false;
  } catch (error) {
    console.error('hasUserAnswered:', error);
    return false;
  }
}