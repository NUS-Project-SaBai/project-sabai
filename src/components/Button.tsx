import { ButtonSize, ButtonVariant, getButonTwClassName } from "./buttonStyles";
import { ButtonColour } from "./buttonStyles";
import { FaSpinner } from "react-icons/fa";

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
 * @param {boolean} [loading=false] - Whether the button is in loading state; disables the button and shows a spinner
 */
export function Button({
  onClick,
  title,
  icon = <></>,
  type = "button",
  colour = "white",
  variant = "outline",
  size = "medium",
  loading = false,
}: {
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  title?: string;
  icon?: React.ReactNode;
  colour?: ButtonColour;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      type={type}
      title={title}
      disabled={loading}
      className={getButonTwClassName(colour, variant, size)}
    >
      {loading ? (
        <FaSpinner className="animate-spin" />
      ) : (
        <>
          {icon}
          {variant !== "icon" && <p>{title}</p>}
        </>
      )}
    </button>
  );
}
