"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import Modal from "@/components/Modal";

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
  const [status, setStatus] = useState<"idle" | "success">("idle");

  useImperativeHandle(ref, () => ({
    open() {
      setStatus("idle");
      dialogRef.current?.showModal();
    },
  }));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = (e.currentTarget.elements.namedItem("message") as HTMLTextAreaElement).value;

    setStatus("success");

    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, userEmail }),
    }).then((res) => {
      if (!res.ok) console.error("Feedback submission failed");
    }).catch((err) => {
      console.error("Feedback submission error:", err);
    });
  }

  return (
    <Modal ref={dialogRef}>
      <div className="flex flex-col gap-4">
        <h3 className="heading-modal">Send Feedback</h3>

        {status === "success" ? (
          <p className="text-sm">Thanks for your feedback!</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              name="message"
              placeholder="Share your thoughts..."
              required
              rows={5}
              className="textarea textarea-bordered w-full resize-none text-sm"
            />

            <button
              type="submit"
              className="btn-text ml-auto"
            >
              Submit
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
});

FeedbackModal.displayName = "FeedbackModal";
