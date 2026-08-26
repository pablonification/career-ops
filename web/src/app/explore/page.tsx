import fs from "node:fs";
import { ExplorerView } from "@/components/explore/explorer-view";
import { ScoredTable } from "@/components/explore/scored-table";
import { seedExploreFilters } from "@/lib/core/portals";
import { readInbox, readApplications, careerOpsRoot } from "@/lib/career-ops";
import { DEFAULT_FILTERS } from "@/lib/explore";

// Read live data at request time so a bare checkout (or `next build` with no
// CAREER_OPS_ROOT) never fails — discovery seeds are best-effort.
export const dynamic = "force-dynamic";

export default function ExplorePage() {
  // SAFETY: seededFrom is string[] per seedExploreFilters contract
  let seed = { filters: DEFAULT_FILTERS, seededFrom: [] as string[] };
  try {
    seed = seedExploreFilters();
  } catch {
    /* bare checkout → defaults */
  }
  let rootExists = false;
  try {
    rootExists = fs.existsSync(careerOpsRoot());
  } catch {
    /* ignore */
  }
  return (
    <div className="space-y-6">
      <ScoredTable />
      <ExplorerView seed={seed} inboxSnapshot={readInbox()} appsSnapshot={readApplications()} rootExists={rootExists} />
    </div>
  );
}
