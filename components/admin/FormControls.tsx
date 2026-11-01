import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const inputClass =
  "h-11 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-accent/60 focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
  "w-full resize-y rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-accent/60 focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-xs font-medium text-zinc-300">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-[11px] text-zinc-500">{hint}</p>}
    </div>
  );
}

export function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${className}`.trim()} />;
}

export function SelectInput({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputClass} ${className}`.trim()} />
  );
}

export function TextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`${textareaClass} ${className}`.trim()} />
  );
}
