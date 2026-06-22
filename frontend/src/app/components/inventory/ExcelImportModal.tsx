"use client";

import { useEffect, useState, useRef } from "react";
import {
  X, Upload, Download, CheckCircle2, AlertTriangle, AlertCircle,
  FileSpreadsheet, ArrowRight, Package, RefreshCw, Check, XCircle,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { TABLE } from "@/app/lib/data";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { MODAL } from "@/app/lib/containers";
import { E, Z } from "@/app/lib/elevation";
import { formatRupiah } from "@/app/lib/format";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";
import { toast } from "sonner";
import { useTranslation } from "@/app/i18n";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";

export interface ImportProductRow {
  sku: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  price: number;
  minStock: number;
  supplier?: string;
}

interface PreviewRow extends ImportProductRow {
  errors: string[];
}

const COLUMNS = [
  { key: "sku",      labelKey: "inv.excel.column.sku",          req: true  },
  { key: "name",     labelKey: "inv.excel.column.product_name", req: true  },
  { key: "category", labelKey: "inv.excel.column.category",     req: false },
  { key: "unit",     labelKey: "inv.excel.column.unit",         req: false },
  { key: "stock",    labelKey: "inv.excel.column.stock",        req: true  },
  { key: "price",    labelKey: "inv.excel.column.sell_price",   req: true  },
  { key: "minStock", labelKey: "inv.excel.column.min_stock",    req: false },
  { key: "supplier", labelKey: "inv.excel.column.supplier",     req: false },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: ImportProductRow[]) => void;
}

export function ExcelImportModal({ isOpen, onClose, onImport }: Props) {
  const { t } = useTranslation();
  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [isDragging, setDrag]   = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing]   = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isDemoDataEnabled()) return;

    let cancelled = false;
    void import("@/app/demo/excel-import-preview").then(({ DEMO_EXCEL_IMPORT_PREVIEW }) => {
      if (!cancelled) setPreviewRows(DEMO_EXCEL_IMPORT_PREVIEW);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isOpen) return null;

  const valid  = previewRows.filter(r => r.errors.length === 0);
  const errors = previewRows.filter(r => r.errors.length >  0);
  const stepLabel =
    step === 1 ? t("inv.excel.step.upload") :
    step === 2 ? t("inv.excel.step.preview") :
    t("inv.excel.step.importing");
  const previewHeaders = [
    { key: "row", label: t("inv.excel.column.row") },
    { key: "sku", label: t("inv.excel.column.sku") },
    { key: "name", label: t("inv.excel.column.product_name") },
    { key: "category", label: t("inv.excel.column.category") },
    { key: "stock", label: t("inv.excel.column.stock") },
    { key: "price", label: t("inv.excel.column.price") },
    { key: "supplier", label: t("inv.excel.column.supplier") },
    { key: "status", label: t("inv.excel.column.status") },
  ];

  const handleFile = (file: File) => {
    setFileName(file.name);
    setParsing(true);
    setTimeout(() => { setParsing(false); setStep(2); }, 900);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = () => {
    setStep(3);
    setTimeout(() => {
      onImport(valid);
      toast.success(t("inv.excel.toast.import_done", { valid: valid.length, skipped: errors.length }));
      handleReset();
    }, 1600);
  };

  const handleReset = () => {
    setStep(1); setFileName(null); setParsing(false); onClose();
  };

  return (
    <div className={cn(Z.modal, "fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200")}>
      <div className={cn(R.lg, E["2xl"], "bg-white dark:bg-slate-900 w-full max-w-2xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-4 duration-300 flex flex-col", MODAL.maxHeight.lg)}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(R.md, "size-9 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center")}>
              <FileSpreadsheet className={cn("size-5", C.success.icon)} />
            </div>
            <div>
              <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>
                {t("inv.excel.title")}
              </h3>
              <p className={cn(T.caption, "text-slate-400")}>
                {t("inv.excel.step_label", { step, label: stepLabel })}
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className={cn(R.sm, "p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all")}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-6 pt-4 pb-1 shrink-0">
          <div className="flex items-center gap-1.5">
            {([1, 2, 3] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={cn(
                  cn(T.dataSm, R.full, "size-6 flex items-center justify-center font-semibold transition-all duration-300"),
                  step > s  ? "bg-emerald-500 text-white"
                  : step === s ? "bg-slate-900 dark:bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}>
                  {step > s ? <Check className="size-3.5" aria-label={t("common.completed")} /> : s}
                </div>
                {i < 2 && (
                  <div className={cn(
                    "w-10 h-0.5 rounded transition-all duration-500",
                    step > s ? "bg-emerald-400" : "bg-slate-100 dark:bg-slate-800"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto min-h-0">

          {/* ─── Step 1: Upload ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <div
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => !parsing && fileRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-10 text-center transition-all select-none",
                  parsing  ? "cursor-wait opacity-70"
                  : isDragging ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 cursor-copy"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                )}
              >
                <input
                  ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {parsing
                  ? <RefreshCw className="size-9 text-indigo-400 mx-auto mb-3 animate-spin" />
                  : <Upload className="size-9 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                }
                <p className={cn(T.body, "font-bold text-slate-600 dark:text-slate-400")}>
                  {parsing ? t("inv.excel.drop.reading") : t("inv.excel.drop.prompt")}
                </p>
                <p className={cn(T.caption, "text-slate-400 mt-1.5")}>
                  {t("inv.excel.supported")}
                </p>
              </div>

              {/* Template download */}
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <Download className={cn("size-4 shrink-0", C.warning.icon)} />
                <div className="flex-1 min-w-0">
                  <p className={cn(T.bodySm, "font-bold", C.warning.text)}>{t("inv.excel.template.title")}</p>
                  <p className={cn(T.caption, "text-amber-500/80 mt-0.5")}>
                    {t("inv.excel.template.desc")}
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); toast.success(t("inv.excel.toast.template")); }}
                  className={cn(T.buttonSm, R.sm, "px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white cursor-pointer transition-all shrink-0")}
                >
                  {t("inv.excel.template.download")}
                </button>
              </div>

              {/* Column legend */}
              <div className="space-y-2">
                <p className={cn(T.label, "text-slate-400")}>{t("inv.excel.columns.recognized")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {COLUMNS.map(c => (
                    <span key={c.key} className={cn(
                      T.micro, R.xs, "px-2 py-0.5 border",
                      c.req
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent"
                        : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    )}>
                      {t(c.labelKey)}{c.req ? " *" : ""}
                    </span>
                  ))}
                </div>
                <p className={cn(T.caption, "text-slate-400")}>
                  {t("inv.excel.columns.required_note")}
                </p>
              </div>
            </div>
          )}

          {/* ─── Step 2: Preview ─── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet className={cn("size-4 shrink-0", C.success.icon)} />
                  <span className={cn(T.bodySm, "font-bold text-slate-700 dark:text-slate-300 truncate")}>{fileName}</span>
                  <span className={cn(T.caption, "font-bold text-slate-400 shrink-0")}>{t("inv.excel.rows", { count: previewRows.length })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(T.micro, R.xs, "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 border border-emerald-100 dark:border-emerald-900/40 inline-flex items-center gap-1")}>
                    <CheckCircle2 className="size-3" aria-hidden="true" /> {t("inv.excel.valid", { count: valid.length })}
                  </span>
                  {errors.length > 0 && (
                    <span className={cn(T.micro, R.xs, "text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 border border-rose-100 dark:border-rose-900/40 inline-flex items-center gap-1")}>
                      <AlertCircle className="size-3" aria-hidden="true" /> {t("inv.excel.error", { count: errors.length })}
                    </span>
                  )}
                </div>
              </div>

              <ResponsiveTable
                label={t("a11y.table.import_preview")}
                scrollerClassName="rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
                minWidthClassName="min-w-[920px]"
              >
                <table className={TABLE.base} aria-label={t("a11y.table.import_preview")}>
                  <thead className={TABLE.head}>
                    <tr>
                      {previewHeaders.map((h, index) => (
                        <th key={h.key} className={cn(TABLE.headCell, "px-3 py-2.5", index === 0 && "sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/50")}>{h.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={TABLE.body}>
                    {previewRows.map((row, i) => {
                      const hasErrors = row.errors.length > 0;
                      return (
                        <tr
                          key={`${row.sku || "row"}-${i}`}
                          className={cn(TABLE.row, TABLE.rowHover, "group", hasErrors && "bg-rose-50/40 dark:bg-rose-950/10")}
                        >
                          <td className={cn(
                            TABLE.cell,
                            T.caption,
                            "sticky left-0 z-10 px-3 py-2.5 font-bold text-slate-400",
                            hasErrors
                              ? "bg-rose-50 dark:bg-rose-950/30 group-hover:bg-rose-50"
                              : "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50"
                          )}>{i + 1}</td>
                          <td className={cn(
                            TABLE.cell,
                            T.code, "px-3 py-2.5 whitespace-nowrap",
                            !row.sku ? "text-rose-500" : "text-slate-600 dark:text-slate-400"
                          )}>
                            {row.sku || "—"}
                          </td>
                          <td className={cn(TABLE.cell, "px-3 py-2.5 whitespace-nowrap", T.bodySm, "font-bold text-slate-900 dark:text-slate-200")}>
                            {row.name}
                          </td>
                          <td className={cn(TABLE.cell, T.label, "px-3 py-2.5 text-slate-500 dark:text-slate-400")}>{row.category}</td>
                          <td className={cn(TABLE.cellNumeric, T.dataSm, "px-3 py-2.5 text-slate-700 dark:text-slate-300")}>{row.stock}</td>
                          <td className={cn(
                            TABLE.cellNumeric,
                            T.dataSm,
                            "px-3 py-2.5 whitespace-nowrap",
                            !row.price ? "text-rose-500" : "text-slate-700 dark:text-slate-300"
                          )}>
                            {row.price ? formatRupiah(row.price) : "—"}
                          </td>
                          <td className={cn(TABLE.cell, T.caption, "px-3 py-2.5 text-slate-400")}>{row.supplier || "—"}</td>
                          <td className={cn(TABLE.cell, "px-3 py-2.5")}>
                            {row.errors.length === 0 ? (
                              <span className={cn(T.micro, R.xs, "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 inline-flex items-center gap-1")}>
                                <CheckCircle2 className="size-3" aria-hidden="true" /> {t("inv.excel.valid_status")}
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                {row.errors.map((err, j) => (
                                  <span key={j} className={cn(T.micro, R.xs, "flex items-center gap-1 text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 whitespace-nowrap")}>
                                    <XCircle className="size-3 shrink-0" aria-hidden="true" /> {err}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ResponsiveTable>

              {errors.length > 0 && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
                  <AlertTriangle className={cn("size-4 shrink-0 mt-px", C.warning.icon)} />
                  <p className={cn(T.bodySm, "font-bold", C.warning.text)}>
                    {t("inv.excel.warning", { skipped: errors.length, valid: valid.length })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 3: Importing ─── */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-14 gap-5">
              <div className={cn(R.lg, "size-16 bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center")}>
                <Package className={cn("size-8 animate-pulse", C.primary.icon)} />
              </div>
              <div className="text-center">
                <p className={cn(T.bodyEmphasis, "text-slate-900 dark:text-slate-100")}>
                  {t("inv.excel.importing_count", { count: valid.length })}
                </p>
                <p className={cn(T.bodySm, "text-slate-400 mt-1")}>{t("inv.excel.saving")}</p>
              </div>
              <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full animate-[progress_1.6s_ease-in-out_forwards]" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 3 && (
          <div className="px-6 py-4 flex justify-between items-center shrink-0 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={step === 1 ? handleReset : () => setStep(1)}
              className={cn(T.buttonSm, R.md, "px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all")}
            >
              {step === 1 ? t("common.cancel") : t("common.back")}
            </button>
            {step === 2 && (
              <button
                onClick={handleImport}
                className={cn(T.buttonSm, R.md, E.glowSuccess, "flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer transition-all")}
              >
                {t("inv.excel.import_button", { count: valid.length })} <ArrowRight className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
