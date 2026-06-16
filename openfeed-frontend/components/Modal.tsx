"use client";

import { forwardRef } from "react";

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
}

const Modal = forwardRef<HTMLDialogElement, ModalProps>(
  ({ children, onClose }, ref) => {
    function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
      if (e.target === e.currentTarget) {
        e.currentTarget.close();
      }
    }

    return (
      <dialog
        ref={ref}
        onClose={onClose}
        onClick={handleBackdropClick}
        className="fixed inset-0 m-0 p-0 w-full h-full max-w-none max-h-none open:flex items-end sm:items-center justify-center open:bg-black/40 backdrop:hidden z-50 overflow-hidden"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:w-11/12 sm:max-w-lg max-h-[calc(100vh-5em)] overflow-y-auto p-6 bg-surface-raised shadow-md rounded-t-lg sm:rounded-lg"
        >
          {children}
        </div>
      </dialog>
    );
  },
);

Modal.displayName = "Modal";

export default Modal;
