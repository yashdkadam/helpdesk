import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const navigate = useNavigate();
  const { data: session } = useSession();

  const signOutMutation = useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => navigate("/login"),
  });

  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <span className="font-semibold text-sm">Helpdesk</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{session?.user.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOutMutation.mutate()}
            disabled={signOutMutation.isPending}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
