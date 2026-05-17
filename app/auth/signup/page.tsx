import { Suspense } from "react";
import SignupForm from "./SignupForm";

export const metadata = {
  title: "Create an account · AapKaPlot",
  description: "Sign up to AapKaPlot — verified property listings across India.",
};

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md flex-col justify-center px-6 py-10">
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
