import { IconStar, IconShieldCheck, IconAlertTriangle } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  score: number;
  legitimacy: "High" | "Medium" | "Low";
  tier: string;
};

export function ScoreBadge({ score, legitimacy, tier }: Props) {
  const tone = score >= 80 ? "good" : score >= 50 ? "warn" : "bad";
  const Icon = legitimacy === "High" ? IconShieldCheck : legitimacy === "Medium" ? IconStar : IconAlertTriangle;
  return (
    <div className="flex items-center gap-2">
      <Badge tone={tone}>{score}/100</Badge>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {tier}
      </span>
    </div>
  );
}
