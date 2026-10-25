export default function Loading() {
  return (
    <main id="main" className="page-width section">
      <div
        className="loading-skeleton"
        style={{ height: 80, width: "60%", marginBottom: 40 }}
      />
      <div className="cards-grid">
        {[1, 2, 3].map((i) => (
          <div className="loading-skeleton" key={i} />
        ))}
      </div>
    </main>
  );
}
