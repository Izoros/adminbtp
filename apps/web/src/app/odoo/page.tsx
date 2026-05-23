import { OdooMappingBoard } from "@/modules/settings/components/odoo-mapping-board";

export default function OdooPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <OdooMappingBoard />
      </div>
    </main>
  );
}
