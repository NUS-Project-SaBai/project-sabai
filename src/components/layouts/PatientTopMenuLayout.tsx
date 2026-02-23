import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";

interface PatientTopMenuLayoutProps {
  children: ReactNode;
}

const navigation = [{ name: "Patients", href: "/patient" }];

export default function PatientTopMenuLayout({
  children,
}: PatientTopMenuLayoutProps) {
  const router = useRouter();
  const { data: patients, isLoading } = trpc.patientsRouter.list.useQuery();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <nav className="flex items-center gap-6 px-8 h-14">
          {navigation.map((item) => {
            const selected =
              router.pathname === item.href ||
              router.pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium pb-1 border-b-2 ${
                  selected
                    ? "text-secondary-500 border-secondary-500"
                    : "text-neutral-500 border-transparent hover:text-neutral-700"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1">{children}</div>
    </div>
  );
}
