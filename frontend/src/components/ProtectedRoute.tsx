import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && user.emailVerified === false) {
    return (
      <Navigate
        to={`/verify-email?email=${encodeURIComponent(user.email)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
