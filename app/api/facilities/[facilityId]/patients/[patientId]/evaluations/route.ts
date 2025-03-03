// app/api/facilities/[facilityId]/patients/[patientId]/evaluations/mock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPatientEvaluations, addPatientEvaluation, updatePatientEvaluation } from '@/lib/kipu/evaluations';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ facilityId: string; patientId: string }> }
) {
  try {
    const { facilityId, patientId } = await params;
    const evaluations = await getPatientEvaluations(facilityId, patientId);
    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error('Error in GET evaluations:', error);
    return NextResponse.json({ error: 'Failed to retrieve evaluations' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ facilityId: string; patientId: string }> }
) {
  try {
    const { facilityId, patientId } = await params;
    
    // Determine if this is an update operation (evaluationId is in URL search params)
    const { searchParams } = new URL(req.url);
    const evaluationId = searchParams.get('evaluationId');
    
    if (evaluationId) {
      // Update operation
      const body = await req.json();
      const evalId = parseInt(evaluationId, 10);
      const updated = await updatePatientEvaluation(facilityId, evalId, body);
      
      if (!updated) {
        return NextResponse.json({ error: 'Evaluation not found or failed to update' }, { status: 404 });
      }
      
      return NextResponse.json(updated);
    } else {
      // Create operation
      const data = await req.json();
      const evaluationData = {
        ...data,
        patient_id: parseInt(patientId)
      };
      
      const newEvaluation = await addPatientEvaluation(facilityId, evaluationData);
      
      if (!newEvaluation) {
        return NextResponse.json({ error: 'Failed to create evaluation' }, { status: 500 });
      }
      
      return NextResponse.json({ evaluation: newEvaluation });
    }
  } catch (error) {
    console.error('Error in POST evaluation:', error);
    return NextResponse.json({ error: 'Failed to process evaluation request' }, { status: 500 });
  }
}
