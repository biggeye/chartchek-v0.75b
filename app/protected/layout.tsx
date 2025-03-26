import { createServer } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { PatientProvider } from "@/lib/contexts/PatientProvider";
import AppLayout from "./AppLayout";

export default async function ProtectedLayout({
  children
}: {
  children: ReactNode
}) {
  const supabase = await createServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  
  // Add validation for existing user ID
  if (!user.id) {
      console.error('Authenticated user missing ID:', user);
      redirect("/login");
  }
  return (
    <div suppressHydrationWarning={true}>
        <PatientProvider>
          <AppLayout user_id={user.id}>
            {children}
          </AppLayout>
        </PatientProvider>
    </div>
  );
}