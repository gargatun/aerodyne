import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ruRU } from '@mui/material/locale';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';

// Контексты
import { AuthProvider } from './contexts/AuthContext';

// Компоненты
import PrivateRoute from './components/PrivateRoute';

// Страницы
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// Создаем тему Material UI
const theme = createTheme(
  {
    palette: {
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
    typography: {
      fontFamily: "'Roboto', 'Arial', sans-serif",
    },
  },
  ruRU // Локализация компонентов на русский язык
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Приватные маршруты */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>
              
              {/* Перенаправление на дашборд по умолчанию */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Перенаправление для неизвестных маршрутов */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
