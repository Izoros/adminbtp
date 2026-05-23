import { getDocumentPreviewData } from "@/modules/documents/services/document-data";
import { DocumentPreview } from "@/modules/documents/components/document-preview";

export default async function DocumentsPage() {
  const previewData = await getDocumentPreviewData();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <DocumentPreview previewData={previewData} />
      </div>
    </main>
  );
}
