import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { parseGoodreadsCSV } from '@/lib/goodreads/parser';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Please upload a CSV file' },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Read and parse the file
    const content = await file.text();
    const preview = parseGoodreadsCSV(content);

    // Return preview data - client will send it back on confirm
    return NextResponse.json(preview);
  } catch (error) {
    console.error('Import parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse file' },
      { status: 400 }
    );
  }
}
