import { NextRequest, NextResponse } from 'next/server';
import { getPatientEvaluations, addPatientEvaluation } from '@/lib/kipu/evaluations';

export async function GET(
  request: NextRequest,
  { params }: { params: { facilityId: string; patientId: string } }
) {
  const { facilityId, patientId } = params;
  const evaluations = await getPatientEvaluations(facilityId, patientId);
  
  return NextResponse.json({ evaluations });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { facilityId: string; patientId: string } }
) {
  const { facilityId, patientId } = params;
  const data = await request.json();
  
  // Ensure patientId is consistent
  const evaluationData = {
    ...data,
    patient_id: parseInt(patientId)
  };
  
  const newEvaluation = await addPatientEvaluation(facilityId, evaluationData);
  
  if (!newEvaluation) {
    return NextResponse.json(
      { error: 'Failed to create evaluation' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ evaluation: newEvaluation });
}