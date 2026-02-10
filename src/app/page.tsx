import FixtureList from "@/components/FixtureList";
import { Sparkles, Trophy } from "lucide-react";
import { getUpcomingMatches } from "@/lib/football-data";

export default async function Home() {
  const matches = await getUpcomingMatches();

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-4 pt-12 pb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
            <Sparkles size={16} />
            AI-Powered Predictions
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            Football Oracle
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Real-time fixtures meets neural analysis. Click any match to
            generate an AI tactical breakdown.
          </p>
        </header>

        {/* Custom Dashboard Content */}
        <div className="relative">
          <div className="absolute -top-24 -left-20 w-64 h-64 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -right-20 w-64 h-64 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

          <FixtureList matches={matches} />
        </div>

        {/* Footer info */}
        <footer className="pt-20 pb-12 text-center border-t border-white/5">
          <div className="flex justify-center gap-6 text-gray-600 text-xs font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Trophy size={14} /> Premier League
            </span>
            <span>•</span>
            <span>Champions League</span>
            <span>•</span>
            <span>La Liga</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
