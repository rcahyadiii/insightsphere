"use client";

import { useParams, notFound } from "next/navigation";
import { PortalTemplate } from "@/app/components/PortalTemplate";
import { isRoleCode } from "@/app/domain/constants";
import { useTranslation } from "@/app/i18n";

export default function LoginPage() {
  const params = useParams();
  const { t } = useTranslation();
  const rawRole = typeof params.role === "string" ? params.role : "";

  if (!isRoleCode(rawRole)) {
    return notFound();
  }

  const title = t(`auth.login.${rawRole}.title`);
  const subtitle = t(`auth.login.${rawRole}.subtitle`);

  return <PortalTemplate portalType={rawRole} title={title} subtitle={subtitle} />;
}
