import useDashboardData from '../hooks/useDashboardData';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import WelcomeBand from '../components/dashboard/WelcomeBand';
import CategoryPhases from '../components/dashboard/CategoryPhases';
import StatStrip from '../components/dashboard/StatStrip';
import ScoreTrend from '../components/dashboard/ScoreTrend';
import ReadinessRing from '../components/dashboard/ReadinessRing';
import SkillPerformance from '../components/dashboard/SkillPerformance';
import RecommendedTopics from '../components/dashboard/RecommendedTopics';
import RecentInterviews from '../components/dashboard/RecentInterviews';

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-56" />
      <Skeleton className="h-28" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, reload } = useDashboardData();

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <WelcomeBand user={data.user} skills={data.skills} />
      <CategoryPhases />
      <StatStrip stats={data.stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <ScoreTrend history={data.scoreHistory} className="lg:col-span-2" />
        <ReadinessRing score={data.readiness.score} basedOn={data.readiness.basedOn} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SkillPerformance skills={data.skills} />
        <RecommendedTopics topics={data.topics} />
      </div>

      <RecentInterviews interviews={data.recentInterviews} />
    </div>
  );
}
