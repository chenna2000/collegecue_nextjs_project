import { NextResponse } from 'next/server';
import formidable from 'formidable';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';
import prisma from '@/lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};


function webRequestToNodeReadable(webRequest) {
  return Readable.fromWeb(webRequest.body);
}
const cleanField = (field) =>
  Array.isArray(field) ? field[0] : field ?? '';


const form = formidable({
  multiples: false,
  uploadDir: './uploads',
  keepExtensions: true,
  filename: (name, ext, part, form) => {
    const originalName = part.originalFilename || 'upload';
    const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = path.join('./uploads', safeName);

    if (fs.existsSync(filePath)) {
      const timestamp = Date.now();
      const ext = path.extname(safeName);
      const base = path.basename(safeName, ext);
      return `${base}_${timestamp}${ext}`;
    }

    return safeName;
  },
});

export async function POST(req) {
  const nodeReq = Object.assign(webRequestToNodeReadable(req), {
    headers: Object.fromEntries(req.headers),
    method: req.method,
    url: req.url,
  });

  return new Promise((resolve, reject) => {
    form.parse(nodeReq, async (err, fields, files) => {
      if (err) {
        console.error('Parsing error:', err);
        reject(NextResponse.json({ error: 'Upload failed' }, { status: 500 }));
        return;
      }

      const {
        title,
        authors,
        institution,
        researchField,
        abstract,
        keywords,
      } = fields;

      const file = files.researchPaper?.[0];

      try {
        const submission = await prisma.submission.create({
          data: {
            title: cleanField(title),
            authors: cleanField(authors),
            institution: cleanField(institution),
            researchField: cleanField(researchField),
            abstract: cleanField(abstract),
            keywords: cleanField(keywords),
            fileName: file.originalFilename,
            filePath: file.filepath,
          },
        });

        resolve(NextResponse.json({ message: 'submimission for new publisher!', submission }));
      } catch (dbErr) {
        console.error('DB error:', dbErr);
        reject(NextResponse.json({ error: 'Database save failed' }, { status: 500 }));
      }
    });
  });
}


export async function GET() {
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(submissions);
  } catch (err) {
    console.error('DB fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

