import { Suspense } from "react";
import VerifyForm from "./VerifyForm";

export const dynamic = "force-dynamic";

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
