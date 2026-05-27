"use client";

import { createPortal } from "react-dom";
import { FaWindowClose } from "react-icons/fa";
import { ReactNode } from "react";

export interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * A modal component. This component mounts into `#modal-root`.
 * @param {ReactNode} children - The contents of the modal
 * @param {boolean} isOpen - Whether the modal is open or closed
 * @param {React.Dispatch<React.SetStateAction<boolean>>} setIsOpen - The set state function provided by React's useState hook
 */
export default function Modal({ children, isOpen, setIsOpen }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={() => setIsOpen(false)}
    >
      <dialog
        open={isOpen}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative flex min-h-60 flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4"
        >
          <FaWindowClose className="text-red-500" />
        </button>
        {children}
      </dialog>
    </div>,
    document.getElementById("modal-root")!,
  );
}
