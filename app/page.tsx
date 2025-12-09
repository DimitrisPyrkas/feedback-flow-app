"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 overflow-hidden">
      {/* background glow */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_70%)] blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      />

      <motion.div
        className="relative z-10 max-w-3xl text-center px-6 flex flex-col gap-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Logo */}
        <motion.div
          className="inline-flex items-center justify-center gap-3"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="h-12 w-12 rounded-2xl bg-purple-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-purple-800/40">
            FF
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-200">
            FeedbackFlow
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-4xl sm:text-5xl font-semibold leading-tight"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Turn <span className="text-purple-400">feedback</span> into product clarity.
        </motion.h1>

        <motion.p
          className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          AI-powered triage and sentiment insights for your users’ voices.  
          Analyze. Prioritize. Build better.
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-md bg-purple-600 hover:bg-purple-500 text-sm font-medium text-white shadow-lg shadow-purple-900/40 transition"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-md border border-slate-700 text-sm font-medium text-slate-200 hover:bg-slate-900/60 transition"
          >
            Create an account
          </Link>
        </motion.div>

        {/* Footer text */}
        <motion.p
          className="text-xs text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          Admins are managed separately. Standard sign-ups receive member access.
        </motion.p>
      </motion.div>
    </main>
  );
}
