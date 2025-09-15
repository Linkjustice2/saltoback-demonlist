import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Roulette from './pages/Roulette.js';
import CList from './pages/CList.js'; 
import ChallengeLeaderboard from './pages/ChallengeLeaderboard.js';
import Ilist from './pages/Ilist.js';
export default [
  { path: '/', component: List },
  { path: '/leaderboard', component: Leaderboard },
  { path: '/roulette', component: Roulette },
  { path: '/clist', component: CList }, 
  { path: '/challenge-leaderboard', component: ChallengeLeaderboard },
  { path: '/ilist', component: Ilist },
];
