"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/components/AuthProvider";

const DEMO_USERNAME = "HY-Jury";
const DEMO_PASSWORD = "zyvbiv-xeckur-4qyFvy";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail } = useAuth();
  const [email] = useState(DEMO_USERNAME);
  const [password] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await signInWithEmail(email, password);

    if (!result.ok) {
      setError(result.message ?? "Unable to sign in.");
      return;
    }

    setError("");
    router.push("/events");
  };

  return (
    <div className="mx-auto max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
          Welcome back
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Log in</h1>
      </div>

      <div className="space-y-5">
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Username
            <input
              type="text"
              value={email}
              readOnly
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={password}
              readOnly
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Log in with email
          </button>
        </form>
      </div>
    </div>
  );
}
