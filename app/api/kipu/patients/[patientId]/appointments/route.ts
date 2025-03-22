import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuGetPatientAppointments } from '@/lib/kipu/service/patient-service';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';
// Define the appointment response interface
interface KipuPatientAppointmentsResponse {
  pagination: {
    current_page: string;
    total_pages: string;
    records_per_page: string;
    total_records: string;
  };
  appointments: Array<{
    id: number;
    start_time: string;
    end_time: string;
    subject: string;
    appointment_type: string;
    status: string;
    billable: boolean;
    all_day: boolean;
    recurring: boolean;
    upcoming_dates?: string[];
  }>;
}

/**
 * GET handler for retrieving a patient's appointments
 * 
 * @param req - The incoming request
 * @param params - The route parameters, including patientId
 * @returns NextResponse with the patient appointments or an error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { patientId } = params;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Create Supabase client
    const supabase = await createServer();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get KIPU API credentials
    const credentials = await getKipuCredentials();
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'No API credentials found for this user' },
        { status: 404 }
      );
    }

    // Make direct KIPU API call to get patient appointments
    const response = await kipuGetPatientAppointments<KipuPatientAppointmentsResponse>(
      decodeURIComponent(patientId),
      credentials,
      { page, per: limit }
    );

    if (!response.success) {
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      appointments: response.data?.appointments || [],
      pagination: response.data?.pagination || {
        current_page: page.toString(),
        total_pages: '1',
        records_per_page: limit.toString(),
        total_records: '0'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch patient appointments' },
      { status: 500 }
    );
  }
}


/* make sure this route takes advantage of  and adheres to the documentation below:
GET
/patients/{patient_id}/appointments
List all appointments scoped to a given patient
Parameters
Name	Description
Accept *
string
(header)
Accept Header [Do not change this value]

Available values : application/vnd.kipusystems+json; version=3

Authorization *
string($APIAuth {access_id}:{signature})
(header)
APIAuth {your Access ID}:{signature}

Date *
string($rfc822)
(header)
RFC 822 Format (Example: Tue, 03 Sep 2019 16:05:56 GMT)

app_id *
string
(query)
app_id (also referred to as recipient_id, provided by Kipu)

patient_master_id *
string($uuid)
(query)
Patient Master UUID (Important: NOT ID)

days
integer($int32)
(query)
Number of days to fetch upcoming dates for recurring appointments

Default value : 30

page
integer($int32)
(query)
Page number

Default value : 1

per
integer($int32)
(query)
Appointments per page

Default value : 20

patient_id *
integer
(path)
Location Patient ID

Responses
Code	Description	Links
200	
Success

Media type

application/json
Controls Accept header.
Example Value
Schema
{
pagination*	pagination_object{
current_page*	string
total_pages*	string
records_per_page*	string
total_records*	string
}
appointments*	[
{
id	integer
start_time	string($date-time)
end_time	string($date-time)
subject	string
appointment_type	string
status	string
billable	boolean
all_day	boolean
recurring	boolean
upcoming_dates	[
string($date-time)
]
}
]
}
No links
404	
Not Found

Media type

application/json
Example Value
Schema
error_response{
errors*	string
}
*/