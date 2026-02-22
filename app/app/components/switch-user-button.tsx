"use client";

import { USER_ID_STORAGE_KEY } from "@/lib/user";
import { useRouter } from "next/navigation";

export function SwitchUserButton() {
  const router = useRouter();

  const handleSwitchUser = () => {
    window.localStorage.removeItem(USER_ID_STORAGE_KEY);
    router.refresh();
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={handleSwitchUser}
      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
    >
      Switch user
    </button>
  );
}
