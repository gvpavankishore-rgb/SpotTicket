import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: "Sign Up | SpotTicket",
};

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md py-4 sm:py-10">
      <AuthForm mode="signup" />
    </div>
  );
}
