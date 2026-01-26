import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { withAuth } from "@/lib/auth";
import { Session } from "@supabase/supabase-js/dist/index.cjs";

function Home({ session }: { session: Session }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="ml-3 text-lg font-bold tracking-tight text-slate-900">
                project sa&apos;bai
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-slate-900">
                  {session?.user.email}
                </span>
                <span className="text-xs text-slate-500">Member</span>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:text-red-600 hover:ring-red-200 transition-all duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl bg-white p-8 sm:p-12 shadow-sm ring-1 ring-slate-900/5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mb-6">
              Beta Release
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Welcome to project sa&apos;bai
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              You have successfully authenticated. This is your protected
              dashboard. Start building your next great idea with our powerful
              tools.
            </p>

            <div className="mt-10 flex items-center gap-x-6">
              <button className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all duration-200">
                Get started
              </button>
              <button className="text-sm font-semibold leading-6 text-slate-900 flex items-center gap-1 group">
                Documentation
                <span
                  aria-hidden="true"
                  className="group-hover:translate-x-1 transition-transform"
                >
                  →
                </span>
              </button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Analytics",
                desc: "Real-time insights into your user traffic and engagement metrics.",
                icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
                href: null,
              },
              {
                title: "Configuration",
                desc: "Customize your dashboard preferences and account settings.",
                icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
                href: null,
              },
              {
                title: "Collaborate",
                desc: "Invite team members and manage role-based permissions.",
                icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
                href: null,
              },
              {
                title: "Village Codes",
                desc: "Manage village codes, colors, and visibility settings.",
                icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z",
                href: "/settings/village-codes",
              },
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => item.href && router.push(item.href)}
                className={`group relative rounded-xl p-6 bg-slate-50 hover:bg-slate-100 transition-colors ring-1 ring-slate-200 ${item.href ? "cursor-pointer" : ""}`}
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200 shadow-sm">
                  <svg
                    className="h-6 w-6 text-slate-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={item.icon}
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold leading-7 text-slate-900">
                  <span className="absolute inset-0" />
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(Home);
