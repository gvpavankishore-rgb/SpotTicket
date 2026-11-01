import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: "Login | SpotTicket",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md py-4 sm:py-10">
      <AuthForm mode="login" />
    </div>
  );
}
