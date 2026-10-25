import Link from "@/client/router";

export default function Brand() {
  return (
    <Link href="/" className="brand" aria-label="JCTS home">
      <img
        className="brand-logo"
        src="/jcts-logo.png"
        alt="Joint Chapter IEEE TEMS and Systems Council, Pune Section"
        width={265}
        height={114}
      />
    </Link>
  );
}
