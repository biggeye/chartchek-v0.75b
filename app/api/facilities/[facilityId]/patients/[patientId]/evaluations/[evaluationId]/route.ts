import { NextRequest, NextResponse } from 'next/server';
import { updatePatientEvaluation } from '@/lib/kipu/evaluations';

export async function PUT(
  request: NextRequest,
  { params }: { params: { facilityId: string; patientId: string; evaluationId: string } }
) {
  const { facilityId, evaluationId } = params;
  const data = await request.json();

  // Access searchParams if needed:
  const searchParams = request.nextUrl.searchParams;

  const updatedEvaluation = await updatePatientEvaluation(
    facilityId, 
    parseInt(evaluationId), 
    data
  );
  
  if (!updatedEvaluation) {
    return NextResponse.json(
      { error: 'Failed to update evaluation' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ evaluation: updatedEvaluation });
}
