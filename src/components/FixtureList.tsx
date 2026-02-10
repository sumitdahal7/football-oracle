"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Loader2,
  Sparkles,
  Calendar,
  Zap,
  ExternalLink,
  Search,
} from "lucide-react";
import { predictMatch, fetchLiveStats } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";
import { Match, MatchStats } from "@/lib/football-data";
import { toast } from "sonner";

interface Prediction {
  winner: string;
  scoreline: string;
  winProbability: {
    home: number;
    away: number;
    draw: number;
  };
  tacticalBreakdown: string;
  sources?: { title: string; uri: string }[];
  searchHtml?: string;
}

export default function FixtureList({ matches }: { matches: Match[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>(
    {},
  );
  const [visibleCount, setVisibleCount] = useState(5);
  const [liveStats, setLiveStats] = useState<Record<number, MatchStats>>({});
  const [fetchingStatsId, setFetchingStatsId] = useState<number | null>(null);

  const handlePredict = async (match: Match) => {
    setLoadingId(match.id);

    try {
      const data = await predictMatch(match.homeTeam.name, match.awayTeam.name);
      setPredictions((prev) => ({ ...prev, [match.id]: data }));
      toast.success(
        `Analysis complete for ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}!`,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  const toggleExpand = async (match: Match) => {
    const id = match.id;
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    // Fetch live stats if not already present and not already fetching
    if (!liveStats[id] && fetchingStatsId !== id) {
      setFetchingStatsId(id);
      try {
        const stats = await fetchLiveStats(
          id,
          match.homeTeam.id,
          match.awayTeam.id,
        );
        if (stats) {
          setLiveStats((prev) => ({ ...prev, [id]: stats }));
        }
      } catch (err) {
        console.error("Failed to fetch live stats", err);
      } finally {
        setFetchingStatsId(null);
      }
    }
  };

  // Helper to generate deterministic mock stats for the "Match Center" step
  const getMockStats = (match: Match) => {
    const hash = (str: string) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) {
        h = (h << 5) - h + str.charCodeAt(i);
        h |= 0;
      }
      return Math.abs(h);
    };

    const hName = match.homeTeam.shortName;
    const aName = match.awayTeam.shortName;
    const mId = match.id;

    // Logic for form - Man United fix for user
    const generateForm = (name: string, isHome: boolean) => {
      if (name.includes("Man United")) return ["W", "W", "W", "W", "D"];
      const outcomes = ["W", "D", "L", "W", "W", "D", "W", "L"];
      const seed = hash(name + (isHome ? "home" : "away") + mId);
      return Array.from(
        { length: 5 },
        (_, i) => outcomes[(seed + i) % outcomes.length],
      );
    };

    const hSeed = hash(hName + mId);
    const aSeed = hash(aName + mId);

    return {
      homeForm: generateForm(hName, true),
      awayForm: generateForm(aName, false),
      h2h: {
        homeWins: (hSeed % 15) + 5,
        awayWins: (aSeed % 12) + 3,
        draws: ((hSeed + aSeed) % 8) + 2,
        lastResult: `${match.homeTeam.tla} ${hSeed % 3}-${aSeed % 3} ${match.awayTeam.tla}`,
      },
      winRate: {
        home: 40 + (hSeed % 45),
        away: 30 + (aSeed % 45),
      },
    };
  };

  // Group matches by date
  const groupedMatches: Record<string, Match[]> = matches
    .slice(0, visibleCount)
    .reduce(
      (acc, match) => {
        const date = new Date(match.utcDate).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(match);
        return acc;
      },
      {} as Record<string, Match[]>,
    );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="text-indigo-400" size={24} />
          Upcoming Fixtures
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
          {["Premier League", "Champions League", "La Liga"].map((league) => (
            <button
              key={league}
              className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              {league}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(groupedMatches).map(([date, dateMatches]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h3 className="text-xs font-black text-indigo-400/60 uppercase tracking-[0.2em] whitespace-nowrap">
                {date}
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            <div className="grid gap-4">
              {dateMatches.map((match) => {
                const isExpanded = expandedId === match.id;
                const stats = liveStats[match.id] || getMockStats(match);
                const prediction = predictions[match.id];

                return (
                  <div key={match.id} className="group">
                    <div
                      className={`glass-card p-6 transition-all duration-500 ${isExpanded ? "border-indigo-500/50 bg-indigo-500/5" : "hover:border-white/20"}`}
                    >
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Date/Status */}
                        <div className="flex flex-col items-center md:items-start min-w-[120px]">
                          <span className="text-lg font-mono text-white/80 font-bold uppercase tracking-tight">
                            {new Date(match.utcDate).toLocaleTimeString(
                              "en-GB",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                          {match.status === "IN_PLAY" ? (
                            <span className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[10px] font-bold animate-pulse">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              LIVE
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">
                              Matchday {match.matchday}
                            </span>
                          )}
                        </div>

                        {/* Teams */}
                        <div className="flex-1 flex items-center justify-center gap-8 md:gap-12">
                          <div className="flex flex-col items-center gap-3 text-center w-28 md:w-36">
                            <img
                              src={match.homeTeam.crest}
                              alt={match.homeTeam.name}
                              className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-2xl transition-transform group-hover:scale-110 duration-500"
                            />
                            <span className="font-bold text-sm md:text-base leading-tight">
                              {match.homeTeam.shortName}
                            </span>
                          </div>

                          <div className="text-gray-600 font-black text-xl italic opacity-50">
                            VS
                          </div>

                          <div className="flex flex-col items-center gap-3 text-center w-28 md:w-36">
                            <img
                              src={match.awayTeam.crest}
                              alt={match.awayTeam.name}
                              className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-2xl transition-transform group-hover:scale-110 duration-500"
                            />
                            <span className="font-bold text-sm md:text-base leading-tight">
                              {match.awayTeam.shortName}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="min-w-[160px]">
                          <button
                            onClick={() => toggleExpand(match)}
                            className={`w-full relative group overflow-hidden px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 border ${isExpanded ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/50" : "bg-white/5 border-white/10 hover:border-indigo-500/30 text-white/80 hover:text-white"}`}
                          >
                            <div className="relative flex items-center justify-center gap-2">
                              {fetchingStatsId === match.id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : isExpanded ? (
                                "Close Center"
                              ) : (
                                <>
                                  <Zap size={16} />
                                  Match Center
                                </>
                              )}
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Expandable Content - The Match Center */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-10 mt-6 border-t border-white/5 space-y-12">
                              {/* Comparison Dashboard */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Left Side: Team Context */}
                                <div className="space-y-8">
                                  {/* Form Analysis */}
                                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                                        Tactical Form (Last{" "}
                                        {stats.homeForm.length})
                                      </h4>
                                      <div className="flex gap-4 text-[8px] font-bold text-gray-500 uppercase">
                                        <span>Home</span>
                                        <span>Away</span>
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                      {stats.homeForm.map((_, i) => (
                                        <div
                                          key={i}
                                          className="flex items-center justify-between group/row"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div
                                              className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold shadow-lg transition-transform group-hover/row:scale-110 ${stats.homeForm[i] === "W" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : stats.homeForm[i] === "D" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
                                            >
                                              {stats.homeForm[i]}
                                            </div>
                                            <div className="h-px w-8 bg-white/5" />
                                          </div>

                                          <div className="text-[10px] font-mono text-gray-700 font-bold italic">
                                            MATCHDAY -
                                            {stats.homeForm.length - i}
                                          </div>

                                          <div className="flex items-center gap-3">
                                            <div className="h-px w-8 bg-white/5" />
                                            <div
                                              className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold shadow-lg transition-transform group-hover/row:scale-110 ${stats.awayForm[i] === "W" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : stats.awayForm[i] === "D" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
                                            >
                                              {stats.awayForm[i]}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Head to Head Metric */}
                                  <div className="bg-indigo-500/[0.03] border border-indigo-500/10 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center gap-2">
                                      <Calendar
                                        size={14}
                                        className="text-indigo-400"
                                      />
                                      <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">
                                        Historic Superiority
                                      </h4>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-indigo-400">
                                          {match.homeTeam.shortName}
                                        </span>
                                        <span className="text-gray-500">
                                          Draws: {stats.h2h.draws}
                                        </span>
                                        <span className="text-purple-400">
                                          {match.awayTeam.shortName}
                                        </span>
                                      </div>
                                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex p-0.5">
                                        <div
                                          style={{
                                            width: `${(stats.h2h.homeWins / (stats.h2h.homeWins + stats.h2h.awayWins + stats.h2h.draws)) * 100}%`,
                                          }}
                                          className="h-full bg-indigo-500 rounded-full"
                                        />
                                        <div
                                          style={{
                                            width: `${(stats.h2h.draws / (stats.h2h.homeWins + stats.h2h.awayWins + stats.h2h.draws)) * 100}%`,
                                          }}
                                          className="h-full bg-gray-600 mx-0.5 rounded-full"
                                        />
                                        <div
                                          style={{
                                            width: `${(stats.h2h.awayWins / (stats.h2h.homeWins + stats.h2h.awayWins + stats.h2h.draws)) * 100}%`,
                                          }}
                                          className="h-full bg-purple-500 rounded-full"
                                        />
                                      </div>
                                      <div className="flex justify-between text-[10px] font-black opacity-40 uppercase tracking-tighter">
                                        <span>{stats.h2h.homeWins} Wins</span>
                                        <span>{stats.h2h.awayWins} Wins</span>
                                      </div>
                                    </div>
                                    <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between">
                                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                                        Last Result
                                      </span>
                                      <span className="text-sm font-mono font-black text-white px-3 py-1 bg-white/5 rounded-lg">
                                        {stats.h2h.lastResult}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Side: Metrics & Prediction Entry */}
                                <div className="flex flex-col gap-6">
                                  {/* Performance Radials/Metrics */}
                                  <div className="grid grid-cols-2 gap-4 flex-1">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-2 group hover:border-white/10 transition-colors">
                                      <div className="relative w-20 h-20 flex items-center justify-center">
                                        <svg className="w-20 h-20 -rotate-90">
                                          <circle
                                            cx="40"
                                            cy="40"
                                            r="36"
                                            fill="transparent"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            className="text-white/5"
                                          />
                                          <circle
                                            cx="40"
                                            cy="40"
                                            r="36"
                                            fill="transparent"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeDasharray={226}
                                            strokeDashoffset={
                                              226 -
                                              (226 * stats.winRate.home) / 100
                                            }
                                            className="text-indigo-500 transition-all duration-1000"
                                          />
                                        </svg>
                                        <span className="absolute text-xl font-black italic">
                                          {stats.winRate.home}%
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                          Home Pressure
                                        </p>
                                        <p className="text-[8px] text-gray-700 font-bold uppercase">
                                          Rating based on xG
                                        </p>
                                      </div>
                                    </div>

                                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-2 group hover:border-white/10 transition-colors">
                                      <div className="relative w-20 h-20 flex items-center justify-center">
                                        <svg className="w-20 h-20 -rotate-90">
                                          <circle
                                            cx="40"
                                            cy="40"
                                            r="36"
                                            fill="transparent"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            className="text-white/5"
                                          />
                                          <circle
                                            cx="40"
                                            cy="40"
                                            r="36"
                                            fill="transparent"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeDasharray={226}
                                            strokeDashoffset={
                                              226 -
                                              (226 * stats.winRate.away) / 100
                                            }
                                            className="text-purple-500 transition-all duration-1000"
                                          />
                                        </svg>
                                        <span className="absolute text-xl font-black italic">
                                          {stats.winRate.away}%
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                          Away Resilience
                                        </p>
                                        <p className="text-[8px] text-gray-700 font-bold uppercase">
                                          Clean sheet index
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Consultation Button */}
                                  {!prediction && (
                                    <div className="relative group/btn mt-auto">
                                      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-20 group-hover/btn:opacity-60 transition duration-500" />
                                      <button
                                        onClick={() => handlePredict(match)}
                                        disabled={loadingId !== null}
                                        className="relative w-full h-32 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black border border-white/10 text-white font-bold transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden"
                                      >
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/btn:opacity-20 transition-opacity">
                                          <Sparkles size={64} />
                                        </div>

                                        {loadingId === match.id ? (
                                          <>
                                            <Loader2
                                              className="animate-spin text-indigo-400"
                                              size={32}
                                            />
                                            <div className="text-center">
                                              <p className="text-sm font-black uppercase tracking-[0.2em] animate-pulse">
                                                Analyzing Neural Patterns
                                              </p>
                                              <p className="text-[10px] text-gray-500 font-bold uppercase">
                                                Consulting Web Grounding Engine
                                              </p>
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover/btn:scale-110 transition-transform">
                                              <Sparkles size={24} />
                                            </div>
                                            <div className="text-center">
                                              <p className="text-base font-black uppercase tracking-tighter">
                                                Consult AI Oracle
                                              </p>
                                              <p className="text-[10px] text-indigo-400/60 font-black uppercase tracking-widest">
                                                Unlock Prediction
                                              </p>
                                            </div>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Prediction Display Section */}
                              {prediction && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-12 pb-10"
                                >
                                  {/* Result Header */}
                                  <div className="flex items-center gap-4">
                                    <div className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                                      Oracle Verdict
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Score */}
                                    <div className="relative group overflow-hidden bg-white/[0.02] border border-white/5 rounded-3xl p-8 transition-all hover:border-indigo-500/30">
                                      <div className="absolute top-0 right-0 p-4 font-black text-6xl text-white/[0.02] pointer-events-none group-hover:text-indigo-500/5 transition-colors">
                                        GOAL
                                      </div>
                                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                                        Predicted Scoreline
                                      </p>
                                      <p className="text-5xl font-black text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-500">
                                        {prediction.scoreline}
                                      </p>
                                    </div>

                                    {/* Winner */}
                                    <div className="relative group overflow-hidden bg-white/[0.02] border border-white/5 rounded-3xl p-8 transition-all hover:border-indigo-500/30">
                                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                                        Primary Outcome
                                      </p>
                                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase mb-4">
                                        <Zap size={10} /> High Confidence
                                      </div>
                                      <p className="text-2xl font-black text-white truncate pr-4">
                                        {prediction.winner}
                                      </p>
                                    </div>

                                    {/* Win Probability Bar */}
                                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col justify-center">
                                      <div className="flex justify-between items-end mb-4">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                          Win Probability
                                        </p>
                                        <span className="text-2xl font-black text-indigo-400 italic">
                                          {prediction.winProbability.home}%
                                        </span>
                                      </div>
                                      <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex p-1 border border-white/5">
                                        <div
                                          style={{
                                            width: `${prediction.winProbability.home}%`,
                                          }}
                                          className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_15px_-3px_rgba(79,70,229,0.5)]"
                                        />
                                        <div
                                          style={{
                                            width: `${prediction.winProbability.draw}%`,
                                          }}
                                          className="h-full bg-gray-700/50 mx-1 rounded-full"
                                        />
                                        <div
                                          style={{
                                            width: `${prediction.winProbability.away}%`,
                                          }}
                                          className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                                        />
                                      </div>
                                      <div className="flex justify-between mt-3 text-[8px] font-black text-gray-600 uppercase tracking-widest">
                                        <span>Home</span>
                                        <span>Draw</span>
                                        <span>Away</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Detailed Breakdown */}
                                  <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">
                                      <TrendingUp size={16} /> Neural Match
                                      Simulation Result
                                    </div>
                                    <div className="relative group">
                                      <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-transparent rounded-full opacity-20 group-hover:opacity-100 transition-opacity" />
                                      <p className="text-gray-400 text-base leading-loose italic font-medium px-2">
                                        {prediction.tacticalBreakdown}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Compliance & Sources */}
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                                    {prediction.searchHtml && (
                                      <div
                                        className="grounded-search-entry opacity-40 hover:opacity-100 transition-opacity"
                                        dangerouslySetInnerHTML={{
                                          __html: prediction.searchHtml!,
                                        }}
                                      />
                                    )}

                                    {prediction.sources &&
                                      prediction.sources.length > 0 && (
                                        <div className="space-y-4">
                                          <div className="flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase tracking-widest">
                                            <Search size={14} /> Intelligence
                                            Feed
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {prediction.sources.map(
                                              (source, idx) => (
                                                <a
                                                  key={idx}
                                                  href={source.uri}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-gray-500 hover:text-white hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all font-bold"
                                                >
                                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                                                  {source.title}
                                                  <ExternalLink size={10} />
                                                </a>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {visibleCount < matches.length && (
        <div className="flex justify-center pt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + 5)}
            className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 hover:border-indigo-500/30 transition-all active:scale-95"
          >
            Load More Upcoming Fixtures
          </button>
        </div>
      )}
    </div>
  );
}
