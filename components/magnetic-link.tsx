import { useRef, type ComponentProps } from "react";
import Link from "@/client/router";
export default function MagneticLink(props: ComponentProps<typeof Link>) {
  const element = useRef<HTMLSpanElement>(null);
  return (
    <span
      className="magnetic"
      ref={element}
      onPointerMove={(event) => {
        if (
          window.matchMedia(
            "(prefers-reduced-motion: reduce), (pointer: coarse)",
          ).matches
        )
          return;
        const rect = event.currentTarget.getBoundingClientRect();
        element.current?.style.setProperty(
          "--mx",
          `${(event.clientX - rect.left - rect.width / 2) * 0.08}px`,
        );
        element.current?.style.setProperty(
          "--my",
          `${(event.clientY - rect.top - rect.height / 2) * 0.12}px`,
        );
      }}
      onPointerLeave={() => {
        element.current?.style.setProperty("--mx", "0px");
        element.current?.style.setProperty("--my", "0px");
      }}
    >
      <Link {...props} />
    </span>
  );
}
