import { ModulePageFrame } from "@/components/layout/module-page-frame";
import { getSignatureWorkflowData } from "@/modules/signatures/services/signature-data";
import { SignatureWorkflow } from "@/modules/signatures/components/signature-workflow";

export default async function SignaturesPage() {
  const workflowData = await getSignatureWorkflowData();

  return (
    <ModulePageFrame>
      <SignatureWorkflow workflowData={workflowData} />
    </ModulePageFrame>
  );
}
