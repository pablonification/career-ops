export type GmailClassification = "interview" | "rejection" | "other";

export function classifyGmailSubject(subject: string): GmailClassification {
  const lower = subject.toLowerCase();
  if (lower.includes("interview") || lower.includes("invite") || lower.includes("screening")) {
    return "interview";
  }
  if (lower.includes("rejection") || lower.includes("unfortunately") || lower.includes("not moving forward")) {
    return "rejection";
  }
  return "other";
}

export type GmailMatch = {
  applicationId: string;
  company: string;
};

export function matchGmailToApplication(
  fromDomain: string,
  applications: GmailMatch[],
): GmailMatch | null {
  const domainLower = fromDomain.toLowerCase();
  for (const app of applications) {
    const companyLower = app.company.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (companyLower.length > 2 && domainLower.includes(companyLower)) {
      return app;
    }
  }
  return null;
}
