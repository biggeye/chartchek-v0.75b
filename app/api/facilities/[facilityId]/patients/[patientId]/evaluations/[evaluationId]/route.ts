//export async function PUT(
  request: NextRequest,
  { params, searchParams }: { 
    params: { facilityId: string; patientId: string; evaluationId: string }; 
    searchParams: URLSearchParams;
  }
) {
  const { facilityId, evaluationId } = params;
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
