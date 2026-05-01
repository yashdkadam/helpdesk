import { Navigate } from "react-router-dom";
import { useSession } from "@/lib/auth-client";
import { Role } from "core/constants/role.ts";

interface Props {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: Props) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (session.user.role !== Role.admin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
