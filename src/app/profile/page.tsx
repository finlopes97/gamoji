import { getUserProfile } from "@/app/actions/profile";
import { EditProfileButton } from "@/components/profile/EditProfileModal"; // <--- Import
import { User, Medal, Clock, Hash, TrendingUp } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { formatTime } from "@/lib/utils"; 

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short", day: "numeric"
  });
};

export default async function ProfilePage() {
  const { profile, stats, history } = await getUserProfile();
  
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-500">Profile data not found.</p>
      </div>
    );
  }

  if (!profile.created_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-500">Profile data not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* 1. HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
               {profile.avatar_url ? (
                 <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
               ) : (
                 <User className="w-8 h-8 text-indigo-600" />
               )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.username || "Player"}</h1>
                <EditProfileButton currentName={profile.username || ""} />
              </div>
              <p className="text-gray-500 text-sm">Joined {formatDate(profile.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LogoutButton /> 
            <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline">
              ← Back to Game
            </Link>
          </div>
        </div>

        {/* 2. STATS GRID (UPDATED) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<Hash className="w-5 h-5 text-blue-500" />}
            label="Games Played"
            value={stats.totalGames}
          />
          <StatCard 
            icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
            label="Avg Rank"
            value={stats.avgRank > 0 ? `#${stats.avgRank}` : '-'}
          />
          <StatCard 
            icon={<Clock className="w-5 h-5 text-green-500" />}
            label="Avg Time"
            value={formatTime(stats.avgTimeMs)}
          />
          <StatCard 
            icon={<Medal className="w-5 h-5 text-yellow-500" />}
            label="Best Rank"
            value={stats.bestRank > 0 ? `#${stats.bestRank}` : '-'}
          />
        </div>

        {/* 3. MATCH HISTORY */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b dark:border-gray-800">
            <h2 className="font-bold text-lg">Match History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Puzzle</th>
                  <th className="px-6 py-3">Rank</th>
                  <th className="px-6 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {history.map((play: any) => (
                  <tr key={play.play_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-500">
                      {play.puzzles?.game_date ? formatDate(play.puzzles.game_date) : '-'}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {play.puzzles?.solution_name || "Unknown Game"}
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-600">
                      #{play.rank}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-700 dark:text-gray-300">
                      {formatTime(play.final_score_ms)}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                      No games played yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Keep StatCard the same
function StatCard({ icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center gap-2">
      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full mb-1">
        {icon}
      </div>
      <div className="text-2xl font-bold font-mono tracking-tight">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}