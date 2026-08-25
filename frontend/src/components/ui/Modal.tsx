"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}

export function Modal({ onClose, children, widthClassName = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative z-10 max-h-[90vh] w-full ${widthClassName} overflow-y-auto rounded-lg bg-white shadow-xl`}>
        {children}
      </div>
    </div>
  );
}
