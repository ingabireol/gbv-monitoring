import { Navigate } from "react-router-dom";
import { getUserRole, UserRole } from "@/lib/auth";

interface RoleGuardProps {
  role: UserRole;
  children: React.ReactNode;
}

export function RoleGuard({ role, children }: RoleGuardProps) {
  const current = getUserRole();
  if (!current) return <Navigate to="/login" replace />;
  if (current !== role) {
    if (current === "victim") return <Navigate to="/victim/dashboard" replace />;
    if (current === "police") return <Navigate to="/police/dashboard" replace />;
    if (current === "socialworker") return <Navigate to="/socialworker/dashboard" replace />;
    if (current === "districtadmin") return <Navigate to="/districtadmin/dashboard" replace />;
    if (current === "partner") return <Navigate to="/partner/dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
