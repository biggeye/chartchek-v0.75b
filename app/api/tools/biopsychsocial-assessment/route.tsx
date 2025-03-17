export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { generatePDF, FormData } from '@/lib/services/functions/pdfGenerator';

export async function POST(request: NextRequest) {
  const data = await request.json();

  // Use the generic PDF generator function
  const formData: FormData = {
    type: 'bio_psych_social_assessment',
    data: data.patientData
  };
  
  const { blob } = await generatePDF(formData);

  // Send PDF file directly as response
  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="BioPsychSocialAssessment.pdf"',
    },
  });
}
