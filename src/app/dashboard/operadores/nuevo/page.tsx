"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NuevoOperadorPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/operadores");
  }, [router]);
  return null;
}
