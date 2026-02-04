import { HTMLProps } from "react";

export type ButtonColour = "white";

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

export const getButonTwClassNames = (
  colour: ButtonColour,
  variant: ButtonVariant,
  size: ButtonSize | undefined = undefined,
): string => {
  return `${ButtonTWClassNames[colour][variant]} ${
    size && ButtonSizeTWClassNames[size]
  } ${BASE_BUTTON_CLASSES}`;
};

type TWClassName = HTMLProps<HTMLElement>["className"];
const ButtonTWClassNames: Record<
  ButtonColour,
  Record<ButtonVariant, TWClassName>
> = {
  white: {
    filled: "bg-white text-gray-800 hover:bg-gray-200",
    outline: "border text-gray-800 hover:text-gray-500 hover:shadow-lg",
    text: "text-gray-800 hover:text-gray-500",
    icon: "text-gray-800 hover:text-gray-500",
  },
};

const ButtonSizeTWClassNames: Record<ButtonSize, string> = {
  small: "px-3 py-1 text-sm",
  medium: "px-4 py-2 text-base",
  large: "px-5 py-3 text-lg",
};

const BASE_BUTTON_CLASSES =
  "flex items-center gap-2 justify-center hover:cursor-pointer rounded-lg transition";
