import { auth } from "@/lib/session";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import { LogoutButton } from "@/components/account/logout-button";
import { ChangePasswordForm } from "@/components/account/change-password-form";

function Avatar({ email }: { email: string }) {
  const letter = email?.charAt(0)?.toUpperCase() || "U";
  return (
    <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
      {letter}
    </div>
  );
}

export default async function AccountPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="max-w-lg mx-auto py-8">
      <Card className="border border-border bg-card/80 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-center">
          Account Settings
        </h1>

        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar email={user?.email ?? ""} />
            <div>
              <div className="text-lg font-semibold">{user?.email}</div>
              {}
              <Badge className="bg-primary/10 text-primary">{user?.role}</Badge>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Theme</span>
            <ModeToggle />
          </div>

         <ChangePasswordForm />

          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
