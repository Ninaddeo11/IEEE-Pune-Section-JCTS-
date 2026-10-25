import Link from "@/client/router";
import { useView } from "@/client/view";
import ActivityResults from "@/components/activity-results";
import Footer from "@/components/footer";
export default function Activities() {
  const { cmsPage, section } = useView();
  const upcoming = section === "upcoming";
  return (
    <>
      <main id="main" className="page-width">
        <div className="page-hero">
          <p className="eyebrow">IEEE JCTS · PUNE SECTION</p>
          <h1>
            {upcoming ? "Upcoming activities" : cmsPage?.title || "Activities"}
          </h1>
          <p>{cmsPage?.summary}</p>
          <Link
            className="text-link"
            href={upcoming ? "/activities" : "/upcoming"}
          >
            {upcoming ? "All activities" : "Upcoming activities"} →
          </Link>
        </div>
        <section className="listing-section">
          <ActivityResults />
        </section>
      </main>
      <Footer />
    </>
  );
}
