"use client";

import { useState, useRef, useEffect } from "react";
import type { SitePage } from "@/lib/site-pages";
import { BOX_RADIUS } from "@/lib/site-frame";
import { FONT, DARK, GRAY, TYPE } from "@/lib/site-type";
const BORDER = "#CCCCCC";
const BORDER_FOCUS = "#888888";
const BG = "#FFFFFF";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CommissionFormState = {
  name: string;
  nameReading: string;
  email: string;
  type: string;
  budget: string;
  deadline: string;
  detail: string;
};

function normalizeEmailInput(value: string) {
  return value
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[＠]/g, "@")
    .replace(/[．。]/g, ".")
    .replace(/[‐－﹣−]/g, "-")
    .replace(/[^\w.@%+-]/g, "");
}

function isCommissionFormComplete(form: CommissionFormState) {
  return (
    form.name.trim() !== "" &&
    form.nameReading.trim() !== "" &&
    EMAIL_RE.test(normalizeEmailInput(form.email).trim()) &&
    form.type !== "" &&
    form.budget.trim() !== "" &&
    form.deadline.trim() !== "" &&
    form.detail.trim() !== ""
  );
}

function commissionFormError(form: CommissionFormState): string | null {
  if (!form.name.trim()) return "お名前を入力してください";
  if (!form.nameReading.trim()) return "お名前の読み方を入力してください";
  if (!normalizeEmailInput(form.email).trim()) return "メールアドレスを入力してください";
  if (!EMAIL_RE.test(normalizeEmailInput(form.email).trim())) {
    return "メールアドレスの形式が正しくありません";
  }
  if (!form.type) return "依頼種別を選択してください";
  if (!form.budget.trim()) return "ご予算を入力してください";
  if (!form.deadline.trim()) return "希望の日程を入力してください";
  if (!form.detail.trim()) return "ご依頼内容を入力してください";
  return null;
}

const fieldBase: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: BG,
  border: `1px solid ${BORDER}`,
  borderRadius: BOX_RADIUS,
  padding: "10px 12px",
  fontFamily: FONT,
  fontSize: TYPE.lead,
  color: DARK,
  transition: "border-color 0.15s",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: FONT, fontSize: TYPE.caption, color: GRAY, letterSpacing: "0.12em", marginBottom: "6px" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function TextInput({
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  inputMode,
  autoComplete,
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      inputMode={inputMode}
      autoComplete={autoComplete}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...fieldBase, borderColor: focused ? BORDER_FOCUS : BORDER }}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((v) => !v); }}
        style={{
          ...fieldBase,
          paddingRight: "36px",
          borderColor: open ? BORDER_FOCUS : BORDER,
          borderBottomLeftRadius: open ? 0 : BOX_RADIUS,
          borderBottomRightRadius: open ? 0 : BOX_RADIUS,
          cursor: "pointer",
          color: selected?.value ? DARK : GRAY,
        }}
      >
        {selected?.label ?? options[0]?.label}
      </div>
      <span
        style={{
          position: "absolute",
          right: "13px",
          top: "50%",
          pointerEvents: "none",
          width: "7px",
          height: "7px",
          borderRight: `1.5px solid ${GRAY}`,
          borderBottom: `1.5px solid ${GRAY}`,
          transform: open ? "translateY(-30%) rotate(225deg)" : "translateY(-60%) rotate(45deg)",
          transition: "transform 0.15s",
        }}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            background: BG,
            border: `1px solid ${BORDER_FOCUS}`,
            borderTop: "none",
            borderBottomLeftRadius: BOX_RADIUS,
            borderBottomRightRadius: BOX_RADIUS,
            overflow: "hidden",
          }}
        >
          {options.filter((o) => o.value !== "").map((o) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: "10px 12px",
                fontFamily: FONT,
                fontSize: TYPE.lead,
                color: o.value === value ? DARK : GRAY,
                cursor: "pointer",
                background: o.value === value ? "#F5F5F5" : BG,
                borderBottom: `1px solid ${BORDER}`,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#F5F5F5"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = o.value === value ? "#F5F5F5" : BG; }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TextArea({
  value,
  onChange,
  required,
  placeholder,
  minHeight = "140px",
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  minHeight?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...fieldBase,
        minHeight,
        resize: "vertical",
        borderColor: focused ? BORDER_FOCUS : BORDER,
      }}
    />
  );
}

type Props = { content: SitePage };

export default function CommissionClient({ content }: Props) {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CommissionFormState>({
    name: "",
    nameReading: "",
    email: "",
    type: "",
    budget: "",
    deadline: "",
    detail: "",
  });
  const [btnHover, setBtnHover] = useState(false);
  const canSubmit = isCommissionFormComplete(form);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = commissionFormError(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      ...form,
      email: normalizeEmailInput(form.email).trim(),
    };

    try {
      const res = await fetch("/api/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
        throw new Error(data.detail ?? data.error ?? "送信に失敗しました");
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100%", padding: "48px 32px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <p style={{ fontFamily: FONT, fontSize: TYPE.label, color: GRAY, letterSpacing: "0.14em", marginBottom: "12px" }}>
          COMMISSION
        </p>
        <h1 style={{ fontFamily: FONT, fontSize: TYPE.heading, fontWeight: 700, color: DARK, marginBottom: "4px" }}>
          {content.title.ja}
        </h1>
        <p style={{ fontFamily: FONT, fontSize: TYPE.lead, color: GRAY, marginBottom: "40px" }}>
          {content.title.en}
        </p>

        <div
          style={{
            fontFamily: FONT,
            fontSize: TYPE.lead,
            color: DARK,
            lineHeight: 1.9,
            marginBottom: "40px",
            paddingBottom: "40px",
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          {content.lead.ja && <p style={{ marginBottom: "12px" }}>{content.lead.ja}</p>}
          {content.lead.en && (
            <p style={{ fontFamily: FONT, fontSize: TYPE.small, color: GRAY }}>{content.lead.en}</p>
          )}
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontFamily: FONT, fontSize: TYPE.label, color: GRAY, letterSpacing: "0.12em", marginBottom: "16px" }}>
              MESSAGE RECEIVED
            </div>
            <div style={{ fontFamily: FONT, fontSize: TYPE.titleLg, color: DARK }}>
              送信しました。数日以内にご連絡いたします。
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Field label="NAME / お名前">
              <TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            </Field>
            <Field label="NAME READING / お名前の読み方">
              <TextInput
                placeholder="例: ごとう たつや"
                value={form.nameReading}
                onChange={(v) => setForm({ ...form, nameReading: v })}
                required
              />
            </Field>
            <Field label="EMAIL / メールアドレス">
              <TextInput
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: normalizeEmailInput(v) })}
                required
              />
            </Field>
            <Field label="TYPE / 依頼種別">
              <SelectInput
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v })}
                required
                options={[
                  { value: "", label: "選択してください" },
                  { value: "outsourcing", label: "業務委託 / Outsourcing" },
                  { value: "event", label: "イベント出展 / Event Exhibition" },
                  { value: "lecture", label: "講習 / Lecture" },
                  { value: "creative-advisor", label: "創作相談役 / Creative Advisor" },
                  { value: "interview", label: "取材 / Interview" },
                  { value: "other", label: "その他 / Other" },
                ]}
              />
            </Field>
            <Field label="BUDGET / ご予算">
              <TextInput placeholder="例: ¥50,000〜" value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} required />
            </Field>
            <Field label="PREFERRED SCHEDULE / 希望の日程">
              <TextArea
                placeholder="例: ○○○○年○○月○○日に納品をお願いしたい・取材をお願いしたい。"
                minHeight="96px"
                value={form.deadline}
                onChange={(v) => setForm({ ...form, deadline: v })}
                required
              />
            </Field>
            <Field label="DETAILS / ご依頼内容">
              <TextArea value={form.detail} onChange={(v) => setForm({ ...form, detail: v })} required />
            </Field>
            {error && (
              <p style={{ fontFamily: FONT, fontSize: TYPE.small, color: "#B00020" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                background: submitting ? GRAY : !canSubmit ? "#666666" : btnHover ? "#444444" : DARK,
                color: "#F5F5F5",
                padding: "14px 32px",
                fontFamily: FONT,
                fontSize: TYPE.label,
                letterSpacing: "0.14em",
                alignSelf: "flex-start",
                borderRadius: BOX_RADIUS,
                transition: "background 0.2s",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : !canSubmit ? 0.75 : 1,
              }}
            >
              {submitting ? "SENDING..." : "SEND REQUEST"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
