"use client";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
export default function RichEditor({
  value,
  onChange,
  readOnly,
}: {
  value: JSONContent;
  onChange: (json: JSONContent, text: string) => void;
  readOnly: boolean;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    editable: !readOnly,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Full description",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON(), editor.getText()),
  });
  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(value))
      editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);
  if (!editor)
    return <div className="loading-skeleton" style={{ height: 180 }} />;
  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        {[
          ["Bold", () => editor.chain().focus().toggleBold().run(), "bold"],
          [
            "Italic",
            () => editor.chain().focus().toggleItalic().run(),
            "italic",
          ],
          [
            "Heading",
            () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            "heading",
          ],
          [
            "Bullets",
            () => editor.chain().focus().toggleBulletList().run(),
            "bulletList",
          ],
          [
            "Numbers",
            () => editor.chain().focus().toggleOrderedList().run(),
            "orderedList",
          ],
          [
            "Quote",
            () => editor.chain().focus().toggleBlockquote().run(),
            "blockquote",
          ],
        ].map(([name, run, mark]) => (
          <Button
            key={String(name)}
            size="sm"
            variant="secondary"
            type="button"
            disabled={readOnly}
            aria-pressed={editor.isActive(String(mark))}
            onClick={() => {
              if (typeof run === "function") run();
            }}
          >
            {String(name)}
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
