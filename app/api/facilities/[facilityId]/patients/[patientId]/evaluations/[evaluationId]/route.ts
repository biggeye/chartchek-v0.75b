// app/api/facilities/[facilityId]/patients/[patientId]/evaluations/[evaluationId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updatePatientEvaluation } from '@/lib/kipu/evaluations';

export async function PUT(
  request: NextRequest,
  context: { params: { facilityId: string; patientId: string; evaluationId: string } }
) {
  const { facilityId, evaluationId } = context.params;
  const data = await request.json();
  
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