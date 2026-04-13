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

export default function BecomeSellerEkycPage() {
  return (
    <Suspense fallback={null}>
      <RedirectToSellerRegister />
    </Suspense>
  );
}
