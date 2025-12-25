import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { sendTopTenRequestEmail } from '@/lib/notifications';

const createRequestSchema = z.object({
  toEmail: z.string().email('Please enter a valid email'),
  toName: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
});

// GET all requests sent by user
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requests = await prisma.topTenRequest.findMany({
    where: { fromUserId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(requests);
}

// POST create new request
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { toEmail, toName, message } = createRequestSchema.parse(body);

    // Get requesting user's name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    const fromUserName = user?.name || user?.email || 'A friend';

    // Create the request with a unique token
    const token = uuidv4();
    const req = await prisma.topTenRequest.create({
      data: {
        fromUserId: session.user.id,
        toEmail,
        toName,
        message,
        token,
      },
    });

    // Send the email
    await sendTopTenRequestEmail(toEmail, toName || null, fromUserName, message || null, token);

    return NextResponse.json(req, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to create request:', error);
    return NextResponse.json(
      { error: 'Failed to send request' },
      { status: 500 }
    );
  }
}
