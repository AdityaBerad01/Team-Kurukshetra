import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RoleRoute from './components/RoleRoute'

// Layouts
import Layout          from './layouts/Layout'
import DashboardLayout from './layouts/DashboardLayout'

// Pages – public
import Home        from './pages/Home'
import Login       from './pages/Login'
import Register    from './pages/Register'
import FindTutors  from './pages/FindTutors'
import TutorProfile from './pages/TutorProfile'
import NotFound    from './pages/NotFound'

// Pages – protected (dashboard)
import StudentDashboard   from './pages/StudentDashboard'
import TutorDashboard     from './pages/TutorDashboard'
import ManageAvailability from './pages/ManageAvailability'
import MySessionRequests  from './pages/MySessionRequests'
import ProfileSettings    from './pages/ProfileSettings'
import Wallet             from './pages/Wallet'
import LearningProgress   from './pages/LearningProgress'
import CommunityResources from './pages/CommunityResources'
import FocusRooms         from './pages/FocusRooms'
import SessionPlanner     from './pages/SessionPlanner'
import CampusSkillMap     from './pages/CampusSkillMap'
import Portfolio          from './pages/Portfolio'

const router = createBrowserRouter([
  /* ── Public routes (with Navbar + Footer) ── */
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true,                element: <Home />        },
      { path: 'login',              element: <Login />       },
      { path: 'register',           element: <Register />    },
      { path: 'tutors',             element: <FindTutors />  },
      { path: 'tutors/:id',         element: <TutorProfile />},
      { path: 'resources',          element: <CommunityResources /> },
      { path: 'focus-rooms',        element: <FocusRooms /> },
      { path: 'campus-skill-map',   element: <CampusSkillMap /> },
      { path: 'portfolio/:id',      element: <Portfolio /> },
      { path: '*',                  element: <NotFound />    },
    ],
  },

  /* ── Protected routes (with Navbar + Sidebar, requires auth) ── */
  {
    element: <DashboardLayout />,
    children: [
      {
        path: '/student-dashboard',
        element: (
          <RoleRoute allowedRoles={['STUDENT']} fallback="/tutor-dashboard">
            <StudentDashboard />
          </RoleRoute>
        ),
      },
      {
        path: '/tutor-dashboard',
        element: (
          <RoleRoute allowedRoles={['TUTOR']} fallback="/student-dashboard">
            <TutorDashboard />
          </RoleRoute>
        ),
      },
      {
        path: '/manage-availability',
        element: (
          <RoleRoute allowedRoles={['TUTOR']} fallback="/student-dashboard">
            <ManageAvailability />
          </RoleRoute>
        ),
      },
      { path: '/my-requests',         element: <MySessionRequests />  },
      { path: '/planner',             element: <SessionPlanner />     },
      { path: '/resources',           element: <CommunityResources /> },
      { path: '/focus-rooms',         element: <FocusRooms />         },
      { path: '/campus-skill-map',    element: <CampusSkillMap />     },
      { path: '/portfolio',           element: <Portfolio />          },
      { path: '/wallet',              element: <Wallet />             },
      { path: '/progress',            element: <LearningProgress />   },
      { path: '/profile',             element: <ProfileSettings />    },
    ],
  },
])

const App = () => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
)

export default App
