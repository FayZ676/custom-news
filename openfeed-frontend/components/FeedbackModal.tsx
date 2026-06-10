"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { Forminit } from "forminit";

import Modal from "@/components/Modal";

const forminit = new Forminit({ proxyUrl: "/api/forminit" });

export interface FeedbackModalHandle {
  open: () => void;
}

interface FeedbackModalProps {
  userEmail: string;
}

export const FeedbackModal = forwardRef<
  FeedbackModalHandle,
  FeedbackModalProps
>(({ userEmail }, ref) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    open() {
      setStatus("idle");
      setErrorMessage(null);
      dialogRef.current?.showModal();
    },
  }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const { error } = await forminit.submit("12sccwhqsbm", formData);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("success");
    form.reset();
  }

  return (
    <Modal ref={dialogRef}>
      <div className="flex flex-col gap-4">
        <h3 className="heading-modal pr-6">Send Feedback</h3>

        {status === "success" ? (
          <p className="text-sm">Thanks for your feedback!</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input type="hidden" name="fi-sender-email" value={userEmail} />
            <textarea
              name="fi-text-message"
              placeholder="Share your thoughts..."
              required
              rows={5}
              disabled={status === "loading"}
              className="textarea textarea-bordered w-full resize-none text-sm disabled:text-base-content/50"
            />

            {status === "error" && (
              <p className="text-sm text-error">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-text ml-auto"
            >
              {status === "loading" ? "Sending…" : "Submit"}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
});

FeedbackModal.displayName = "FeedbackModal";
