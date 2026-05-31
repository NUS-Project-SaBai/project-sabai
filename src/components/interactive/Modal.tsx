"use client";

import { FaWindowClose } from "react-icons/fa";
import { ReactNode, useEffect, useRef } from "react";

export interface ModalProps {
  children: ReactNode;
  onClose?: () => void;
}

/**
 * A modal dialog that renders a centred modal with a backdrop. Contains a close button on the top right of the modal.
 * @param {ReactNode} children - The contents of the modal
 * @param {() => void} [onClose=()=>{}] - The function that runs when the Modal is closed or cancelled
 */
export default function Modal({ children, onClose = () => {} }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    requestAnimationFrame(() => {
      dialog!.showModal();
    });
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      className="inset-0 bg-white rounded-xl shadow-xl p-6 w-full max-w-md fixed flex min-h-60 flex-col justify-between self-center justify-self-center backdrop:fixed backdrop:inset-0 backdrop:bg-black/50"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onClose();
        }}
        className="absolute top-4 right-4"
      >
        <FaWindowClose className="text-red-500 text-2xl hover:text-red-700" />
      </button>
      {children}
    </dialog>
  );
}
