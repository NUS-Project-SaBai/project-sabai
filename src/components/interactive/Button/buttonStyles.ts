import { HTMLProps } from "react";

export type ButtonColour = "white" | "emerald" | "red";

/**
 * Represents the available visual styles for button components.
 *
 * @description
 * - `filled`: Solid background button with contrasting text
 * - `outline`: Bordered button with transparent background
 * - `text`: Minimal button with text only, no background or border
 * - `icon`: Icon-only button
 */
export type ButtonVariant = "filled" | "outline" | "text" | "icon";

export type ButtonSize = "small" | "medium" | "large";

export const getButonTwClassName = (
  colour: ButtonColour,
  variant: ButtonVariant,
  size: ButtonSize | undefined = undefined,
): string => {
  return `${ButtonTWClassName[colour][variant]} ${
    size && ButtonSizeTWClassName[size]
  } ${BASE_BUTTON_CLASS}`;
};

type TWClassName = HTMLProps<HTMLElement>["className"];
const ButtonTWClassName: Record<
  ButtonColour,
  Record<ButtonVariant, TWClassName>
> = {
  white: {
    filled: "bg-white text-gray-800 hover:bg-gray-200",
    outline: "border text-gray-800 hover:text-gray-500 hover:shadow-lg",
    text: "text-gray-800 hover:text-gray-500",
    icon: "text-gray-800 hover:text-gray-500",
  },
  emerald: {
    filled: "bg-emerald-600 text-white hover:bg-emerald-700",
    outline: "border border-emerald-600 text-emerald-600 hover:bg-emerald-50",
    text: "text-emerald-600 hover:text-emerald-700",
    icon: "text-emerald-600 hover:text-emerald-700",
  },
  red: {
    filled: "bg-red-700 text-white hover:bg-red-800",
    outline: "border border-red-700 text-red-700 hover:bg-red-800",
    text: "text-red-700 hover:text-red-700",
    icon: "text-red-700 hover:text-red-700",
  },
};

const ButtonSizeTWClassName: Record<ButtonSize, string> = {
  small: "px-3 py-1 text-sm",
  medium: "px-4 py-2 text-base",
  large: "px-5 py-3 text-lg",
};

const BASE_BUTTON_CLASS =
  "flex items-center gap-2 justify-center hover:cursor-pointer rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed";
