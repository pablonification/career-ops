export type ScoreResult = {
  score: number;
  legitimacy: "High" | "Medium" | "Low";
  reasons: string[];
};

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) {
      count += 1;
    }
  }
  return count;
}

export function scoreJob(jobDescription: string, cvText: string): ScoreResult {
  const cvKeywords = cvText
    .split(/[\s,;]+/)
    .filter((w) => w.length > 3)
    .slice(0, 20);
  const jdLower = jobDescription.toLowerCase();
  const matches = countMatches(jdLower, cvKeywords);
  const base = Math.min(100, Math.round((matches / Math.max(1, cvKeywords.length)) * 100));
  const lengthBonus = jobDescription.length > 500 ? 10 : 0;
  const score = Math.min(100, base + lengthBonus);
  let legitimacy: ScoreResult["legitimacy"] = "Low";
  const reasons: string[] = [];
  if (jobDescription.length > 800 && jdLower.includes("responsibilities")) {
    legitimacy = "High";
    reasons.push("Detailed responsibilities and team context");
  } else if (jobDescription.length > 400) {
    legitimacy = "Medium";
    reasons.push("Moderate description length");
  } else {
    reasons.push("Short description, limited signals");
  }
  if (jdLower.includes("salary") || jdLower.includes("compensation")) {
    reasons.push("Compensation mentioned");
    if (legitimacy === "Low") {
      legitimacy = "Medium";
    }
  }
  return { score, legitimacy, reasons };
}

export function legitimacyTier(score: number, legitimacy: ScoreResult["legitimacy"]): string {
  if (score >= 80 && legitimacy === "High") {
    return "High Confidence";
  }
  if (score >= 50 || legitimacy === "Medium") {
    return "Proceed with Caution";
  }
  return "Low Confidence";
}
