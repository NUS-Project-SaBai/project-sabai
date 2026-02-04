import {
  ButtonSize,
  ButtonVariant,
  getButonTwClassNames,
} from "./buttonStyles";
import { ButtonColour } from "./buttonStyles";

/**
 * A customizable button component with support for multiple styles and variants.
 *
 * @param {() => void} [onClick] - Callback function triggered when the button is clicked
 * @param {string} [title] - The text label displayed on the button
 * @param {React.ReactNode} [icon=<></>] - An icon element to display within the button
 * @param {"button" | "submit" | "reset"} [type="button"] - The HTML button type attribute
 * @param {ButtonColour} [colour="white"] - The color scheme of the button
 * @param {ButtonVariant} [variant="outline"] - The visual style variant of the button @see ButtonVariant
 * @param {ButtonSize} [size="medium"] - The size of the button
 */
export function Button({
  onClick,
  title,
  icon = <></>,
  type = "button",
  colour = "white",
  variant = "outline",
  size = "medium",
}: {
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  title?: string;
  icon?: React.ReactNode;
  colour?: ButtonColour;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      onClick={onClick}
      type={type}
      title={title}
      className={getButonTwClassNames(colour, variant, size)}
    >
      {icon}
      {variant === "icon" || <p>{title}</p>}
    </button>
  );
}
