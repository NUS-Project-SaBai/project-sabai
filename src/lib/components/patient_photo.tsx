import { ImgProps } from 'next/dist/shared/lib/get-img-props';
import Image from 'next/image';

/**
 * PatientPhoto component displays a patient's photo, or a default image if the src is missing.
 * Defaults to height and width of 100 pixels.
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
      src={pictureUrl ?? '/default-profile.webp'}
      unoptimized={true}
      alt="Patient Photo"
      height={150}
      width={150}
      {...imgProps}
    />
  );
}