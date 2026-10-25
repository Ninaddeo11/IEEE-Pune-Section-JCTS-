import { Fragment, type ReactNode } from "react";
type Node = {
  type?: string;
  text?: string;
  content?: Node[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
};
export default function RichText({ document }: { document: unknown }) {
  function render(node: Node, key: number): ReactNode {
    const children = node.content?.map(render);
    if (node.type === "text") {
      let text: ReactNode = node.text ?? "";
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold") text = <strong>{text}</strong>;
        if (mark.type === "italic") text = <em>{text}</em>;
        if (mark.type === "strike") text = <s>{text}</s>;
        if (mark.type === "code") text = <code>{text}</code>;
        if (mark.type === "link") {
          const url = String(mark.attrs?.href ?? "");
          if (/^https:\/\//.test(url) || /^\/(?!\/)/.test(url))
            text = (
              <a href={url} rel="noopener noreferrer" className="text-link">
                {text}
              </a>
            );
        }
      }
      return <Fragment key={key}>{text}</Fragment>;
    }
    switch (node.type) {
      case "doc":
        return <Fragment key={key}>{children}</Fragment>;
      case "paragraph":
        return <p key={key}>{children}</p>;
      case "heading":
        return Number(node.attrs?.level) === 3 ? (
          <h3 key={key}>{children}</h3>
        ) : (
          <h2 key={key}>{children}</h2>
        );
      case "bulletList":
        return <ul key={key}>{children}</ul>;
      case "orderedList":
        return <ol key={key}>{children}</ol>;
      case "listItem":
        return <li key={key}>{children}</li>;
      case "blockquote":
        return <blockquote key={key}>{children}</blockquote>;
      case "codeBlock":
        return (
          <pre key={key}>
            <code>{children}</code>
          </pre>
        );
      case "hardBreak":
        return <br key={key} />;
      case "horizontalRule":
        return <hr key={key} />;
      default:
        return null;
    }
  }
  return (
    <div className="rich-text">
      {document && typeof document === "object"
        ? render(document as Node, 0)
        : null}
    </div>
  );
}
