"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useDisconnect } from "wagmi";
import { useAuthSession } from "~~/hooks/useAuthSession";

export const SignOutButton = () => {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const { isAuthenticated } = useAuthSession();

  useEffect(() => {
    if (!isAuthenticated) {
      router.refresh();
    }
  }, [router, isAuthenticated]);

  return (
    <button
      className="btn btn-outline text-lg font-normal"
      onClick={() => {
        disconnect();
        signOut();
        router.refresh();
      }}
      type="button"
    >
      Sign Out
    </button>
  );
};
