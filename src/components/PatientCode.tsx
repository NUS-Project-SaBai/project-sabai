import { formatPatientCode } from "@/lib/utils/patient";

export function PatientCode({
  villageCode,
  villageColorHex,
  id,
  className = "",
}: {
  villageCode: string | null;
  villageColorHex: string | null;
  id: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {villageColorHex && (
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: villageColorHex }}
          title={villageCode ?? undefined}
        />
      )}
      {formatPatientCode(villageCode, id)}
    </span>
  );
}
