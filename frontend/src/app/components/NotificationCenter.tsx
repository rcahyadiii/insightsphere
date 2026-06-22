"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Trash2, 
  CheckCheck, 
  Share2, 
  Zap,
  ShieldAlert,
  BarChart3,
  Lightbulb,
  Settings,
  ChevronRight,
  Info
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { Z } from "@/app/lib/elevation";
import { DROPDOWN } from "@/app/lib/overlays";
import Link from "next/link";
import { ExportShareModal, ShareData } from "./ExportShareModal";
import { useTranslation } from "@/app/i18n";
import { useEscapeClose } from "@/app/hooks/useEscapeClose";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";
import {
  fetchNotifications,
  markNotificationRead,
  type NotificationRead as ApiNotification,
} from "@/app/lib/notification-client";

// --- Types ---

type Urgency = "tinggi" | "sedang" | "rendah";
type NotifType = "anomali" | "kritis" | "prediksi" | "peluang" | "sistem";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  urgency: Urgency;
  isRead: boolean;
  link?: string;
  linkText?: string;
}

const MAX_NOTIFICATIONS = 50;
const POLL_INTERVAL_MS = 30_000;

// --- Mappers: backend API → UI types ---

const mapPriority = (p: ApiNotification["priority"]): Urgency => {
  if (p === "CRITICAL" || p === "HIGH") return "tinggi";
  if (p === "MEDIUM") return "sedang";
  return "rendah";
};

const mapCategory = (
  cat: ApiNotification["category"],
  priority: ApiNotification["priority"],
): NotifType => {
  if (cat === "INVENTORY") return priority === "CRITICAL" || priority === "HIGH" ? "kritis" : "prediksi";
  if (cat === "AI_INSIGHT") return priority === "CRITICAL" || priority === "HIGH" ? "anomali" : "prediksi";
  if (cat === "SALES") return "peluang";
  return "sistem";
};

const relativeTime = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "__just_now__";
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
};

const mapApiNotification = (n: ApiNotification): Notification => ({
  id: n.id,
  type: mapCategory(n.category, n.priority),
  title: n.title,
  message: n.message,
  time: relativeTime(n.created_at),
  urgency: mapPriority(n.priority),
  isRead: n.is_read,
  link: n.action_link ?? undefined,
  linkText: undefined,
});

export function NotificationCenter() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationPollTemplates, setNotificationPollTemplates] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [newNotifPing, setNewNotifPing] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedNotifForShare, setSelectedNotifForShare] = useState<ShareData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEscapeClose({
    isOpen,
    onClose: () => setIsOpen(false),
    triggerRef: bellRef,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // --- Logic ---

  const [lastPolled, setLastPolled] = useState<Date>(new Date());
  const pollCountRef = useRef(0);
  const pingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // === Demo mode: load seed data + fake polling ===
  useEffect(() => {
    if (!isDemoDataEnabled()) return;

    let cancelled = false;
    void import("@/app/demo/notifications").then(({ DEMO_NOTIFICATIONS, DEMO_NOTIFICATION_POLL_TEMPLATES }) => {
      if (!cancelled) {
        setNotifications(DEMO_NOTIFICATIONS);
        setNotificationPollTemplates(DEMO_NOTIFICATION_POLL_TEMPLATES);
      }
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isDemoDataEnabled() || notificationPollTemplates.length === 0) return;

    const poll = () => {
      if (isMuted) return;
      const template = notificationPollTemplates[pollCountRef.current % notificationPollTemplates.length];
      const newNotif: Notification = { ...template, id: `poll-${Date.now()}`, time: "__just_now__" };
      pollCountRef.current += 1;
      setNotifications(prev => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS));
      setLastPolled(new Date());
      setNewNotifPing(true);
      if (pingTimerRef.current) clearTimeout(pingTimerRef.current);
      pingTimerRef.current = setTimeout(() => setNewNotifPing(false), 3000);
    };

    const timer = setTimeout(poll, 8000);
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      if (pingTimerRef.current) clearTimeout(pingTimerRef.current);
    };
  }, [isMuted, notificationPollTemplates]);

  // === Non-demo mode: fetch real notifications + polling ===
  useEffect(() => {
    if (isDemoDataEnabled()) return;

    let cancelled = false;

    const load = (isBackground = false) => {
      fetchNotifications({ limit: 50 })
        .then((res) => {
          if (cancelled) return;
          const mapped = res.items.map(mapApiNotification);
          if (isBackground) {
            // Merge: prepend new (unseen) items, preserve local read state for existing
            setNotifications((prev) => {
              const prevIds = new Set(prev.map((n) => n.id));
              const newItems = mapped.filter((m) => !prevIds.has(m.id));
              if (newItems.length === 0) return prev;
              if (!isMuted) {
                setNewNotifPing(true);
                if (pingTimerRef.current) clearTimeout(pingTimerRef.current);
                pingTimerRef.current = setTimeout(() => setNewNotifPing(false), 3000);
              }
              return [...newItems, ...prev].slice(0, MAX_NOTIFICATIONS);
            });
          } else {
            setNotifications(mapped.slice(0, MAX_NOTIFICATIONS));
          }
          setLastPolled(new Date());
        })
        .catch(() => { /* silent — keep existing list */ });
    };

    load(false);
    const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (pingTimerRef.current) clearTimeout(pingTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (!isDemoDataEnabled()) {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      for (const id of unreadIds) {
        void markNotificationRead(id).catch(() => { /* best-effort */ });
      }
    }
  };

  const toggleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n)
    );
    if (!isDemoDataEnabled()) {
      const target = notifications.find(n => n.id === id);
      if (target && !target.isRead) {
        void markNotificationRead(id).catch(() => { /* best-effort */ });
      }
    }
  };

  const removeNotif = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const handleShare = (n: Notification) => {
    setSelectedNotifForShare({
      title: n.title,
      type: "insight",
      content: n.message,
      urgency: n.urgency
    });
    setShareModalOpen(true);
  };

  const filters = [
    { label: t("notif.filter.all"), id: "Semua" },
    { label: t("notif.filter.unread"), id: "Belum Dibaca" },
    { label: t("notif.filter.anomaly"), id: "Anomali" },
    { label: t("notif.filter.critical"), id: "Kritis" }
  ];

  const filteredNotifs = notifications.filter(n => {
    if (activeFilter === "Semua") return true;
    if (activeFilter === "Belum Dibaca") return !n.isRead;
    if (activeFilter === "Anomali") return n.type === "anomali";
    if (activeFilter === "Kritis") return n.type === "kritis";
    return true;
  });

  const getUrgencyColor = (u: Urgency) => {
    if (u === "tinggi") return "bg-rose-500";
    if (u === "sedang") return "bg-amber-500";
    return "bg-slate-300";
  };

  const getIcon = (type: NotifType) => {
    switch (type) {
      case "anomali": return <Zap className={cn("w-4 h-4", C.warning.icon)} />;
      case "kritis": return <ShieldAlert className={cn("w-4 h-4", C.destructive.icon)} />;
      case "prediksi": return <BarChart3 className={cn("w-4 h-4", C.primary.icon)} />;
      case "peluang": return <Lightbulb className={cn("w-4 h-4", C.success.icon)} />;
      case "sistem": return <Settings className="w-4 h-4 text-slate-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`${t("notif.title")}${unreadCount > 0 ? `, ${unreadCount} ${t("notif.filter.unread").toLowerCase()}` : ""}`}
        className={cn(
          "relative h-10 w-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 transition-all group",
          newNotifPing && "animate-bounce"
        )}
      >
        <Bell className={cn(
          "w-5 h-5 transition-colors", 
          unreadCount > 0 ? "text-indigo-600" : "text-slate-500",
          isOpen && "text-indigo-600"
        )} />
        
        {/* Fix #6: show numeric badge when count ≤ 9, dot when > 9 */}
        {unreadCount > 0 && (
          unreadCount <= 9 ? (
            <span className={cn(
              T.label,
              DROPDOWN.notificationBadge.count,
              notifications.some(n => n.type === "anomali" && !n.isRead) ? "bg-rose-500" : "bg-indigo-600",
              newNotifPing && "animate-ping"
            )}>{unreadCount}</span>
          ) : (
            <span className={cn(
              T.caption,
              DROPDOWN.notificationBadge.overflow,
              "bg-rose-500"
            )}>9+</span>
          )
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className={cn(DROPDOWN.size.notificationPanel, "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:rounded-3xl", Z.dropdown, "animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150")}
        >
            {/* Header */}
            <div className={cn("px-5 py-4 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0", Z.raised)}>
               <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                     <h3 className={cn(T.h4, "text-slate-900 dark:text-slate-100")}>{t("notif.header")}</h3>
                     <span className={cn(T.micro, "px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg")}>{unreadCount} {t("notif.new")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <button 
                       onClick={() => setIsMuted(!isMuted)}
                       aria-label={isMuted ? t("notif.unmute") : t("notif.mute")}
                       aria-pressed={isMuted}
                       className="p-2.5 text-slate-400 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded-lg transition-colors"
                     >
                        {isMuted
                          ? <VolumeX className="w-5 h-5" aria-hidden="true" />
                          : <Volume2 className="w-5 h-5" aria-hidden="true" />}
                     </button>
                     <button 
                       onClick={markAllRead}
                       aria-label={t("notif.mark.all")}
                       title={t("notif.mark.all")}
                       className="p-2 text-slate-400 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded-lg transition-colors"
                     >
                        <CheckCheck className="w-5 h-5" aria-hidden="true" />
                     </button>
                  </div>
               </div>

               {/* Filters */}
               <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
                  {filters.map(f => (
                    <button 
                      key={f.id}
                      onClick={() => setActiveFilter(f.id)}
                      className={cn(
                        T.buttonSm,
                        "flex-1 py-2 rounded-xl transition-all",
                        activeFilter === f.id ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
               </div>
            </div>

            {/* Content List */}
            <div className="overflow-y-auto no-scrollbar flex-1 bg-white dark:bg-slate-900">
               {filteredNotifs.length > 0 ? (
                 <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredNotifs.map((n) => (
                      <div 
                        key={n.id} 
                        className={cn(
                          "px-5 py-4 transition-colors group relative flex gap-3",
                          !n.isRead && "bg-indigo-50/20 dark:bg-indigo-900/10"
                        )}
                      >
                         {/* Icon Box */}
                         <div className="shrink-0 w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center transition-transform group-hover:scale-110">
                            {getIcon(n.type)}
                         </div>

                         {/* Text Content */}
                         <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  <h4 className={cn(T.bodyEmphasis, "text-slate-900 dark:text-slate-100 leading-tight")}>{n.title}</h4>
                                  {!n.isRead && <span className="w-2 h-2 bg-indigo-600 rounded-full" />}
                               </div>
                               <button 
                                 onClick={() => removeNotif(n.id)}
                                 aria-label={t("notif.delete")}
                                 className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all"
                               >
                                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                               </button>
                            </div>
                            <p className={cn("text-slate-500 line-clamp-2 leading-relaxed", T.caption)}>{n.message}</p>
                            
                            <div className="flex items-center justify-between pt-2">
                               <div className="flex items-center gap-3">
                                  <span className={cn("font-bold text-slate-400", T.label)}>
                                    {n.time === "__just_now__" ? t("notif.just_now") : n.time}
                                  </span>
                                  <span className={cn(
                                    T.micro, "px-2 py-1 text-white",
                                    R.xl,
                                    getUrgencyColor(n.urgency)
                                  )}>
                                     {t(`notif.urgency.${n.urgency}`)}
                                  </span>
                               </div>
                               
                               <div className="flex items-center gap-2">
                                  {n.link && (
                                    <Link 
                                      href={n.link}
                                      onClick={() => { toggleRead(n.id); setIsOpen(false); }}
                                      className={cn(T.buttonSm, "flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800 rounded-xl transition-all")}
                                    >
                                       {n.linkText || "View"} <ChevronRight className="w-3 h-3" />
                                    </Link>
                                  )}
                                  <button 
                                    onClick={() => handleShare(n)}
                                    aria-label={t("notif.share")}
                                    className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"
                                  >
                                     <Share2 className="w-4 h-4" aria-hidden="true" />
                                  </button>
                               </div>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="p-20 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                       <Bell className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className={cn(T.body, "font-bold text-slate-900 dark:text-slate-100")}>{t("notif.empty")}</p>
                    <p className={cn("font-medium text-slate-400 mt-2", T.label)}>{t("notif.empty.desc")}</p>
                 </div>
               )}
            </div>

            {/* Footer */}
            <div className={cn("px-5 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between sticky bottom-0", Z.raised)}>
               <p className={cn(T.caption, "text-slate-400 flex items-center gap-2")}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isDemoDataEnabled() ? t("notif.polling") : t("notif.live")} · {lastPolled.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
               </p>
               <Link 
                 href="/pengaturan" 
                 onClick={() => setIsOpen(false)}
                 className={cn(T.buttonSm, "text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors flex items-center gap-1.5")}
               >
                  {t("notif.settings")} <ChevronRight className="w-3 h-3" />
               </Link>
            </div>
        </div>
      )}

      {selectedNotifForShare && (
        <ExportShareModal 
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          data={selectedNotifForShare}
        />
      )}
    </div>
  );
}
