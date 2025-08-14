import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Roulette from './pages/Roulette.js';
import CList from './pages/CList.js'; // <-- new page
import ChallengeLeaderboard from './pages/ChallengeLeaderboard.js';

export default [
  { path: '/', component: List },
  { path: '/leaderboard', component: Leaderboard },
  { path: '/roulette', component: Roulette },
  { path: '/clist', component: CList }, // <-- new route
];
