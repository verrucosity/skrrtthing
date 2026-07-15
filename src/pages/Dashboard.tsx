import { Page } from "../components/layout/Page";
import { GoalHero } from "../components/dashboard/GoalHero";
import { WeeklyCard } from "../components/dashboard/WeeklyCard";
import { ConnectionsCard } from "../components/dashboard/ConnectionsCard";
import { BreakdownCard } from "../components/dashboard/BreakdownCard";
import { RecentActivity } from "../components/dashboard/RecentActivity";

export function Dashboard() {
  return (
    <Page title="Dashboard" description="Community goal progress at a glance.">
      <div className="space-y-4">
        <GoalHero />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <WeeklyCard />
          <ConnectionsCard />
          <BreakdownCard />
        </div>
        <RecentActivity />
      </div>
    </Page>
  );
}
