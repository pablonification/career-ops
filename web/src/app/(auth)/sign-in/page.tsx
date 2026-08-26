import { IconLogin } from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { SignInForm } from "@/components/auth/sign-in-form";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center p-6">
      <Card className="p-6">
        <div className="mb-6 flex items-center gap-2">
          <IconLogin className="size-5" />
          <h1 className="text-lg font-semibold">Sign in</h1>
        </div>
        <SignInForm />
      </Card>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Use your email and password to continue.
      </p>
      <div className="mt-4 flex justify-center">
        <a href="/" className="text-sm text-muted-foreground hover:underline">
          Back to app
        </a>
      </div>
    </div>
  );
}
