"use client";

import React, { useState } from "react";
import {
  Search,
  Trophy,
  TrendingUp,
  Activity,
  Loader2,
  Sparkles,
} from "lucide-react";
import { predictMatch } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";

interface Prediction {
  winner: string;
  scoreline: string;
  winProbability: {
    home: number;
    away: number;
    draw: number;
  };
  tacticalBreakdown: string;
}

export default function FootballOracle() {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState("");

  const handleSimulate = async () => {
    if (!homeTeam || !awayTeam) {
      setError("Please enter both team names");
      return;
    }
    setError("");
    setLoading(true);
    setPrediction(null);

    try {
      const data = await predictMatch(homeTeam, awayTeam);
      setPrediction(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. check your API key.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-4 pt-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium"
          >
            <Sparkles size={16} />
            AI-Powered Predictions
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500"
          >
            Football Oracle
          </motion.h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Experience the future of match analysis. Our neural engine analyzes
            thousands of datapoints to predict the beautiful game.
          </p>
        </header>

        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">
              Home Team
            </label>
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Enter Home Team..."
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">
              Away Team
            </label>
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Enter Away Team..."
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-lg"
              />
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mt-4">
            <span className="text-xs font-bold text-gray-500">VS</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="relative group overflow-hidden px-8 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:opacity-90 transition-opacity" />
            <div className="relative flex items-center gap-3">
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing Match...
                </>
              ) : (
                <>
                  <Activity size={20} />
                  Simulate Match
                </>
              )}
            </div>
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-center bg-red-400/10 border border-red-400/20 py-3 rounded-xl">
            {error}
          </p>
        )}

        {/* Results */}
        <AnimatePresence>
          {prediction && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Match Card */}
              <div className="glass-card p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Trophy size={120} />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold">{homeTeam}</h3>
                    <p className="text-6xl font-black text-indigo-500">
                      {prediction.scoreline.split("-")[0]}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="px-4 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold tracking-widest text-gray-400">
                      FINAL SCORE PREDICTION
                    </div>
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>

                  <div className="space-y-2 text-center md:text-right">
                    <h3 className="text-3xl font-bold">{awayTeam}</h3>
                    <p className="text-6xl font-black text-purple-500">
                      {prediction.scoreline.split("-")[1]}
                    </p>
                  </div>
                </div>

                <div className="mt-12 text-center py-6 border-y border-white/5">
                  <p className="text-gray-400 uppercase tracking-widest text-sm mb-1 font-medium">
                    Predicted Winner
                  </p>
                  <h4 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                    {prediction.winner}
                  </h4>
                </div>

                {/* Probabilities */}
                <div className="mt-12 space-y-6">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Win Probabilities
                    </span>
                  </div>
                  <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${prediction.winProbability.home}%` }}
                      className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                    />
                    <div
                      style={{ width: `${prediction.winProbability.draw}%` }}
                      className="h-full bg-gray-600 transition-all duration-1000 ease-out"
                    />
                    <div
                      style={{ width: `${prediction.winProbability.away}%` }}
                      className="h-full bg-purple-500 transition-all duration-1000 ease-out"
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>
                        {homeTeam}: {prediction.winProbability.home}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-600" />
                      <span>Draw: {prediction.winProbability.draw}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>
                        {awayTeam}: {prediction.winProbability.away}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tactical Breakdown */}
              <div className="glass-card p-8 space-y-4">
                <div className="flex items-center gap-3 text-indigo-400">
                  <TrendingUp size={24} />
                  <h3 className="text-xl font-bold">Tactical Analysis</h3>
                </div>
                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-lg italic">
                  &quot;{prediction.tacticalBreakdown}&quot;
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
