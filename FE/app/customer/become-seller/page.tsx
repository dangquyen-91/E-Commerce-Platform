"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function RedirectToSellerRegister() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/seller/register");
  }, [router]);

  return null;
      }

export default function BecomeSellerPage() {
  return (
    <Suspense fallback={null}>
      <RedirectToSellerRegister />
    </Suspense>
  );
}
