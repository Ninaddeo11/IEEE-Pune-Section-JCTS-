import { useView } from "@/client/view";
import HomeModule from "@/components/home-module";
import NetworkStory from "@/components/network-story";
import Footer from "@/components/footer";
export default function Home() {
  const { modules, all, isPreview } = useView();
  return (
    <>
      {isPreview && (
        <div className="preview-banner">ADMIN PREVIEW | Private snapshot</div>
      )}
      <main id="main">
        {modules.map((m) => (
          <div className="home-module" key={m.id}>
            <HomeModule module={m} all={all} />
            {(m.data.kind === "hero" || m.slug === "hero") && (
              <div id="connected">
                <NetworkStory />
              </div>
            )}
          </div>
        ))}
      </main>
      <Footer />
    </>
  );
}
