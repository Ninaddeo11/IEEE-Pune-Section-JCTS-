import { useState } from "react";
export type UploadedAsset = {
  id: string;
  name: string;
  url: string;
  alt: string;
  mime: string;
};
export default function AssetUpload({
  onUpload,
}: {
  onUpload: (asset: UploadedAsset, purpose: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      className="form-grid"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const purpose = String(data.get("purpose"));
        data.delete("purpose");
        setBusy(true);
        setMessage("Uploading…");
        try {
          const r = await fetch("/api/media", { method: "POST", body: data });
          const asset = await r.json();
          if (!r.ok) throw new Error(asset.error);
          if (purpose === "video" && !asset.mime.startsWith("video/"))
            throw new Error(
              "Video uploaded as an asset; choose a video for the activity video field",
            );
          if (
            ["cover", "thumbnail"].includes(purpose) &&
            !asset.mime.startsWith("image/")
          )
            throw new Error(
              "Asset uploaded; choose an image for cover or thumbnail",
            );
          onUpload(asset, purpose);
          form.reset();
          setMessage(
            "Uploaded and attached to this activity. Save to retain the reference.",
          );
        } catch (err) {
          setMessage(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Attach as
        <select name="purpose">
          <option value="cover">Cover image</option>
          <option value="gallery">Gallery image/video</option>
          <option value="video">Activity video</option>
          <option value="thumbnail">Video thumbnail</option>
        </select>
      </label>
      <label>
        Asset
        <input
          name="file"
          type="file"
          accept="image/png,image/jpeg,image/webp,video/mp4"
          required
        />
      </label>
      <label>
        Alt text / description
        <input name="alt" required maxLength={500} />
      </label>
      <button className="button small" disabled={busy}>
        Upload and attach
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
