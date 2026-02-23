import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AiOutlineSetting, AiOutlineUser } from "react-icons/ai";
import { PiSignOutFill } from "react-icons/pi";
import LogoTitle from "./LogoTitle";
import { Button } from "@/components/Button";

interface SidebarLayoutProps {
  children: ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navigation = [
    { name: "Patients", href: "/patients", icon: AiOutlineUser },
    {
      name: "Settings",
      href: "/settings/village-codes",
      icon: AiOutlineSetting,
    },
  ];

  return (
    <div className="h-screen flex-row sm:flex">
      {/* Sidebar */}
      <div className="hidden sm:flex flex-col min-w-64 p-2 gap-6 bg-neutral-50">
        <LogoTitle className="m-2" />
        <div className="flex flex-1 flex-col gap-2">
          {navigation.map((item) => {
            const selected = router.pathname == item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-2 p-2 pl-4 rounded-md ${selected ? "bg-secondary-50" : ""} hover:bg-secondary-75 hover:shadow-md`}
              >
                <item.icon className="h-5 w-5 text-gray-500 group-hover:text-gray-800" />
                <span className="text-gray-500 group-hover:text-gray-800">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
        <button
          className={`group flex items-center gap-2 p-2 pl-4 rounded-md hover:cursor-pointer`}
          onClick={handleSignOut}
        >
          <PiSignOutFill className="h-5 w-5 text-gray-500 group-hover:text-gray-800" />
          <span className="text-gray-500 group-hover:text-gray-800">
            Sign out
          </span>
        </button>
      </div>
      {/* Main Content */}
      <main className="w-full overflow-y-auto bg-neutral-75">{children}</main>
    </div>
  );
}
