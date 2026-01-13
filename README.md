# Fodboldlinjen AI - Football Intelligence Platform

A comprehensive football (soccer) performance tracking and AI-powered analysis platform designed for youth football teams. Built with modern web technologies to replace traditional Excel-based workflows with intelligent, data-driven insights.

## 🎯 Overview

Fodboldlinjen AI is a full-stack web application that helps football coaches and teams:
- **Track player performance** across matches and training sessions
- **Monitor physical development** through gym and fitness data
- **Generate AI-powered tactical analysis** and personalized training recommendations
- **Visualize player statistics** with interactive charts and FIFA-style player cards
- **Export professional PDF reports** for sharing with players and staff

## ✨ Key Features

### 📊 Performance Tracking
- **Match Statistics**: Goals, assists, tackles, passing accuracy, distance covered
- **Physical Stats**: Gym performance (PRs for exercises like bench press, squats, deadlifts)
- **Player Ratings**: Advanced rating system (0-10 scale) based on multiple performance factors
- **Historical Data**: Track trends over time with interactive visualizations

### 🤖 AI-Powered Analysis (Latest: 2026-01-13)

**AI Engine:** Google's **Gemini Flash** - Optimized for speed and cost-effectiveness while maintaining high-quality output with enhanced prompting.

**Core Capabilities:**
- **Data-Driven Insights**: Every conclusion backed by actual match and gym statistics
- **Multiple Analysis Types**:
  - 📊 **General Overview**: Balanced team/player assessment
  - 🎯 **Tactical Deep Dive**: Formation, pressing, transitions, space utilization
  - 👤 **Individual Development**: Personal training plans with concrete steps
  - 💪 **Physical & Mental**: Links gym performance to match data
  - 💭 **Feedback & Psychology**: Player sentiment and team culture analysis
  
**Enhanced Data Collection:**
- Performance rating with variance and consistency metrics
- Match-by-match trend analysis (⬆️ Rising / ➡️ Stable / ⬇️ Declining)
- Shot conversion efficiency tracking
- Distance covered per match
- Top performers and scorers automatically identified
- Best/worst match identification

**Smart Recommendations:**
- 5-7 detailed training exercises with step-by-step instructions
- SMART goals for next 3 matches/tests
- Coach-specific recommendations (communication, tactics, meetings)
- All advice is immediately actionable

**Quality Assurance:**
- ✓ Professional UEFA Pro-license coach persona
- ✓ Concrete data-backed observations (no generic fluff)
- ✓ Actionable tomorrow - not theoretical
- ✓ SMART goals framework
- ✓ Reports in Danish

**What's New:**
- 🆕 Players with only gym data now searchable
- 🆕 Consistency ratings (High/Medium/Low variance)
- 🆕 Individual match-by-match breakdowns (last 5 games)
- 🆕 Team insights (top 5 performers, top scorers)
- 🆕 Improved trend calculation (first half vs second half comparison)
- 🆕 Enhanced generation config (temperature 0.8, 8192 token max)

### 📈 Data Visualization
- **FIFA-Style Player Cards**: Dynamic cards with rating-based color schemes (Bronze/Silver/Gold/Special)
- **Performance Trends**: Line charts showing rating evolution over the last 10 matches
- **Statistical Breakdowns**: Pie charts for goal contributions, bar charts for shot efficiency
- **Radar Charts**: Visual representation of player attributes (PAC, SHO, PAS, DRI, DEF, PHY)
- **Cumulative Impact Analysis**: Track goals and assists accumulation over time

### 📝 Data Management
- **CSV Upload**: Easy bulk import of match and training data
- **Data Editor**: Built-in spreadsheet-like interface for data correction
- **Report History**: Save and retrieve AI-generated analyses
- **PDF Export**: Professional, print-ready reports with custom branding

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: 
  - Custom component library with "glassmorphism" design
  - [Radix UI](https://www.radix-ui.com/) primitives
  - [Lucide Icons](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Data Grid**: [AG-Grid](https://www.ag-grid.com/)

### Backend
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes
- **AI**: [Google Gemini AI](https://ai.google.dev/)

### Key Libraries
- `@google/generative-ai` - AI-powered analysis
- `html2canvas` & `jspdf` - PDF generation
- `papaparse` - CSV parsing
- `date-fns` - Date utilities
- `zod` - Schema validation

## 📁 Project Structure

```
fodboldlinjen-ai/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (dashboard)/             # Authenticated routes
│   │   │   ├── ai/                  # AI Analysis page
│   │   │   ├── editor/              # Data Editor
│   │   │   ├── home/                # Dashboard home
│   │   │   ├── players/             # Player list & profiles
│   │   │   │   └── [name]/          # Individual player page
│   │   │   ├── comparison/          # Player comparison
│   │   │   ├── settings/            # User settings
│   │   │   └── upload/              # CSV upload interface
│   │   ├── api/                     # API routes
│   │   │   └── ai-report/           # AI analysis endpoint
│   │   ├── login/                   # Authentication page
│   │   └── layout.tsx               # Root layout
│   │
│   ├── components/                   # React components
│   │   ├── aceternity/              # Animated backgrounds
│   │   ├── dashboard/               # Dashboard-specific
│   │   ├── players/                 # Player-related (FIFA cards)
│   │   └── ui/                      # Reusable UI components
│   │
│   ├── lib/                         # Utilities & services
│   │   ├── constants.ts             # Centralized app constants
│   │   ├── ai-prompts.ts            # AI prompt building logic
│   │   ├── metrics.ts               # Performance calculations
│   │   ├── parser.ts                # Excel/CSV file parsing
│   │   ├── utils.ts                 # Utility functions
│   │   ├── index.ts                 # Clean exports
│   │   ├── services/                # Data fetching services
│   │   │   ├── index.ts             # Service exports
│   │   │   ├── dashboard.ts         # Dashboard statistics
│   │   │   ├── data.ts              # Data upload operations
│   │   │   ├── editor.ts            # Data editor operations
│   │   │   ├── feedback.ts          # Feedback queries
│   │   │   ├── metadata.ts          # Player/match metadata
│   │   │   ├── player.ts            # Player statistics
│   │   │   └── reports.ts           # Report management
│   │   └── supabase/                # Supabase client
│   │
│   ├── types/                       # TypeScript type definitions
│   │   └── index.ts                 # All shared types
│   │
│   └── middleware.ts                # Auth middleware
│
├── public/                          # Static assets
├── .env.local                       # Environment variables (not in repo)
└── README.md                        # This file
```


## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google AI Studio API key (for Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fodboldlinjen-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Google AI
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up the database**
   
   Run the following SQL in your Supabase SQL editor:
   
   ```sql
   -- Create tables
   CREATE TABLE matches (
       id BIGSERIAL PRIMARY KEY,
       date DATE NOT NULL,
       opponent TEXT NOT NULL,
       created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE player_stats (
       id BIGSERIAL PRIMARY KEY,
       player_name TEXT NOT NULL,
       match_id BIGINT REFERENCES matches(id),
       date DATE,
       goals INTEGER DEFAULT 0,
       assists INTEGER DEFAULT 0,
       total_tackles INTEGER DEFAULT 0,
       total_shots INTEGER DEFAULT 0,
       passing_accuracy DECIMAL(5,2),
       distance_km DECIMAL(5,2),
       minutes INTEGER,
       feedback TEXT,
       created_at TIMESTAMP DEFAULT NOW(),
       UNIQUE(player_name, match_id)
   );

   CREATE TABLE performance_stats (
       id BIGSERIAL PRIMARY KEY,
       player_name TEXT NOT NULL,
       exercise TEXT NOT NULL,
       pr_1 DECIMAL(10,2),
       pr_2 DECIMAL(10,2),
       pr_3 DECIMAL(10,2),
       pr_4 DECIMAL(10,2),
       created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE ai_reports (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID REFERENCES auth.users(id),
       scope TEXT NOT NULL,
       target_label TEXT,
       analysis_type TEXT,
       report_content TEXT,
       created_at TIMESTAMP DEFAULT NOW()
   );

   -- Create indexes for performance
   CREATE INDEX idx_player_stats_name ON player_stats(player_name);
   CREATE INDEX idx_player_stats_match ON player_stats(match_id);
   CREATE INDEX idx_performance_stats_name ON performance_stats(player_name);
   CREATE INDEX idx_ai_reports_user ON ai_reports(user_id);
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Data Schema

### Key Database Tables

#### `matches`
Stores match metadata
- `id`: Unique identifier
- `date`: Match date
- `opponent`: Opponent team name

#### `player_stats`
Individual player performance per match
- `player_name`: Player identifier
- `match_id`: Reference to matches table
- `goals`, `assists`, `total_tackles`, etc.
- `feedback`: Coach/player feedback text

#### `performance_stats`
Gym and physical test results
- `player_name`: Player identifier
- `exercise`: Exercise name (e.g., "Bench Press", "40m Sprint")
- `pr_1`, `pr_2`, `pr_3`, `pr_4`: Personal records

## 🧮 Performance Metrics

### FIFA-Style Ratings (0-99 scale)
The app calculates FIFA-style attributes based on actual performance data:

- **PAC (Pace)**: Base 68 + (games played × 0.4)
- **SHO (Shooting)**: 45 + (goals/game × 50) + (conversion rate × 20)
- **PAS (Passing)**: Average passing accuracy
- **DRI (Dribbling)**: Base 58 + (assists × 4)
- **DEF (Defense)**: Base 35 + (tackles/game × 15)
- **PHY (Physical)**: Based on gym PRs (45 + max PR × 0.45)

### Match Rating (0-10 scale)
```
Base Score: 6.0
+ Goals × 1.0
+ Assists × 0.8
+ Tackles × 0.2
+ Passing Bonus (0.5 if ≥85%, 0.2 if ≥75%)
Max: 10.0
```

## 🎨 UI/UX Features

- **Responsive Design**: Fully mobile-optimized with adaptive navigation
- **Dark Mode**: Sleek dark theme optimized for extended use
- **Glassmorphism**: Modern translucent card designs
- **Smooth Animations**: Micro-interactions and page transitions
- **Loading States**: Skeleton screens and spinners for better UX
- **Dynamic FIFA Cards**: Color-coded by rating (Bronze <65, Silver 65-74, Gold 75-89, Special 90+)

## 🔐 Authentication

- **Supabase Auth**: Email/password authentication
- **Protected Routes**: Middleware-based route protection
- **Session Management**: Automatic token refresh

## 📱 Mobile Optimization

- **Bottom Navigation**: Quick access to key features on mobile
- **Adaptive Layouts**: Grid layouts adjust to screen size
- **Touch-Optimized**: Larger tap targets and swipe gestures
- **Reduced Column Display**: Automatically hides less critical data columns on small screens

## 🚢 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

## 📈 Future Enhancements

- [ ] Team comparison analytics
- [ ] Video analysis integration
- [ ] Multi-language support (English, Spanish)
- [ ] Advanced tactical board
- [ ] Team chat/communication
- [ ] Injury tracking
- [ ] Attendance management
- [ ] Parent portal

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Authors

- **Development Team** - Initial work and ongoing development

## 🙏 Acknowledgments

- Google Gemini AI for intelligent analysis capabilities
- Supabase for backend infrastructure
- The open-source community for excellent libraries and tools

## 📞 Support

For issues, questions, or feature requests, please open an issue on the repository or contact the development team.

---

**Built with ❤️ for the football coaching community**
