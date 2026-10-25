import { useView } from "@/client/view";
import HomeModule from "@/components/home-module";
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
          <HomeModule key={m.id} module={m} all={all} />
        ))}
      </main>
      <Footer />
    </>
  );
}
