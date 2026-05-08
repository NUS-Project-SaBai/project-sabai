import { clsx } from "clsx";
import SabaiLogo from "./SabaiLogo";

export default function LogoTitle({
  className,
  textClassName,
}: {
  className?: string;
  textClassName?: string;
}) {
  return (
    <div className={clsx("flex flex-row h-min items-center gap-2", className)}>
      <SabaiLogo />
      <span
        className={clsx(
          "text-2xl font-extrabold text-neutral-100",
          textClassName,
        )}
      >
        Project Sa&apos;bai
      </span>
    </div>
  );
}
