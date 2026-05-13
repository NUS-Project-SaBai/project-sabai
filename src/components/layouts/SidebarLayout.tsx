import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AiOutlineSetting, AiOutlineUser } from "react-icons/ai";
import { MdMonitorHeart } from "react-icons/md";
import { PiSignOutFill } from "react-icons/pi";
import { IoMdMenu } from "react-icons/io";
import { LuScanFace } from "react-icons/lu";
import { GiMedicines } from "react-icons/gi";
import LogoTitle from "@/components/LogoTitle";
import SabaiLogo from "@/components/SabaiLogo";

interface SidebarLayoutProps {
  children: ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col sm:flex-row">
      {/* mobile sidebar */}
      <div className="flex sm:hidden flex-row w-full p-2 justify-between items-center bg-[var(--color-navbar)]">
        <SabaiLogo />
        <button
          className={`group flex items-center gap-2 p-2 pl-4 rounded-md hover:cursor-pointer`}
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          <IoMdMenu className="h-7 w-7 text-gray-800" />
        </button>
      </div>
      <div
        className={`${mobileSidebarOpen ? "flex" : "hidden"} flex-col absolute z-2 w-full p-2 top-15 bg-neutral-50 shadow-2xl`}
      >
        <SidebarNavButtons />
      </div>
      {/* desktop sidebar */}
      <div className="hidden sm:flex flex-col min-w-64 p-2 gap-6 bg-[var(--color-navbar)]">
        <LogoTitle className="m-2" />
        <SidebarNavButtons />
      </div>
      {/* Main Content */}
      <main className="w-full overflow-y-auto bg-neutral-75">{children}</main>
    </div>
  );
}

function SidebarNavButtons() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navigation = [
    { name: "Scan Face", href: "/scanFace", icon: LuScanFace },
    { name: "Patient", href: "/patient", icon: AiOutlineUser },
    { name: "Vitals", href: "/vitals", icon: MdMonitorHeart },
    {
      name: "Medication Stock",
      href: "/medication-stock",
      icon: GiMedicines,
    },
    {
      name: "Settings",
      href: "/settings/village-codes",
      icon: AiOutlineSetting,
    },
  ];
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-2">
        {navigation.map((item) => {
          const selected =
            router.pathname == item.href ||
            router.pathname.startsWith(`${item.href}/`);
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
        className={`group flex items-center gap-2 p-4 rounded-md hover:cursor-pointer`}
        onClick={handleSignOut}
      >
        <PiSignOutFill className="h-5 w-5 text-gray-500 group-hover:text-gray-800" />
        <span className="text-gray-500 group-hover:text-gray-800">
          Sign out
        </span>
      </button>
    </div>
  );
}
