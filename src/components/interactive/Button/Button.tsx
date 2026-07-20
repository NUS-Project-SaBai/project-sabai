import { FaSpinner } from "react-icons/fa";
import {
  ButtonColour,
  ButtonVariant,
  ButtonSize,
  getButonTwClassName,
} from "./buttonStyles";
import clsx from "clsx";

/**
 * A customizable button component with support for multiple styles and variants.
 *
 * @param {() => void} [onClick] - Callback function triggered when the button is clicked
 * @param {string} [title] - The text label displayed on the button
 * @param {React.ReactNode} [icon=<></>] - An icon element to display within the button
 * @param {"button" | "submit" | "reset"} [type="button"] - The HTML button type attribute
 * @param {ButtonColour} [colour="white"] - The color scheme of the button
 * @param {ButtonVariant} [variant="filled"] - The visual style variant of the button @see ButtonVariant
 * @param {ButtonSize} [size="medium"] - The size of the button
 * @param {boolean} [loading=false] - Whether the button is in loading state; disables the button and shows a spinner
 * @param {string} [className] - The classNames of the component
 */
export function Button({
  onClick,
  title,
  icon = <></>,
  type = "button",
  colour = "white",
  variant = "filled",
  size = "medium",
  loading = false,
  disabled = false,
  className = "",
}: {
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  title?: string;
  icon?: React.ReactNode;
  colour?: ButtonColour;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      type={type}
      title={title}
      disabled={loading || disabled}
      className={clsx(getButonTwClassName(colour, variant, size), className)}
    >
      {loading ? (
        <>
          <FaSpinner className="animate-spin" />
          {variant !== "icon" && <p className="ml-2">{title}</p>}
        </>
      ) : (
        <>
          {icon}
          {variant !== "icon" && <p>{title}</p>}
        </>
      )}
    </button>
  );
}
