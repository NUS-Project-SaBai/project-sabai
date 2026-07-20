import { clsx } from "clsx";
import Image from "next/image";

export default function SabaiLogo({ className }: { className?: string }) {
  return (
    <div className={clsx("h-9 w-9 p-1 rounded-md bg-secondary-800", className)}>
      <Image src="/favicon.ico" alt="Logo" width={32} height={32} />
    </div>
  );
}
