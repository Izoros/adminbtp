import { getMailboxBoardData } from "@/modules/emails/services/supabase-email-data";
import { MailboxBoard } from "@/modules/emails/components/mailbox-board";
import { updateEmailClassificationAction } from "@/modules/emails/services/email-actions";

type EmailsPageProps = {
  searchParams?: Promise<{
    organizationId?: string;
    mailboxAddress?: string;
    mailboxId?: string;
  }>;
};

export default async function EmailsPage({ searchParams }: EmailsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const mailboxBoardData = await getMailboxBoardData({
    organizationId: resolvedSearchParams?.organizationId,
    mailboxAddress: resolvedSearchParams?.mailboxAddress,
    mailboxId: resolvedSearchParams?.mailboxId,
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <MailboxBoard
          initialData={mailboxBoardData}
          updateAction={updateEmailClassificationAction}
        />
      </div>
    </main>
  );
}
