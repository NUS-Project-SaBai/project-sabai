import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

function useLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleSubmit,
  };
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 p-3.5 border border-red-100">
      <div className="flex gap-2.5">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-red-800">Login failed</p>
          <p className="mt-0.5 text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none sm:text-sm";

export default function Login() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleSubmit,
  } = useLogin();

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <Image
        src="/cambodia-image.webp"
        alt="Angkor Wat, Cambodia"
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-2xl bg-white px-8 py-10 shadow-2xl">
          {/* Header */}
          <div className="mb-4 text-center">
            <Image
              src="/sabaiLogo.png"
              alt="Sabai logo"
              width={56}
              height={56}
              className="mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-slate-900">Welcome</h2>
            <p className="mt-2 text-sm text-slate-500">
              Log in to Sabai to continue to Sabai.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            {error && <ErrorBanner message={error} />}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? "Signing in..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

Login.getLayout = function getLayout(page: React.ReactElement) {
  return page;
};
