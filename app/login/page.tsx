import { Suspense } from "react";
import { AuthRoute } from "@/components/auth/auth-route";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthRoute mode="login" />
    </Suspense>
  );
}
