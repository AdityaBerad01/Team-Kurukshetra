import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

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
      { path: '*',                  element: <NotFound />    },
    ],
  },

  /* ── Protected routes (with Navbar + Sidebar, requires auth) ── */
  {
    element: <DashboardLayout />,
    children: [
      { path: '/student-dashboard',   element: <StudentDashboard />   },
      { path: '/tutor-dashboard',     element: <TutorDashboard />     },
      { path: '/manage-availability', element: <ManageAvailability /> },
      { path: '/my-requests',         element: <MySessionRequests />  },
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
