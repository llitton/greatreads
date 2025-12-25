import { NextRequest, NextResponse } from 'next/server';
import { testRSSFeed } from '@/lib/rss/parser';
import { z } from 'zod';

const testSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = testSchema.parse(body);

    const result = await testRSSFeed(url);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to test RSS feed' },
      { status: 500 }
    );
  }
}
