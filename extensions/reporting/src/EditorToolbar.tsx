import React, { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  IndentDecrease,
  IndentIncrease,
  Table2,
  ImagePlus,
  Undo2,
  Redo2,
  Palette,
  ChevronDown,
  Pilcrow,
  X,
} from "lucide-react";

function Tool({
  label,
  icon: Icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="report-tool"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
    </button>
  );
}

export function SelectControl({
  label,
  children,
  value,
  onChange,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <span className={`report-select ${className}`}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      <ChevronDown size={14} aria-hidden="true" />
    </span>
  );
}

export default function EditorToolbar({
  editor,
  onError,
}: {
  editor: Editor;
  onError: (message: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [tableMenu, setTableMenu] = useState(false);
  const inTable = editor.isActive("table");
  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 1024 * 1024
    ) {
      onError("Choose a PNG, JPEG, or WebP image smaller than 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () =>
      onError("The image could not be read. Please try another file.");
    reader.onload = () => {
      if (editor.isDestroyed) return;
      editor
        .chain()
        .focus()
        .setImage({ src: String(reader.result), alt: file.name })
        .run();
    };
    reader.readAsDataURL(file);
  };
  return (
    <div
      className="report-toolbar"
      role="toolbar"
      aria-label="Report formatting"
    >
      <div className="report-tool-group">
        <Pilcrow
          className="report-paragraph-icon"
          size={14}
          aria-hidden="true"
        />
        <SelectControl
          label="Paragraph style"
          className="report-block-select"
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
                ? "h2"
                : "p"
          }
          onChange={(value) =>
            value === "p"
              ? editor.chain().focus().setParagraph().run()
              : editor
                  .chain()
                  .focus()
                  .setHeading({ level: value === "h1" ? 1 : 2 })
                  .run()
          }
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
        </SelectControl>
      </div>
      <div className="report-tool-group">
        <label className="report-tool report-color" title="Text color">
          <Palette size={15} strokeWidth={1.6} aria-hidden="true" />
          <input
            type="color"
            aria-label="Text color"
            value={editor.getAttributes("textStyle").color || "#f8fafc"}
            onChange={(event) =>
              editor.chain().focus().setColor(event.target.value).run()
            }
          />
        </label>
        <SelectControl
          label="Font family"
          value={editor.getAttributes("textStyle").fontFamily || ""}
          onChange={(value) =>
            value
              ? editor.chain().focus().setFontFamily(value).run()
              : editor.chain().focus().unsetFontFamily().run()
          }
        >
          <option value="">Font</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
        </SelectControl>
        <SelectControl
          label="Font size"
          className="report-size-select"
          value={editor.getAttributes("textStyle").fontSize || ""}
          onChange={(value) =>
            value
              ? editor.chain().focus().setFontSize(value).run()
              : editor.chain().focus().unsetFontSize().run()
          }
        >
          <option value="">Size</option>
          {[12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
            <option key={size} value={`${size}px`}>
              {size}
            </option>
          ))}
        </SelectControl>
      </div>
      <div className="report-tool-group">
        <Tool
          label="Bold"
          icon={Bold}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <Tool
          label="Italic"
          icon={Italic}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <Tool
          label="Underline"
          icon={Underline}
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <Tool
          label="Strikethrough"
          icon={Strikethrough}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <Tool
          label="Inline code"
          icon={Code}
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />
      </div>
      <div className="report-tool-group">
        <Tool
          label="Bullet list"
          icon={List}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <Tool
          label="Numbered list"
          icon={ListOrdered}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
      </div>
      <div className="report-tool-group">
        <Tool
          label="Decrease list indent"
          icon={IndentDecrease}
          disabled={!editor.can().liftListItem("listItem")}
          onClick={() => editor.chain().focus().liftListItem("listItem").run()}
        />
        <Tool
          label="Increase list indent"
          icon={IndentIncrease}
          disabled={!editor.can().sinkListItem("listItem")}
          onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
        />
      </div>
      <div className="report-tool-group">
        {(
          [
            ["left", AlignLeft],
            ["center", AlignCenter],
            ["right", AlignRight],
            ["justify", AlignJustify],
          ] as const
        ).map(([alignment, icon]) => (
          <Tool
            key={alignment}
            label={`Align ${alignment}`}
            icon={icon}
            active={editor.isActive({ textAlign: alignment })}
            onClick={() => editor.chain().focus().setTextAlign(alignment).run()}
          />
        ))}
      </div>
      <div className="report-tool-group report-insert-group">
        <Tool
          label={inTable ? "Table options" : "Insert table"}
          icon={Table2}
          active={tableMenu}
          onClick={() => setTableMenu(!tableMenu)}
        />
        {tableMenu && (
          <div
            className="report-table-menu"
            onKeyDown={(event) => {
              if (event.key === "Escape") setTableMenu(false);
            }}
          >
            <div className="report-menu-heading">
              <strong>Table</strong>
              <button
                aria-label="Close table options"
                onClick={() => setTableMenu(false)}
              >
                <X size={14} />
              </button>
            </div>
            {(inTable
              ? [
                  [
                    "Add row below",
                    () => editor.chain().focus().addRowAfter().run(),
                  ],
                  [
                    "Add column after",
                    () => editor.chain().focus().addColumnAfter().run(),
                  ],
                  [
                    "Delete row",
                    () => editor.chain().focus().deleteRow().run(),
                  ],
                  [
                    "Delete column",
                    () => editor.chain().focus().deleteColumn().run(),
                  ],
                  [
                    "Delete table",
                    () => editor.chain().focus().deleteTable().run(),
                  ],
                ]
              : [
                  [
                    "2 × 2 table",
                    () =>
                      editor
                        .chain()
                        .focus()
                        .insertTable({ rows: 2, cols: 2, withHeaderRow: true })
                        .run(),
                  ],
                  [
                    "3 × 3 table",
                    () =>
                      editor
                        .chain()
                        .focus()
                        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                        .run(),
                  ],
                ]
            ).map(([label, action]) => (
              <button
                key={String(label)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  (action as () => void)();
                  setTableMenu(false);
                }}
              >
                {String(label)}
              </button>
            ))}
          </div>
        )}
        <Tool
          label="Insert image"
          icon={ImagePlus}
          onClick={() => fileInput.current?.click()}
        />
        <input
          ref={fileInput}
          className="report-hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="Upload report image"
          onChange={(event) => {
            void uploadImage(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      <div className="report-tool-group">
        <Tool
          label="Undo"
          icon={Undo2}
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <Tool
          label="Redo"
          icon={Redo2}
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </div>
    </div>
  );
}
