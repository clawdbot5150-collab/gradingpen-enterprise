import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Import store
import { store } from './store/store';

// Import components
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Import pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Assignments from './pages/Assignments/Assignments';
import Grading from './pages/Grading/Grading';
import Analytics from './pages/Analytics/Analytics';
import Rubrics from './pages/Rubrics/Rubrics';
import Students from './pages/Students/Students';
import Settings from './pages/Settings/Settings';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#d32f2f',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Header onSidebarToggle={handleSidebarToggle} />
                      <Sidebar 
                        open={sidebarOpen} 
                        onClose={() => setSidebarOpen(false)} 
                      />
                      <Box
                        component="main"
                        sx={{
                          flexGrow: 1,
                          p: 3,
                          ml: sidebarOpen ? '240px' : '0px',
                          transition: theme.transitions.create('margin', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                          }),
                          marginTop: '64px',
                        }}
                      >
                        <Routes>
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/assignments" element={<Assignments />} />
                          <Route path="/assignments/:id/grade" element={<Grading />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/rubrics" element={<Rubrics />} />
                          <Route path="/students" element={<Students />} />
                          <Route path="/settings" element={<Settings />} />
                        </Routes>
                      </Box>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Box>
          </Router>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '8px',
              },
              success: {
                style: {
                  background: '#2e7d32',
                },
              },
              error: {
                style: {
                  background: '#d32f2f',
                },
              },
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;