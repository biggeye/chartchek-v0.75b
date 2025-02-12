import { createServer } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
const supabase = await createServer();

    try {
      // Parse the incoming JSON data
      const body = await request.json();
  
      // Optionally, validate that the required fields are set. (A more robust validation can be implemented.)
      const requiredFields = [
        'patient_name',
        'policy_number',
        'auth_days_requested',
        'auth_days_approved',
        'amount_billed',
        'amount_awarded',
        'time_period'
      ];
      
      const missingFields = requiredFields.filter(field => body[field] === undefined);
      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields: ${missingFields.join(', ')}` },
          { status: 400 }
        );
      }
  
      // Insert the data into the Supabase table.
      const { data, error } = await supabase
        .from('summarize_eob_payouts')
        .insert([
          {
            patient_name: body.patient_name,
            policy_number: body.policy_number,
            auth_days_requested: body.auth_days_requested,
            auth_days_approved: body.auth_days_approved,
            amount_billed: body.amount_billed,
            amount_awarded: body.amount_awarded,
            time_period: body.time_period
          }
        ]);
  
      // Handle possible insertion errors
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
  
      return NextResponse.json({ message: 'Data inserted successfully', data }, { status: 200 });
      
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Unexpected error occurred' }, { status: 500 });
    }
  }