"use client";

import { forwardRef } from "react";

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
}

const Modal = forwardRef<HTMLDialogElement, ModalProps>(
  ({ children, onClose }, ref) => {
    return (
      <dialog
        ref={ref}
        onClose={onClose}
        className="modal modal-bottom sm:modal-middle rounded-xs"
      >
        <div className="modal-box rounded-xs">
          <form method="dialog">
            <button className="btn btn-ghost btn-sm btn-circle absolute right-2 top-2 focus:outline-none">
              ✕
            </button>
          </form>

          {children}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    );
  },
);

Modal.displayName = "Modal";

export default Modal;
