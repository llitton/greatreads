import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSourceSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  active: z.boolean().optional(),
});

// DELETE source
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const source = await prisma.friendSource.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  await prisma.friendSource.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

// PATCH update source
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = updateSourceSchema.parse(body);

    const source = await prisma.friendSource.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    const updated = await prisma.friendSource.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update source' },
      { status: 500 }
    );
  }
}
