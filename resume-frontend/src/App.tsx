import React from 'react';
import { CssBaseline, ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/common/Header';
import LandingPage from './pages/LandingPage';
import ResumeListPage from './pages/ResumeListPage';
import JobRecommendationsPage from './pages/JobRecommendationsPage';

// 创建简约现代主题
let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4f6df5',
      light: '#7a91f8',
      dark: '#3a56b0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6c63ff',
      light: '#9b94ff',
      dark: '#4d45b3',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#b91c1c',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    divider: 'rgba(0, 0, 0, 0.06)',
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      '"Helvetica Neue"',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.04)',
    '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.03)',
    '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 1px 3px rgba(0, 0, 0, 0.03)',
    '0px 3px 6px rgba(0, 0, 0, 0.05), 0px 2px 4px rgba(0, 0, 0, 0.03)',
    '0px 4px 8px rgba(0, 0, 0, 0.06), 0px 2px 4px rgba(0, 0, 0, 0.03)',
    '0px 5px 12px rgba(0, 0, 0, 0.06), 0px 2px 6px rgba(0, 0, 0, 0.03)',
    '0px 6px 14px rgba(0, 0, 0, 0.07), 0px 3px 8px rgba(0, 0, 0, 0.04)',
    '0px 8px 16px rgba(0, 0, 0, 0.07), 0px 4px 8px rgba(0, 0, 0, 0.04)',
    '0px 10px 20px rgba(0, 0, 0, 0.08), 0px 5px 10px rgba(0, 0, 0, 0.04)',
    '0px 12px 24px rgba(0, 0, 0, 0.08), 0px 6px 12px rgba(0, 0, 0, 0.04)',
    '0px 14px 28px rgba(0, 0, 0, 0.09), 0px 7px 14px rgba(0, 0, 0, 0.05)',
    '0px 16px 32px rgba(0, 0, 0, 0.09), 0px 8px 16px rgba(0, 0, 0, 0.05)',
    '0px 18px 36px rgba(0, 0, 0, 0.1), 0px 9px 18px rgba(0, 0, 0, 0.05)',
    '0px 20px 40px rgba(0, 0, 0, 0.1), 0px 10px 20px rgba(0, 0, 0, 0.05)',
    '0px 22px 44px rgba(0, 0, 0, 0.11), 0px 11px 22px rgba(0, 0, 0, 0.06)',
    '0px 24px 48px rgba(0, 0, 0, 0.11), 0px 12px 24px rgba(0, 0, 0, 0.06)',
    '0px 26px 52px rgba(0, 0, 0, 0.12), 0px 13px 26px rgba(0, 0, 0, 0.06)',
    '0px 28px 56px rgba(0, 0, 0, 0.12), 0px 14px 28px rgba(0, 0, 0, 0.06)',
    '0px 30px 60px rgba(0, 0, 0, 0.13), 0px 15px 30px rgba(0, 0, 0, 0.07)',
    '0px 32px 64px rgba(0, 0, 0, 0.13), 0px 16px 32px rgba(0, 0, 0, 0.07)',
    '0px 34px 68px rgba(0, 0, 0, 0.14), 0px 17px 34px rgba(0, 0, 0, 0.07)',
    '0px 36px 72px rgba(0, 0, 0, 0.14), 0px 18px 36px rgba(0, 0, 0, 0.07)',
    '0px 38px 76px rgba(0, 0, 0, 0.15), 0px 19px 38px rgba(0, 0, 0, 0.08)',
    '0px 40px 80px rgba(0, 0, 0, 0.15), 0px 20px 40px rgba(0, 0, 0, 0.08)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          fontWeight: 500,
          padding: '10px 24px',
          '&:hover': {
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          '&.MuiButton-containedPrimary': {
            backgroundImage: 'linear-gradient(135deg, #4f6df5 0%, #6c63ff 100%)',
          },
          '&.MuiButton-containedSecondary': {
            backgroundImage: 'linear-gradient(135deg, #6c63ff 0%, #8c79ff 100%)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        },
        elevation2: {
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03)',
        },
        elevation3: {
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.04)',
        },
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'background-color 0.2s ease',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          opacity: 0.6,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// 使字体大小响应式
theme = responsiveFontSizes(theme);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/resumes" element={<ResumeListPage />} />
            <Route path="/job-recommendations" element={<JobRecommendationsPage />} />
            {/* Add more routes as needed */}
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
