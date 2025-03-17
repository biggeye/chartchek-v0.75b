export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { generatePDF, FormType } from '@/lib/services/functions/pdfGenerator';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { formType, formData } = data;
    
    // Validate the form type
    if (!formType || !['bio_psych_social_assessment', 'patient_intake'].includes(formType)) {
      return NextResponse.json(
        { error: 'Invalid form type. Must be one of: bio_psych_social_assessment, patient_intake' },
        { status: 400 }
      );
    }
    
    // Validate the form data
    if (!formData) {
      return NextResponse.json({ error: 'Form data is required' }, { status: 400 });
    }
    
    // Generate the PDF using the generic function
    const { blob } = await generatePDF({
      type: formType as FormType,
      data: formData
    });
    
    // Generate appropriate filename based on form type
    let filename = 'document.pdf';
    if (formType === 'bio_psych_social_assessment') {
      const patientName = formData.firstName && formData.lastName 
        ? `${formData.firstName}_${formData.lastName}` 
        : 'Patient';
      filename = `BioPsychSocialAssessment_${patientName}.pdf`;
    } else if (formType === 'patient_intake') {
      const patientName = formData.fullName 
        ? formData.fullName.replace(/\s+/g, '_') 
        : 'Patient';
      filename = `PatientIntake_${patientName}.pdf`;
    }
    
    // Send PDF file directly as response
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: (error as Error).message },
      { status: 500 }
    );
  }
}
