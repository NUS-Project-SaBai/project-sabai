import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AiOutlineSetting, AiOutlineUser } from "react-icons/ai";
import { BsEyeglasses } from "react-icons/bs";
import { MdMonitorHeart } from "react-icons/md";
import { FaStethoscope } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { PiSignOutFill } from "react-icons/pi";
import { IoMdMenu } from "react-icons/io";
import { LuScanFace } from "react-icons/lu";
import { GiMedicines } from "react-icons/gi";
import { Button } from "@/components/interactive/Button/Button";
import LogoTitle from "@/components/LogoTitle";
import { paths } from "@/utils/paths";
import SabaiLogo from "@/components/SabaiLogo";
import VillageSelector from "@/components/VillageSelector";
import { useClickOutside } from "@/hooks/useClickOutside";

interface SidebarLayoutProps {
  children: ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(() =>
    setMobileSidebarOpen(false),
  );

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      {/* mobile sidebar */}
      <div className="lg:hidden relative" ref={dropdownRef}>
        <div className="grid grid-cols-3 w-full p-2 items-center bg-[var(--color-navbar)]">
          <SabaiLogo />
          <div className="flex justify-center">
            <VillageSelector />
          </div>
          <div className="flex justify-end">
            <button
              className={`group flex items-center gap-2 p-2 pl-4 rounded-md hover:cursor-pointer`}
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              <IoMdMenu className="h-7 w-7 text-white" />
            </button>
          </div>
        </div>
        <div
          className={`${mobileSidebarOpen ? "flex" : "hidden"} flex-col absolute z-2 w-full p-2 top-full bg-neutral-50 shadow-2xl`}
        >
          <SidebarNavButtons />
        </div>
      </div>
      {/* desktop sidebar */}
      <div
        className={`hidden lg:flex flex-col relative p-2 gap-6 bg-[var(--color-navbar)] transition-all duration-300 shrink-0 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Collapse Toggle Button */}
        <Button
          variant="icon"
          colour="white"
          size="small"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          icon={
            isCollapsed ? (
              <FiChevronRight className="h-4 w-4" />
            ) : (
              <FiChevronLeft className="h-4 w-4" />
            )
          }
          className="absolute -right-3.5 top-7 z-30 !h-7 !w-7 !p-0 !rounded-full border border-gray-600 bg-[var(--color-navbar)] !text-gray-300 hover:!text-white hover:bg-neutral-800 shadow-md"
        />

        {/* Header: Compact icon when collapsed, full title when expanded */}
        {isCollapsed ? (
          <div className="flex justify-center py-2">
            <SabaiLogo />
          </div>
        ) : (
          <LogoTitle className="m-2" />
        )}

        {/* Hide VillageSelector when collapsed */}
        {!isCollapsed && (
          <div className="px-2">
            <VillageSelector />
          </div>
        )}

        <SidebarNavButtons isCollapsed={isCollapsed} />
      </div>
      {/* Main Content */}
      <main className="w-full overflow-y-auto bg-neutral-75">{children}</main>
    </div>
  );
}

function SidebarNavButtons({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(paths.login());
  };

  const navigation = [
    { name: "Scan Face", href: paths.scanFace(), icon: LuScanFace },
    { name: "Patient", href: paths.patient(), icon: AiOutlineUser },
    { name: "Vitals", href: paths.vitals(), icon: MdMonitorHeart },
    { name: "Vision", href: paths.vision(), icon: BsEyeglasses },
    { name: "Consults", href: paths.consults(), icon: FaStethoscope },
    {
      name: "Medication Stock",
      href: paths.medicationStock(),
      icon: GiMedicines,
    },
    {
      name: "Settings",
      href: paths.settings(),
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
              title={isCollapsed ? item.name : undefined}
              className={`group flex items-center gap-2 p-2 rounded-md ${
                isCollapsed ? "justify-center" : "pl-4"
              } ${selected ? "bg-secondary-50" : ""} hover:bg-secondary-75 hover:shadow-md`}
            >
              <item.icon className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-gray-800" />
              {!isCollapsed && (
                <span className="text-gray-500 group-hover:text-gray-800 truncate">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <button
        className={`group flex items-center gap-2 p-2 rounded-md hover:cursor-pointer ${
          isCollapsed ? "justify-center" : "pl-4"
        }`}
        onClick={handleSignOut}
        title={isCollapsed ? "Sign out" : undefined}
      >
        <PiSignOutFill className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-gray-800" />
        {!isCollapsed && (
          <span className="text-gray-500 group-hover:text-gray-800">
            Sign out
          </span>
        )}
      </button>
    </div>
  );
}
