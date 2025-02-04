import { createServer } from "@/utils/supabase/server";
import { OpenAI } from "openai";

export async function GET(req: Request) {
    const supabase = await createServer();
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return new Response(JSON.stringify({
            success: false,
            error: "Unauthorized"
        }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
      // here we will get the list of threads for the user
      const { data: threads, error: threadsError } = await supabase.from('threads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (threadsError) {
        return new Response(JSON.stringify({
            success: false,
            error: threadsError.message
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      // now with the thread ids we can retrieve the list of id's and parse a list to be returned to front end
      return new Response(JSON.stringify({
        success: true,
        data: threads
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }