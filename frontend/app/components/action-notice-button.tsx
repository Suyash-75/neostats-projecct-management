"use client";

import { useId, useState, type ReactNode } from "react";
import { Icon } from "./ui";

export function ActionNoticeButton({
  children,
  title,
  message,
  className = "",
}: {
  children: ReactNode;
  title: string;
  message: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={className}>
        {children}
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#202638]/30 p-4"
          onClick={() => setIsOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-sm rounded-xl border border-[#eaecf1] bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-base font-semibold text-[#303748]">{title}</h2>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-[#8991a0] hover:bg-[#f5f6f8]"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#7b8394]">{message}</p>
            <button
              type="button"
              autoFocus
              onClick={() => setIsOpen(false)}
              className="mt-5 inline-flex h-9 items-center rounded-lg bg-[#6558d3] px-3.5 text-sm font-semibold text-white hover:bg-[#5749c3]"
            >
              Got it
            </button>
          </section>
        </div>
      )}
    </>
  );
}
