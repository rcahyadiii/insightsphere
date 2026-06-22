"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { C } from "@/app/lib/colors";
import { FOCUS } from "@/app/lib/forms";
import { R_COMPONENT } from "@/app/lib/radii";
import { T } from "@/app/lib/typography";
import { cn } from "@/app/lib/utils";

export type FilterSelectOption<TValue extends string = string> = {
  value: TValue;
  label: React.ReactNode;
  disabled?: boolean;
};

type FilterSelectProps<TValue extends string = string> = {
  id: string;
  label: React.ReactNode;
  value: TValue;
  options: readonly FilterSelectOption<TValue>[];
  onValueChange: (value: TValue) => void;
  icon?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
};

export function FilterSelect<TValue extends string = string>({
  id,
  label,
  value,
  options,
  onValueChange,
  icon,
  className,
  triggerClassName,
}: FilterSelectProps<TValue>) {
  const labelId = `${id}-label`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {icon}
      <span
        id={labelId}
        className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}
      >
        {label}
      </span>
      <Select
        value={value}
        onValueChange={(nextValue) => onValueChange(nextValue as TValue)}
      >
        <SelectTrigger
          id={id}
          aria-labelledby={labelId}
          className={cn(
            "h-10 min-w-[10rem] border",
            C.neutral.border,
            R_COMPONENT.input,
            "bg-white dark:bg-slate-900",
            "text-slate-900 dark:text-slate-100",
            T.body,
            FOCUS.ring,
            triggerClassName,
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" className="z-50">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
