export function IsRequiredStar({ isRequired }: { isRequired: boolean }) {
  return isRequired ? <span className="text-red-500">*</span> : null;
}
