import { ModulePageFrame } from "@/components/layout/module-page-frame";
import { getDocumentPreviewData } from "@/modules/documents/services/document-data";
import { DocumentPreview } from "@/modules/documents/components/document-preview";

export default async function DocumentsPage() {
  const previewData = await getDocumentPreviewData();

  return (
    <ModulePageFrame>
      <DocumentPreview previewData={previewData} />
    </ModulePageFrame>
  );
}
