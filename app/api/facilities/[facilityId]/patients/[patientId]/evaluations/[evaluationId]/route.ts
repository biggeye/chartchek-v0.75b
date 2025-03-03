// app/api/facilities/[facilityId]/patients/[patientId]/evaluations/[evaluationId]/route.ts
import { NextResponse } from 'next/server';
import { getPatientEvaluations, updatePatientEvaluation } from '@/lib/kipu/evaluations';

// GET: Retrieve all evaluations for a patient
export async function GET(
  request: Request,
  context: { params: Promise<{ facilityId: string; patientId: string; evaluationId: string }> }
) {
  const { facilityId, patientId } = await context.params;
  const evaluations = await getPatientEvaluations(facilityId, patientId);
  return NextResponse.json(evaluations);
}

// PUT: Update an evaluation for a patient
export async function PUT(
  request: Request,
  context: { params: Promise<{ facilityId: string; patientId: string; evaluationId: string }> }
) {
  const { facilityId, evaluationId } = await context.params;
  const body = await request.json();
  const evalId = parseInt(evaluationId, 10);
  const updated = await updatePatientEvaluation(facilityId, evalId, body);
  if (!updated) {
    return NextResponse.json({ error: 'Evaluation not found or failed to update' }, { status: 404 });
  }
  return NextResponse.json(updated);
}
