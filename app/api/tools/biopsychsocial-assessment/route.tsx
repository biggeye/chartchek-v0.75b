export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import ReactPDF from '@react-pdf/renderer';
import BioPsychSocialTemplate from '@/components/dynamicForms/pdf/biopsychsocialassessment-template';

export async function POST(request: NextRequest) {
  const data = await request.json();

  // Properly render the document to a blob directly
  const document = <BioPsychSocialTemplate patientData={data.patientData} />;
  const pdfBlob = await ReactPDF.pdf(document).toBlob();

  // Send PDF file directly as response
  return new NextResponse(pdfBlob, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="BioPsychSocialAssessment.pdf"',
    },
  });
}
