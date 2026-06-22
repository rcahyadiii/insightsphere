"use client";

import { useRef, useState } from "react";
import { useModalA11y } from "@/app/hooks/useModalA11y";
import { 
  X, 
  Share2, 
  MessageCircle, 
  FileText, 
  Mail, 
  Copy, 
  Check, 
  CheckCheck,
  Printer, 
  Download, 
  User, 
  Users,
  ShieldCheck,
  ShieldOff,
  ChevronRight,
  Send,
  Settings
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { E, Z } from "@/app/lib/elevation";
import { formatRupiah } from "@/app/lib/format";
import { useTranslation } from "@/app/i18n";
import { INPUT, TEXTAREA } from "@/app/lib/forms";
import { buildShareUrl } from "@/app/lib/share-providers";

// --- Types ---

export type ShareDataType = "insight" | "product" | "decision" | "weekly";
type ShareTab = "whatsapp" | "pdf" | "email";

export interface ShareData {
  title: string;
  type: ShareDataType;
  content: string;
  productName?: string;
  urgency?: "tinggi" | "sedang" | "rendah";
  price?: number;
}

interface ExportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareData;
}

// --- Mock Contacts ---

const CONTACTS = [
  { id: "1", name: "Tim Gudang Pusat", group: true, size: 4, phone: "62812000001" },
  { id: "2", name: "Manajer Cabang #1", group: false, size: 1, phone: "62813000002" },
  { id: "3", name: "Manajer Cabang #2", group: false, size: 1, phone: "62814000003" },
  { id: "4", name: "Tim Purchasing", group: true, size: 3, phone: "62815000004" },
  { id: "5", name: "Semua Manajer", group: true, size: 4, phone: "62816000005" },
];

const SHARE_PREVIEW = {
  whatsappShell: "bg-emerald-50 dark:bg-emerald-950/30",
  whatsappBubble: "bg-emerald-100 dark:bg-emerald-900/50",
} as const;

export function ExportShareModal({ isOpen, onClose, data }: ExportShareModalProps) {
  const { t, lang } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y({ isOpen, onClose, containerRef: modalRef });

  const [activeTab, setActiveTab] = useState<ShareTab>("whatsapp");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [additionalNote, setAdditionalNote] = useState("");
  const [hidePrivateData, setHidePrivateData] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // --- Logic ---

  const formatWAMessage = () => {
    const timeStr = new Date().toLocaleDateString(lang === "ID" ? "id-ID" : "en-US", { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
    });
    const urgencyIcon = data.urgency === "tinggi" ? "🔴" : data.urgency === "sedang" ? "🟡" : "⚪";
    
    let msg = `${urgencyIcon} *InsightSphere — ${data.title}*\n\n`;
    msg += `${data.content}\n\n`;
    
    if (data.productName) {
      msg += `📊 *Detail:*\n`;
      msg += `• ${t("table.product")}: ${data.productName}\n`;
      if (data.price && !hidePrivateData) {
        msg += `• HPP/Harga: ${formatRupiah(data.price)}\n`;
      }
    }
    
    if (additionalNote) {
      msg += `\n📝 *${t("share.note.short")}:*\n_${additionalNote}_\n`;
    }

    msg += `\n📅 ${timeStr} — _Dihasilkan oleh InsightSphere AI_`;
    return msg;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formatWAMessage());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendWA = () => {
    setIsSending(true);
    setTimeout(() => {
      const phone = selectedContacts.length > 0 
        ? CONTACTS.find(c => c.id === selectedContacts[0])?.phone
        : "";
      window.open(
        buildShareUrl("whatsapp", { phone, text: formatWAMessage() }),
        "_blank",
        "noopener,noreferrer",
      );
      setIsSending(false);
    }, 1500);
  };

  const handlePrint = () => {
     window.print();
  };

  if (!isOpen) return null;

  return (
    <div className={cn(Z.modal, "fixed inset-0 flex items-center justify-center p-4")}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 animate-in fade-in duration-150"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-share-title"
        tabIndex={-1}
        className={cn(R.xl, E["2xl"], "relative bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden focus:outline-none animate-in fade-in zoom-in-95 duration-150")}
      >
          {/* Header */}
          <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
             <div className="flex items-center gap-4">
                <div className={cn(R.lg, "size-12 bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center")}>
                   <Share2 className={cn("size-6", C.primary.icon)} />
                </div>
                <div>
                   <h2 id="export-share-title" className={cn(T.h1, "text-slate-900 dark:text-slate-100 leading-none")}>{t("share.title")}</h2>
                   <p className={cn(T.bodySm, "text-slate-400 mt-1")}>{t("share.subheader")}</p>
                </div>
             </div>
             <button 
               onClick={onClose}
               aria-label={t("common.close")}
               className={cn(R.lg, "p-3 border border-slate-100 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 transition-all")}
             >
                <X className="size-6" aria-hidden="true" />
             </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
             {/* Sidebar: Navigation Tabs */}
             <div className="w-72 border-r border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6 flex flex-col justify-between">
                <div className="space-y-2">
                   {[
                     { id: "whatsapp" as ShareTab, label: "WhatsApp", icon: MessageCircle, color: C.success.icon },
                     { id: "pdf" as ShareTab, label: lang === "ID" ? "PDF / Cetak" : "PDF / Print", icon: FileText, color: C.primary.icon },
                     { id: "email" as ShareTab, label: "E-Mail", icon: Mail, color: C.warning.icon },
                   ].map((tab) => (
                     <button 
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id)}
                       className={cn(
                         cn(T.buttonSm, R.lg, "w-full flex items-center gap-4 px-6 py-4 transition-all"),
                         activeTab === tab.id ? "bg-white dark:bg-slate-900 shadow-xl shadow-indigo-100/30 dark:shadow-indigo-900/30 text-slate-900 dark:text-slate-100" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                       )}
                     >
                        <tab.icon className={cn("size-5", activeTab === tab.id ? tab.color : "text-slate-300")} />
                        {tab.label}
                     </button>
                   ))}
                </div>

                <div className={cn(R.xl, "bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-800 italic space-y-4")}>
                   <p className={cn(T.label, "text-slate-400 leading-relaxed")}>Smart Sharing Tip:</p>
                   <p className={cn(T.bodySm, "text-slate-500 leading-relaxed")}>{t("share.tip")}</p>
                </div>
             </div>

             {/* Content Area */}
             <div className="flex-1 p-10 overflow-y-auto no-scrollbar bg-white dark:bg-slate-900">
                {activeTab === "whatsapp" && (
                   <div className="grid grid-cols-2 gap-10">
                      {/* Form Side */}
                      <div className="space-y-8">
                         <div>
                            <p className={cn(T.label, "text-slate-400 mb-4")}>{t("share.recipients")}</p>
                            <div className="grid grid-cols-1 gap-3">
                               {CONTACTS.map((c) => (
                                 <button 
                                   key={c.id}
                                   onClick={() => setSelectedContacts(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                                   className={cn(
                                     "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                     selectedContacts.includes(c.id) ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                                   )}
                                 >
                                    <div className="flex items-center gap-3">
                                       <div className={cn(R.full, "size-8 flex items-center justify-center", selectedContacts.includes(c.id) ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>
                                          {c.group ? <Users className="size-4" /> : <User className="size-4" />}
                                       </div>
                                       <div>
                                          <p className={cn(T.bodyEmphasis, selectedContacts.includes(c.id) ? "text-emerald-700 dark:text-emerald-300" : "text-slate-900 dark:text-slate-100")}>{c.name}</p>
                                          <p className={cn(T.caption, "text-slate-500")}>{c.size} orang • {c.phone}</p>
                                       </div>
                                    </div>
                                    {selectedContacts.includes(c.id) && <Check className="size-4 text-emerald-600" />}
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div>
                            <p className={cn(T.label, "text-slate-400 mb-4")}>{t("share.note")}</p>
                            <textarea 
                               placeholder={t("share.note.placeholder")}
                               value={additionalNote}
                               onChange={(e) => setAdditionalNote(e.target.value)}
                               className={cn(TEXTAREA.base, "h-24 p-4", T.bodySm, "font-bold")}
                            />
                         </div>

                         <div className={cn(R.xl, "flex items-center justify-between bg-slate-50 p-4")}>
                            <div className="flex items-center gap-3">
                               {hidePrivateData ? <ShieldCheck className="size-5 text-indigo-500" /> : <ShieldOff className="size-5 text-slate-400" />}
                               <div>
                                  <p className={cn(T.bodyEmphasis, "text-slate-900 dark:text-slate-100")}>{t("share.privacy")}</p>
                                  <p className={cn(T.caption, "text-slate-400")}>{t("share.privacy.desc")}</p>
                               </div>
                            </div>
                            <button 
                              onClick={() => setHidePrivateData(!hidePrivateData)}
                              className={cn(
                                "w-12 h-6 rounded-full transition-all relative",
                                hidePrivateData ? "bg-indigo-500" : "bg-slate-200"
                              )}
                            >
                               <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", hidePrivateData ? "right-1" : "left-1")} />
                            </button>
                         </div>
                      </div>

                      {/* Preview Side (WhatsApp Bubble) */}
                      <div className="space-y-4">
                         <p className={cn(T.label, "text-slate-400")}>{t("share.preview.wa")}</p>
                         <div className={cn(R.xl, E.inner, SHARE_PREVIEW.whatsappShell, "p-8 h-[400px] relative overflow-hidden flex flex-col justify-end border-8 border-slate-100")}>
                            <div className="absolute top-0 inset-x-0 bg-slate-900/10 p-4 border-b border-white/20 backdrop-blur-sm flex items-center justify-center">
                               <p className={cn(T.label, "text-slate-900")}>{t("share.preview.team")}</p>
                            </div>
                            
                            <div className={cn(R.lg, SHARE_PREVIEW.whatsappBubble, E.sm, "p-6 rounded-tr-none relative self-end max-w-[90%] animate-in slide-in-from-right duration-300")}>
                               <div className={cn("whitespace-pre-wrap font-bold text-slate-800 leading-relaxed font-sans", T.label)}>
                                  {formatWAMessage().split("\n").map((line, i) => (
                                    <div key={i}>{line}</div>
                                  ))}
                               </div>
                               <div className={cn(T.caption, "text-slate-500 mt-2 flex items-center justify-end gap-1")}>
                                  <span>08:42</span>
                                  <CheckCheck className="size-3.5" aria-hidden="true" />
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                {activeTab === "pdf" && (
                   <div className="space-y-10">
                      <div className="grid grid-cols-2 gap-10">
                         {/* Checklist */}
                         <div className="space-y-8">
                            <div>
                               <p className={cn(T.label, "text-slate-400 mb-6")}>{lang === "ID" ? "Dokumentasi yang Disertakan" : "Included Documentation"}</p>
                               <div className="space-y-4">
                                  {[
                                    "Analisis Faktor (XAI)",
                                    "Grafik Tren Permintaan",
                                    "Rekomendasi Restok",
                                    "Status Inventaris Saat Ini",
                                    "Timestamp Validasi AI"
                                  ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 bg-slate-50 p-5 border border-slate-100 rounded-2xl">
                                       <div className={cn(R.sm, "size-6 bg-emerald-500 flex items-center justify-center text-white")}>
                                          <Check className="size-4" />
                                       </div>
                                       <span className={cn(T.h4, "text-slate-900")}>{item}</span>
                                    </div>
                                  ))}
                               </div>
                            </div>
                         </div>

                         {/* Preview PDF */}
                         <div className={cn(R.xl, "bg-slate-50 border border-slate-100 p-10 flex flex-col items-center justify-center text-center space-y-6")}>
                             <div className={cn(R.xl, E.lg, "size-24 bg-white dark:bg-slate-800 flex items-center justify-center")}>
                                <FileText className="size-12 text-indigo-500" />
                             </div>
                             <div>
                                <h4 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>{t("share.pdf.title")}</h4>
                                <p className={cn(T.h4, "text-slate-400 mt-2")}>{t("share.pdf.desc")}</p>
                             </div>
                             <div className="grid grid-cols-1 w-full gap-4 pt-4 px-10">
                                <button 
                                  onClick={handlePrint}
                                  className={cn(T.buttonLg, R.lg, "w-full bg-slate-900 text-white py-4 flex items-center justify-center gap-3 hover:-translate-y-1 transition-all")}
                                >
                                   <Printer className="size-4" /> {t("share.pdf.btn.print")}
                                </button>
                                <button className={cn(T.buttonLg, R.lg, "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-4 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all")}>
                                   <Download className="size-4" /> {t("share.pdf.btn.raw")}
                                </button>
                             </div>
                         </div>
                      </div>
                   </div>
                )}

                {activeTab === "email" && (
                   <div className="space-y-8 max-w-2xl mx-auto">
                      <div className={cn(R.xl, "bg-amber-50 border border-amber-100 p-8 flex gap-6 items-center")}>
                         <div className={cn(R.lg, "size-14 bg-amber-500 text-white flex items-center justify-center shrink-0")}>
                            <Settings className="size-8" />
                         </div>
                         <div className="space-y-1">
                            <h4 className={cn(T.bodyEmphasis, "text-amber-900 uppercase")}>{t("share.email.smtp")}</h4>
                            <p className={cn("font-bold text-amber-700/60 leading-relaxed uppercase", T.label)}>{t("share.email.smtp.desc")}</p>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="space-y-2">
                           <p className={cn(T.label, "text-slate-400")}>{lang === "ID" ? "Penerima" : "Recipient"}</p>
                           <input type="text" value="hq@example.test" readOnly className={cn(INPUT.base, INPUT.size.lg, INPUT.readonly, T.bodySm, "font-bold")} />
                         </div>
                         <div className="space-y-2">
                           <p className={cn(T.label, "text-slate-400")}>{lang === "ID" ? "Subjek" : "Subject"}</p>
                           <input type="text" value={`[InsightSphere AI] ${data.title}`} className={cn(INPUT.base, INPUT.size.lg, T.bodySm, "font-bold")} />
                         </div>
                         <div className="space-y-2">
                           <p className={cn(T.label, "text-slate-400")}>{lang === "ID" ? "Pesan" : "Message"}</p>
                           <textarea className={cn(TEXTAREA.base, TEXTAREA.size.lg, "h-48 p-6 font-sans leading-relaxed", T.body, "font-medium")}>
                             {lang === "ID" ? "Halo Tim," : "Hello Team,"}

                             {lang === "ID" ? "Berikut adalah data terbaru dari sistem InsightSphere AI:" : "Here is the latest data from the InsightSphere AI system:"}
                             {data.title}
                             {data.content}

                             {lang === "ID" ? "Terima kasih." : "Thank you."}
                           </textarea>
                         </div>
                      </div>
                   </div>
                )}
             </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-10 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
             <button 
               onClick={handleCopy}
               className={cn(T.buttonSm, R.lg, "flex items-center gap-2 px-6 py-4 bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 transition-all")}
             >
                {isCopied ? <Check className={cn("size-4", C.success.icon)} /> : <Copy className="size-4" />}
                {isCopied ? t("share.btn.copied") : t("share.btn.copy")}
             </button>

             <div className="flex items-center gap-4">
                <button 
                  onClick={onClose}
                  className={cn(T.buttonSm, "px-8 py-4 text-slate-400 hover:text-slate-600 transition-all cursor-pointer")}
                >
                   {t("share.btn.cancel")}
                </button>
                {activeTab === "whatsapp" && (
                   <button 
                     onClick={handleSendWA}
                     disabled={isSending}
                     className={cn(T.buttonLg, R.xl, E.glowSuccess, "px-10 py-5 bg-emerald-500 text-white shadow-2xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 cursor-pointer")}
                   >
                      {isSending ? (
                        <div className={cn(R.full, "size-4 border-2 border-white/30 border-t-white animate-spin")} />
                      ) : (
                        <Send className="size-4" />
                      )}
                      {t("share.btn.wa")}
                   </button>
                )}
                {activeTab === "pdf" && (
                   <button 
                     onClick={handlePrint}
                     className={cn(T.buttonLg, R.xl, E.glowPrimary, "px-10 py-5 bg-indigo-600 text-white shadow-2xl hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3 cursor-pointer")}
                   >
                      <Printer className="size-4" /> {t("share.btn.print")}
                   </button>
                )}
             </div>
          </div>
      </div>
    </div>
  );
}
