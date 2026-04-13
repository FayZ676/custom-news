"use client";

import { forwardRef } from "react";

interface ModalProps {
  children: React.ReactNode;
}

const Modal = forwardRef<HTMLDialogElement, ModalProps>(({ children }, ref) => {
  return (
    <dialog
      ref={ref}
      className="modal modal-bottom sm:modal-middle rounded-none"
    >
      <div className="modal-box rounded-none">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
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
});

Modal.displayName = "Modal";

export default Modal;
