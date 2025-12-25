import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const respondSchema = z.object({
  books: z.array(
    z.object({
      title: z.string().min(1),
      author: z.string().optional(),
      rank: z.number().int().min(1).max(10),
    })
  ).min(1).max(10),
});

// GET request by token (for viewing the request page)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const req = await prisma.topTenRequest.findUnique({
    where: { token },
    include: {
      fromUser: {
        select: { name: true, email: true },
      },
    },
  });

  if (!req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  // Mark as viewed if not already
  if (req.status === 'PENDING') {
    await prisma.topTenRequest.update({
      where: { id: req.id },
      data: {
        status: 'VIEWED',
        viewedAt: new Date(),
      },
    });
  }

  return NextResponse.json({
    id: req.id,
    fromUserName: req.fromUser.name || req.fromUser.email,
    message: req.message,
    status: req.status,
    responseData: req.responseData,
  });
}

// POST respond to request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const req = await prisma.topTenRequest.findUnique({
    where: { token },
  });

  if (!req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (req.status === 'RESPONDED') {
    return NextResponse.json(
      { error: 'Already responded to this request' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { books } = respondSchema.parse(body);

    // Update the request with the response
    const updated = await prisma.topTenRequest.update({
      where: { id: req.id },
      data: {
        status: 'RESPONDED',
        respondedAt: new Date(),
        responseData: books,
      },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to respond to request:', error);
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    );
  }
}
