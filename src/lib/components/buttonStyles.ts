/* 

TO BE REPLACED!!

THIS FILE WAS COPIED OVER FROM OLD REPO TO MOCK FRONTEND WORKFLOW

FILES DEPENDENT ON THIS: 
- src/lib/components/button.tsx
- src/lib/components/webcam_input.tsx (indirectly through button.tsx)

*/
export type ButtonVariant =
  | "green"
  | "red"
  | "orange"
  | "blue"
  | "white"
  | "indigo";
export type ButtonStyle = "solid" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

type TailwindClass = string;

export const COLOUR_MAP: Record<
  ButtonVariant,
  Record<ButtonStyle, TailwindClass>
> = {
  green: {
    solid:
      "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600",
    outline:
      "border border-green-600 text-green-700 hover:bg-green-50 focus-visible:ring-green-600",
    ghost: "text-green-700 hover:bg-green-50 focus-visible:ring-green-600",
  },
  red: {
    solid: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
    outline:
      "border border-red-600 text-red-700 hover:bg-red-50 focus-visible:ring-red-600",
    ghost: "text-red-700 hover:bg-red-50 focus-visible:ring-red-600",
  },
  orange: {
    solid:
      "bg-orange-600 text-white hover:bg-orange-700 focus-visible:ring-orange-600",
    outline:
      "border border-orange-600 text-orange-700 hover:bg-orange-50 focus-visible:ring-orange-600",
    ghost: "text-orange-700 hover:bg-orange-50 focus-visible:ring-orange-600",
  },
  blue: {
    solid:
      "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
    outline:
      "border border-blue-600 text-blue-700 hover:bg-blue-50 focus-visible:ring-blue-600",
    ghost: "text-blue-700 hover:bg-blue-50 focus-visible:ring-blue-600",
  },
  indigo: {
    solid:
      "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-600",
    outline:
      "border border-indigo-600 text-indigo-700 hover:bg-indigo-50 focus-visible:ring-indigo-600",
    ghost: "text-indigo-700 hover:bg-indigo-50 focus-visible:ring-indigo-600",
  },
  white: {
    solid:
      "bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 focus-visible:ring-gray-400",
    outline:
      "border border-gray-300 text-gray-800 hover:bg-gray-50 focus-visible:ring-gray-400",
    ghost: "text-gray-800 hover:bg-gray-100 focus-visible:ring-gray-400",
  },
} as const;

export const SIZE_MAP: Record<ButtonSize, TailwindClass> = {
  sm: "px-2 py-0.5 md:px-3 sm:py-1.5 text-sm",
  md: "px-3 py-1.5 md:px-4 md:py-2 text-sm",
  lg: "px-4 py-2 md:px-5 md:py-3 text-base",
} as const;

export const BASE_BUTTON_STYLES: TailwindClass =
  "inline-flex items-center justify-center p-2 rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
