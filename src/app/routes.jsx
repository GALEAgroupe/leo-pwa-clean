import Today from "../pages/Today.jsx";
import Calendar from "../pages/Calendar.jsx";
import Videos from "../pages/Videos.jsx";
import Articles from "../pages/Articles.jsx";
import Profile from "../pages/Profile.jsx";
import Login from "../pages/Login.jsx";
import UrgenceTrauma from "../pages/UrgenceTrauma.jsx";

export const routes = [
  { path: "/", element: <Today /> },
  { path: "/calendar", element: <Calendar /> },
  { path: "/videos", element: <Videos /> },
  { path: "/articles", element: <Articles /> },
  { path: "/articles/:id", element: <Articles /> },

  // ✅ nouveau
  { path: "/urgence", element: <UrgenceTrauma /> },

  // optionnel : garder /trauma, mais on le pointe vers la même page
  { path: "/trauma", element: <UrgenceTrauma /> },

  { path: "/profile", element: <Profile /> },
  { path: "/login", element: <Login /> },
];
