"use client";

import { useState } from "react";
import {
  Plus,
  Clock,
  CheckCircle2,
  Loader2,
  X,
  Printer,
  User,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { useTranslation } from "@/app/i18n";
import { FIELD, INPUT, LABEL } from "@/app/lib/forms";

type JobStatus = "pending" | "processing" | "done" | "cancelled";

interface PrintJob {
  id: string;
  ticket: string;
  customerName: string;
  description: string;
  copies: number;
  status: JobStatus;
  createdAt: string;
}

const STATUS_STYLE: Record<JobStatus, { bg: string; text: string; border: string }> = {
  pending:    { bg: C.warning.bg,     text: C.warning.text,     border: C.warning.border },
  processing: { bg: C.primary.bg,     text: C.primary.text,     border: C.primary.border },
  done:       { bg: C.success.bg,     text: C.success.text,     border: C.success.border },
  cancelled:  { bg: C.destructive.bg, text: C.destructive.text, border: C.destructive.border },
};

const INITIAL_JOBS: PrintJob[] = [
  { id: "j1", ticket: "A-001", customerName: "Budi Santoso", description: "Skripsi BAB 1-5 (85 lembar, hitam putih)", copies: 1, status: "done", createdAt: "08:30" },
  { id: "j2", ticket: "A-002", customerName: "Rina Dewi", description: "Fotokopi KTP + KK (4 lembar)", copies: 2, status: "done", createdAt: "08:45" },
  { id: "j3", ticket: "A-003", customerName: "Pelanggan", description: "Print proposal warna A4 (12 lembar)", copies: 1, status: "processing", createdAt: "09:10" },
  { id: "j4", ticket: "A-004", customerName: "Hendra", description: "Jilid spiral laporan PKL", copies: 1, status: "pending", createdAt: "09:22" },
  { id: "j5", ticket: "A-005", customerName: "Pelanggan", description: "Scan ijazah + transkrip nilai", copies: 1, status: "pending", createdAt: "09:35" },
];

export function JobQueuePanel() {
  const { t } = useTranslation();
  const STATUS_LABEL: Record<JobStatus, string> = {
    pending: t("pos.job.status.pending"),
    processing: t("pos.job.status.processing"),
    done: t("pos.job.status.done"),
    cancelled: t("pos.job.status.cancelled"),
  };
  const [jobs, setJobs] = useState<PrintJob[]>(INITIAL_JOBS);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCopies, setNewCopies] = useState("1");

  const advanceStatus = (id: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id !== id) return j;
      const next: Record<JobStatus, JobStatus> = { pending: "processing", processing: "done", done: "done", cancelled: "cancelled" };
      return { ...j, status: next[j.status] };
    }));
  };

  const cancelJob = (id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: "cancelled" } : j));
  };

  const addJob = () => {
    if (!newDesc.trim()) return;
    const lastTicket = jobs.length > 0
      ? parseInt(jobs[jobs.length - 1].ticket.split("-")[1]) + 1
      : 1;
    const ticket = `A-${String(lastTicket).padStart(3, "0")}`;
    const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setJobs(prev => [...prev, {
      id: `j${Date.now()}`,
      ticket,
      customerName: newName.trim() || t("pos.job.default_customer"),
      description: newDesc.trim(),
      copies: parseInt(newCopies) || 1,
      status: "pending",
      createdAt: now,
    }]);
    setNewName(""); setNewDesc(""); setNewCopies("1");
    setShowForm(false);
  };

  const pendingCount = jobs.filter(j => j.status === "pending").length;
  const processingCount = jobs.filter(j => j.status === "processing").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Stats bar */}
      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className={cn(T.caption, "text-slate-500")}>{t("pos.job.pending_count", { count: pendingCount })}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className={cn(T.caption, "text-slate-500")}>{t("pos.job.processing_count", { count: processingCount })}</span>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={cn(T.buttonSm, R.md, "ml-auto flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-sm cursor-pointer")}
        >
          <Plus className="size-3.5" /> {t("pos.job.new")}
        </button>
      </div>

      {/* New job form */}
      {showForm && (
        <div className="px-6 py-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/30 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <p className={cn(T.h4, "text-indigo-600")}>{t("pos.job.form_title")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className={FIELD.wrapper}>
              <label htmlFor="jq-name" className={LABEL.base}>{t("pos.job.customer_name")}</label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
                <input
                  id="jq-name"
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={t("pos.job.customer_placeholder")}
                  className={cn(INPUT.base, INPUT.size.sm, "pl-7 pr-2 font-bold")}
                />
              </div>
            </div>
            <div className={FIELD.wrapper}>
              <label htmlFor="jq-copies" className={LABEL.base}>{t("pos.job.copies")}</label>
              <input
                id="jq-copies"
                type="number" min="1"
                value={newCopies}
                onChange={e => setNewCopies(e.target.value)}
                className={cn(INPUT.base, INPUT.size.sm, "font-bold tabular-nums")}
              />
            </div>
          </div>
          <div className={FIELD.wrapper}>
            <label htmlFor="jq-desc" className={LABEL.base}>{t("pos.job.desc")}</label>
            <input
              id="jq-desc"
              type="text"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder={t("pos.job.desc_placeholder")}
              className={cn(INPUT.base, INPUT.size.md, "font-bold")}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className={cn(T.buttonSm, R.md, "px-3 py-1.5 text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer")}>{t("pos.job.cancel")}</button>
            <button
              onClick={addJob}
              disabled={!newDesc.trim()}
              className={cn(T.buttonSm, R.sm, "px-4 py-1.5 bg-indigo-600 text-white disabled:opacity-40 cursor-pointer hover:bg-indigo-500 transition-all")}
            >
              {t("pos.job.add")}
            </button>
          </div>
        </div>
      )}

      {/* Job list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
        {jobs.map(job => {
          const cfg = STATUS_STYLE[job.status];
          const isActive = job.status === "pending" || job.status === "processing";
          return (
            <div key={job.id} className={cn("px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors", !isActive && "opacity-60")}>
              {/* Ticket number */}
              <div
                className={cn(R.md, "size-12 flex items-center justify-center border flex-shrink-0", cfg.bg, cfg.border)}
              >
                {job.status === "processing" ? (
                  <Loader2 className={cn("size-5 animate-spin", cfg.text)} />
                ) : job.status === "done" ? (
                  <CheckCircle2 className={cn("size-5", cfg.text)} />
                ) : job.status === "cancelled" ? (
                  <X className={cn("size-5", cfg.text)} />
                ) : (
                  <Printer className={cn("size-5", cfg.text)} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn(T.bodyEmphasis, "text-slate-900 dark:text-slate-100")}>{job.ticket}</span>
                  <span className={cn(T.micro, R.full, "px-1.5 py-0.5 border", cfg.bg, cfg.text, cfg.border)}>
                    {STATUS_LABEL[job.status]}
                  </span>
                </div>
                <p className={cn(T.bodySm, "font-bold text-slate-700 dark:text-slate-300 truncate")}>{job.description}</p>
                <p className={cn(T.caption, "text-slate-400 mt-0.5")}>{job.customerName} · {job.createdAt} · {job.copies}×</p>
              </div>

              {isActive && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => advanceStatus(job.id)}
                    className={cn(T.buttonSm, R.sm, "flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-700 transition-all cursor-pointer")}
                  >
                    {job.status === "pending" ? t("pos.job.advance_pending") : t("pos.job.advance_processing")}
                    <ChevronRight className="size-3" />
                  </button>
                  <button
                    onClick={() => cancelJob(job.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
