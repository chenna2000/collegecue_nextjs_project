import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');

    if (!filename || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid or missing filename' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const stat = fs.statSync(filePath);

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Length', stat.size.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
