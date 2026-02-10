export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  homeTeam: Team;
  awayTeam: Team;
  score?: {
    fullTime: { home: number | null; away: number | null };
  };
}

export interface MatchStats {
  homeForm: string[];
  awayForm: string[];
  h2h: {
    homeWins: number;
    awayWins: number;
    draws: number;
    lastResult: string;
  };
  winRate: {
    home: number;
    away: number;
  };
}

export const MOCK_MATCHES: Match[] = [
  {
    id: 1,
    utcDate: new Date(Date.now() + 86400000).toISOString(),
    status: "TIMED",
    matchday: 24,
    homeTeam: {
      id: 64,
      name: "Liverpool FC",
      shortName: "Liverpool",
      tla: "LIV",
      crest: "https://crests.football-data.org/64.png",
    },
    awayTeam: {
      id: 65,
      name: "Manchester City FC",
      shortName: "Man City",
      tla: "MCI",
      crest: "https://crests.football-data.org/65.png",
    },
  },
  {
    id: 2,
    utcDate: new Date(Date.now() + 172800000).toISOString(),
    status: "TIMED",
    matchday: 24,
    homeTeam: {
      id: 57,
      name: "Arsenal FC",
      shortName: "Arsenal",
      tla: "ARS",
      crest: "https://crests.football-data.org/57.png",
    },
    awayTeam: {
      id: 73,
      name: "Tottenham Hotspur FC",
      shortName: "Tottenham",
      tla: "TOT",
      crest: "https://crests.football-data.org/73.svg",
    },
  },
  {
    id: 3,
    utcDate: new Date().toISOString(),
    status: "IN_PLAY",
    matchday: 25,
    homeTeam: {
      id: 66,
      name: "Manchester United FC",
      shortName: "Man United",
      tla: "MUN",
      crest: "https://crests.football-data.org/66.png",
    },
    awayTeam: {
      id: 61,
      name: "Chelsea FC",
      shortName: "Chelsea",
      tla: "CHE",
      crest: "https://crests.football-data.org/61.png",
    },
  },
  {
    id: 4,
    utcDate: new Date(Date.now() + 259200000).toISOString(),
    status: "TIMED",
    matchday: 25,
    homeTeam: {
      id: 76,
      name: "Real Madrid CF",
      shortName: "Real Madrid",
      tla: "RMA",
      crest: "https://crests.football-data.org/86.png",
    },
    awayTeam: {
      id: 81,
      name: "FC Barcelona",
      shortName: "Barcelona",
      tla: "BAR",
      crest: "https://crests.football-data.org/81.svg",
    },
  },
];

export async function getUpcomingMatches(): Promise<Match[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    console.log("No Football-Data.org API key found, using mock data.");
    return MOCK_MATCHES;
  }

  try {
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED",
      {
        headers: { "X-Auth-Token": apiKey },
        next: { revalidate: 3600 },
      },
    );

    if (res.status === 429) {
      console.error("Football-Data.org Rate Limit Exceeded. Using mock data.");
      return MOCK_MATCHES;
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(`Football-Data API Error (${res.status}):`, errorData);
      return MOCK_MATCHES;
    }

    const data = await res.json();
    return data.matches || MOCK_MATCHES;
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return MOCK_MATCHES;
  }
}

export async function getMatchStats(
  matchId: number,
  homeId: number,
  awayId: number,
): Promise<MatchStats | null> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return null;

  try {
    const headers = { "X-Auth-Token": apiKey };

    // 1. Fetch H2H
    const h2hRes = await fetch(
      `https://api.football-data.org/v4/matches/${matchId}`,
      { headers, next: { revalidate: 3600 } },
    );

    // 2. Fetch Home Form
    const homeFormRes = await fetch(
      `https://api.football-data.org/v4/teams/${homeId}/matches?status=FINISHED&limit=5`,
      { headers, next: { revalidate: 3600 } },
    );

    // 3. Fetch Away Form
    const awayFormRes = await fetch(
      `https://api.football-data.org/v4/teams/${awayId}/matches?status=FINISHED&limit=5`,
      { headers, next: { revalidate: 3600 } },
    );

    if (!h2hRes.ok || !homeFormRes.ok || !awayFormRes.ok) {
      console.warn("One or more stats calls failed, falling back to mock");
      return null;
    }

    const h2hData = await h2hRes.json();
    const homeMatches = await homeFormRes.json();
    const awayMatches = await awayFormRes.json();

    const h2h = h2hData.head2head;
    const lastMatch = h2h.matches[0];

    // Helper to calculate form from matches
    const calculateForm = (matches: Match[], teamId: number) => {
      return matches.map((m) => {
        const isHome = m.homeTeam.id === teamId;
        const score = m.score?.fullTime;
        if (!score || score.home === null || score.away === null) return "D";
        if (score.home === score.away) return "D";
        const teamScore = isHome ? score.home : score.away;
        const oppScore = isHome ? score.away : score.home;
        return teamScore > oppScore ? "W" : "L";
      });
    };

    return {
      homeForm: calculateForm(homeMatches.matches, homeId),
      awayForm: calculateForm(awayMatches.matches, awayId),
      h2h: {
        homeWins: h2h.homeTeam.wins,
        awayWins: h2h.awayTeam.wins,
        draws: h2h.draws,
        lastResult: lastMatch
          ? `${lastMatch.homeTeam.tla} ${lastMatch.score.fullTime.home}-${lastMatch.score.fullTime.away} ${lastMatch.awayTeam.tla}`
          : "N/A",
      },
      winRate: {
        home: Math.round(
          (h2h.homeTeam.wins /
            (h2h.homeTeam.wins + h2h.awayTeam.wins + h2h.draws || 1)) *
            100,
        ),
        away: Math.round(
          (h2h.awayTeam.wins /
            (h2h.homeTeam.wins + h2h.awayTeam.wins + h2h.draws || 1)) *
            100,
        ),
      },
    };
  } catch (error) {
    console.error("Error fetching real match stats:", error);
    return null;
  }
}
