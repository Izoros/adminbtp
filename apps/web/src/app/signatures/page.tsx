import { getSignatureWorkflowData } from "@/modules/signatures/services/signature-data";
import { SignatureWorkflow } from "@/modules/signatures/components/signature-workflow";

export default async function SignaturesPage() {
  const workflowData = await getSignatureWorkflowData();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <SignatureWorkflow workflowData={workflowData} />
      </div>
    </main>
  );
}
