"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-gray-200/60 bg-white/90 backdrop-blur shadow-lg dark:border-gray-800/60 dark:bg-gray-950/80 p-6 sm:p-7"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Login
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back to FeedbackFlow
          </p>
        </div>

        {/* Email */}
        <div className="space-y-1.5 mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400
                       dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500
                       px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="email"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5 mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400
                       dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500
                       px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm text-center mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-medium
                   py-2.5 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
        >
          Sign In
        </button>
        <p className="mt-4 text-xs text-center text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            Sign up
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
          Tip: use your demo credentials to continue
        </p>
      </form>
    </div>
  );
}
