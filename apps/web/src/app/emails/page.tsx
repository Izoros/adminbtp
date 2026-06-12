import { ModulePageFrame } from "@/components/layout/module-page-frame";
import { getMailboxBoardData } from "@/modules/emails/services/supabase-email-data";
import { MailboxBoard } from "@/modules/emails/components/mailbox-board";
import { updateEmailClassificationAction } from "@/modules/emails/services/email-actions";
import { createMailboxAction } from "@/modules/emails/services/mailbox-actions";

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
    <ModulePageFrame>
      <MailboxBoard
        initialData={mailboxBoardData}
        updateAction={updateEmailClassificationAction}
        createMailboxAction={createMailboxAction}
      />
    </ModulePageFrame>
  );
}
