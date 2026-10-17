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
