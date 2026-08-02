"use client";

import { FaWindowClose } from "react-icons/fa";
import { ReactNode, useEffect, useRef } from "react";
import { Button } from "@/components/interactive/Button/Button";

export interface ModalProps {
  children: ReactNode;
  onClose?: () => void;
  /**
   * Optional header title. When provided, the modal renders a titled header
   * with a "Close" button (and an "or press Esc" hint) instead of bare corner cross.
   */
  title?: string;
}

/**
 * A modal dialog that renders a centred modal with a backdrop. When a `title`
 * is given, it shows a titled header with a Close button; otherwise it shows a
 * close cross in the top right corner.
 * @param {ReactNode} children - The contents of the modal
 * @param {() => void} [onClose=()=>{}] - The function that runs when the Modal is closed or cancelled
 * @param {string} [title] - Optional header title; enables the header + Close button layout
 */
export default function Modal({
  children,
  onClose = () => {},
  title,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      requestAnimationFrame(() => {
        dialog.showModal();
      });
    }
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
      {title ? (
        <div className="flex items-start justify-between gap-4 -mx-6 mb-4 px-6 pb-4 border-b border-slate-100">
          <h2 className="flex items-center min-h-10 text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <div className="flex flex-col items-end shrink-0">
            <div className="w-28 flex items-end justify-end">
              <Button title="Close" colour="red" onClick={() => onClose()} />
            </div>
            <span className="mt-1 text-xs text-slate-400">or press Esc</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            onClose();
          }}
          className="absolute top-4 right-4"
        >
          <FaWindowClose className="text-red-500 text-2xl hover:text-red-700" />
        </button>
      )}
      {children}
    </dialog>
  );
}
