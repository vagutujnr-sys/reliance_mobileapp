import { LoginForm } from "@/components/auth/LoginForm";
import { isRemote } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginForm demo={!isRemote()} />;
}
