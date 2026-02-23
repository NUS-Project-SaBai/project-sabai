import { clsx } from "clsx";
import Image from "next/image";

export default function LogoTitle({
  className,
  textClassName,
}: {
  className?: string;
  textClassName?: string;
}) {
  return (
    <div className={clsx("flex flex-row h-min items-center gap-2", className)}>
      <Image
        src="/favicon.ico"
        alt="Logo"
        width={32}
        height={32}
        className="h-8 w-8"
      />
      <span className={clsx("text-2xl font-extrabold", textClassName)}>
        Project Sa&apos;bai
      </span>
    </div>
  );
}
