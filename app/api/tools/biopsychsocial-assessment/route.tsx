// app/api/tools/biopsychsocial-assessment/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer, Document } from '@react-pdf/renderer';
import BioPsychSocialTemplate from '@/components/dynamicForms/pdf/biopsychsocialassessment-template';
import type { BioPsychSocialAssessment as BPSAType } from '@/types/pdf/biopsychsocialassessment';
import React from 'react';

export async function POST(request: NextRequest) {
  try {
    const { patientData } = (await request.json()) as { patientData: BPSAType['patient'] };

    const pdfBuffer = await renderToBuffer(
      <Document>
        <BioPsychSocialTemplate patientData={patientData} />
      </Document>
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${patientData.firstName}_${patientData.lastName}_BioPsychSocialAssessment.pdf`,
      },
    });
  } catch (error) {
    console.error('[PDF Generation Error]:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
