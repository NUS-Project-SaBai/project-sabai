"use client";

import { FaWindowClose } from "react-icons/fa";
import { ReactNode, useEffect, useRef } from "react";

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={() => setIsOpen(false)}
    >
      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          setIsOpen(false);
        }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative flex min-h-60 flex-col justify-between self-center justify-self-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4"
        >
          <FaWindowClose className="text-red-500 text-2xl hover:text-red-700" />
        </button>
        {children}
      </dialog>
    </div>
  );
}
