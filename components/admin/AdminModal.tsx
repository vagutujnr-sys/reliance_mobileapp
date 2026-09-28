"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { ActionResult } from "@/lib/actions/app";

type AdminModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
};

export function AdminModal({ open, title, onClose, children, footer, widthClass = "max-w-xl" }: AdminModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-3 sm:p-6" role="presentation">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-black/45" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" className={`relative flex max-h-[84dvh] w-full ${widthClass} flex-col overflow-hidden border border-line bg-white shadow-2xl`}>
        <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3">
          <h2 id="admin-modal-title" className="text-base font-semibold">{title}</h2>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="grid h-8 w-8 place-items-center text-muted hover:bg-canvas hover:text-ink"><X className="h-4 w-4" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-white px-5 py-3">{footer}</footer> : null}
      </section>
    </div>
  );
}

type AdminFormModalProps = {
  title: string;
  triggerLabel: string;
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<ActionResult<unknown>>;
  successMessage?: (data: unknown) => string;
  children: ReactNode;
};

export function AdminFormModal({ title, triggerLabel, submitLabel, onSubmit, successMessage, children }: AdminFormModalProps) {
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function submit(formData: FormData) {
    setPending(true);
    setError("");
    try {
      const result = await onSubmit(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setToast(successMessage?.(result.data) ?? `${title.replace(/^(Add|Create) /, "")} saved.`);
      window.setTimeout(() => setToast(""), 3500);
      router.refresh();
    } catch {
      setError("Unable to save. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => { setError(""); setOpen(true); }} className="inline-flex h-9 items-center gap-2 bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark">
        <Plus className="h-4 w-4" />{triggerLabel}
      </button>
      <AdminModal
        open={open}
        title={title}
        onClose={() => setOpen(false)}
        footer={<>
          <button type="button" onClick={() => setOpen(false)} className="h-9 border border-line px-3 text-sm">Cancel</button>
          <button type="submit" form={formId} disabled={pending} className="h-9 min-w-24 bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Saving..." : submitLabel}</button>
        </>}
      >
        <form id={formId} action={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {children}
          {error ? <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p> : null}
        </form>
      </AdminModal>
      {toast ? <div role="status" className="fixed bottom-5 right-5 z-[80] border border-emerald-200 bg-white px-4 py-3 text-sm shadow-lg">{toast}</div> : null}
    </>
  );
}

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<ActionResult<unknown>>;
  children: ReactNode;
};

export function ConfirmDialog({ title, description, confirmLabel, onConfirm, children }: ConfirmDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setPending(true);
    setError("");
    try {
      const result = await onConfirm();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Unable to complete this action. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <AdminModal open={open} title={title} onClose={() => setOpen(false)} widthClass="max-w-md" footer={<>
        <button type="button" onClick={() => setOpen(false)} className="h-9 border border-line px-3 text-sm">Cancel</button>
        <button type="button" onClick={confirm} disabled={pending} className="h-9 bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Working..." : confirmLabel}</button>
      </>}>
        <p className="text-sm text-muted">{description}</p>
        {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
      </AdminModal>
    </>
  );
}
