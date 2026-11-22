import { ImgProps } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";

/**
 * PatientPhoto component displays a patient's photo, or a default image if the src is missing.
 * Defaults to a 128x128 pixel thumbnail, the standard size for patient list views.
 * Passing `className` replaces the default styling entirely.
 * @param pictureUrl - The URL of the patient's photo.
 * @param imgProps - Additional image properties to be passed to the Image component.
 * @returns The PatientPhoto component.
 */
export function PatientPhoto({
  pictureUrl,
  ...imgProps
}: { pictureUrl: string | null } & Partial<ImgProps>) {
  return (
    <Image
      src={pictureUrl ?? "/default-profile.webp"}
      unoptimized={true}
      alt="Patient Photo"
      height={128}
      width={128}
      className="h-32 w-32 max-w-none shrink-0 rounded-lg border border-slate-200 object-cover"
      {...imgProps}
    />
  );
}
