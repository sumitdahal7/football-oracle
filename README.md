# ⚽ Football Oracle

**Football Oracle** is a premium, AI-driven football match analysis dashboard. It combines real-time statistics from professional sports APIs with the analytical power of Google's Gemini 2.0 Flash to provide users with elite-level tactical breakdowns and match predictions.

![Football Oracle Dashboard](https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop) _(Demo image placeholder - replace with actual screenshot if available)_

## ✨ Key Features

- **Fixture-First Dashboard**: Instantly view upcoming matches grouped by date with a clean, modern aesthetic.
- **Dynamic Match Center**:
  - **Real-Time Form**: Fetches the last 5 results for every team directly from the API.
  - **Historic H2H**: Analyzes previous encounters and displays win/loss/draw records.
  - **Power Ratings**: Context-aware metrics for Home Pressure and Away Resilience.
- **AI Oracle Predictions**:
  - Uses **Gemini 2.0 Flash** with **Google Search Grounding** for live web analysis.
  - Deep tactical breakdowns considering injuries, mentalities, and current news.
  - Predicted scorelines and high-confidence outcomes.
- **League Filtering**: Quickly switch between major leagues (Premier League, La Liga, etc.) to find the matches that matter.
- **Premium UI/UX**: Built with Framer Motion for liquid transitions and a sleek dark-mode aesthetic.

## 🛠️ Technology Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Server Actions)
- **AI Engine**: [Google Gemini 2.0 Flash SDK](https://ai.google.dev/gemini-api/docs/quickstart?lang=node)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Live Data**: [Football-Data.org API](https://www.football-data.org/)
- **Toasts**: [Sonner](https://sonner.stevenly.me/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- [Gemini API Key](https://aistudio.google.com/app/apikey)
- [Football-Data.org API Key](https://www.football-data.org/client/register)

### Installation

1. **Clone the repository:**

   ```bash
   git clone git@github.com:sumitdahal7/football-oracle.git
   cd football-oracle
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your keys:

   ```env
   FOOTBALL_DATA_API_KEY=your_football_data_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to witness the Oracle in action.

## 🧠 How It Works

1. **Data Ingestion**: Matches are fetched from the Football-Data API.
2. **Expansion**: When a user opens the "Match Center," the app fetches live H2H and form data using specific team endpoints.
3. **AI Reasoning**: Upon choosing "Consult Oracle," the team names and context are sent to a Next.js Server Action. This triggers a grounded Gemini 2.0 call that browses the live web for the latest team news before synthesizing a prediction.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

_Built with ❤️ for football enthusiasts and tactical nerds._
