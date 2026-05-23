import { demoEmails } from "@/modules/emails/services/demo-emails";
import {
  isEmailLinkedToBusinessContext,
  reclassifyEmail,
} from "@/modules/emails/services/email-classification";

describe("classification et rattachement email", () => {
  it("reclasse un email sans perdre ses rattachements metier", () => {
    const reclassifiedEmail = reclassifyEmail(demoEmails[0]!, "validation");

    expect(reclassifiedEmail.classification).toBe("validation");
    expect(reclassifiedEmail.organizationId).toBe("org_adminbtp_001");
    expect(reclassifiedEmail.projectId).toBe("project_001");
    expect(reclassifiedEmail.relatedTaskId).toBe("task_relance_docs_001");
  });

  it("verifie qu'un email peut etre relie a organisation, chantier et tache", () => {
    expect(isEmailLinkedToBusinessContext(demoEmails[0]!)).toBe(true);
    expect(isEmailLinkedToBusinessContext(demoEmails[1]!)).toBe(false);
  });
});
