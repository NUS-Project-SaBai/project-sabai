import Modal from "@/components/interactive/Modal";
import { UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";

export default function OrderModal({
  setOrderModalIsOpen,
}: {
  setOrderModalIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return <Modal onClose={() => setOrderModalIsOpen(false)}>test</Modal>;
}
