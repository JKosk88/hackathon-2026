"use client";

import { useEffect, useState } from "react";

export function NotificationToastHost() {
  const [toast, setToast] = useState<{ title: string; body: string } | null>(
    null,
  );

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<{ title: string; body: string }>)
        .detail;
      if (!detail) {
        return;
      }

      setToast({ title: detail.title, body: detail.body });
      window.setTimeout(() => setToast(null), 3500);
    };

    window.addEventListener("cityvibe-toast", handleToast);

    return () => {
      window.removeEventListener("cityvibe-toast", handleToast);
    };
  }, []);

  if (!toast) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {toast.title}
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {toast.body}
        </p>
      </div>
    </div>
  );
}
