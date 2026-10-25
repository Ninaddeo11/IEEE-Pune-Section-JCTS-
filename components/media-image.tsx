export default function MediaImage({
  src,
  alt,
  sizes = "(max-width: 760px) 100vw, 33vw",
}: {
  src: string;
  alt: string;
  sizes?: string;
}) {
  return (
    <div className="media-image">
      <img src={src} alt={alt} sizes={sizes} loading="lazy" decoding="async" />
    </div>
  );
}
