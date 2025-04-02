import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./badge";
import { Button } from "./button";
import { createServer } from "@/utils/supabase/server";

export default async function AuthButton() {
  const supabase = await createServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!hasEnvVars) {
    return (
      <>
        <div className="flex gap-4 items-center">
          <div>
            <Badge
              color="zinc"
              className="font-normal pointer-events-none"
            >
              Please update .env.local file with anon key and url
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="opacity-75 cursor-none pointer-events-none"
              disabled
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              className="opacity-75 cursor-none pointer-events-none"
              disabled
            >
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }
  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.email}!
      <form action={signOutAction}>
        <Button
          variant="outline"
        >
          Sign out
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button variant="outline">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
