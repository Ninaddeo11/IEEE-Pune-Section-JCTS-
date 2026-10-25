import { ImageResponse } from "next/og";
export const alt = "IEEE JCTS Pune — Technology. Research. Impact.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#f5f9fc",
        color: "#142535",
        padding: 70,
        flexDirection: "column",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 22,
          letterSpacing: 3,
          color: "#006bac",
        }}
      >
        IEEE JCTS · PUNE SECTION
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 86,
          lineHeight: 1.05,
          letterSpacing: -5,
          marginTop: 55,
        }}
      >
        <span>Technology.</span>
        <span>Research.</span>
        <span style={{ color: "#006bac" }}>Impact.</span>
      </div>
      <div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          border: "1px solid #a6c9df",
          borderRadius: "50%",
          right: 80,
          top: 105,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle,#d2e9f5,transparent)",
        }}
      >
        <div
          style={{
            width: 280,
            height: 280,
            border: "1px solid #7baccc",
            borderRadius: 60,
            transform: "rotate(35deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 160,
              height: 160,
              border: "1px solid #4f8daf",
              transform: "rotate(25deg)",
              background: "#d9e9f3",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#006bac",
            top: 30,
            left: 94,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 15,
          color: "#657b8e",
          marginTop: "auto",
        }}
      >
        CONNECTED SYSTEMS. SHARED POSSIBILITIES.
      </div>
    </div>,
    size,
  );
}
