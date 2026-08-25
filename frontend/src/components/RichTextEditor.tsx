"use client";

import { ReactNode, useRef } from "react";

interface RichTextEditorProps {
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ onChange, placeholder = "Type Your Reply..." }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  function exec(command: string, value?: string) {
    ref.current?.focus();
    document.execCommand(command, false, value);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  return (
    <div className="flex flex-1 flex-col rounded-md border border-gray-200">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 px-2 py-1.5">
        <ToolbarButton label="Bold" onClick={() => exec("bold")}>
          <b>B</b>
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec("italic")}>
          <i>I</i>
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => exec("underline")}>
          <u>U</u>
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-gray-200" />
        <ToolbarButton label="Bulleted list" onClick={() => exec("insertUnorderedList")}>
          •
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => exec("insertOrderedList")}>
          1.
        </ToolbarButton>
        <ToolbarButton label="Quote" onClick={() => exec("formatBlock", "blockquote")}>
          &quot;
        </ToolbarButton>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        data-placeholder={placeholder}
        className="min-h-[160px] flex-1 px-3 py-2 text-sm text-gray-900 outline-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded text-xs text-gray-600 hover:bg-gray-100"
    >
      {children}
    </button>
  );
}
