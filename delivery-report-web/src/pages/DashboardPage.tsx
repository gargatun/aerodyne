import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert, 
  Divider,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Paper
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useAuth } from '../contexts/AuthContext';
import { Delivery, DeliveryFilters as DeliveryFiltersType } from '../types';
import { fetchDeliveries } from '../services/deliveryService';
import DeliveryFiltersPanel from '../components/DeliveryFilters';
import DeliveryChart from '../components/DeliveryChart';
import DeliveryTable from '../components/DeliveryTable';

// Создаем темную тему Material 3
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#BB86FC',
    },
    secondary: {
      main: '#03DAC6',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E1E1E',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          padding: '8px 16px',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#BB86FC',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

const DashboardPage: React.FC = () => {
  // Состояния
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DeliveryFiltersType>({});
  const [chartKey, setChartKey] = useState<number>(0); // Ключ для принудительного обновления графика

  // Получаем данные из контекста авторизации
  const { user, logout } = useAuth();

  // Мемоизированная функция загрузки доставок
  const loadDeliveries = useCallback(async (filterParams: DeliveryFiltersType = {}) => {
    console.log('DashboardPage: Загрузка доставок с фильтрами:', filterParams);
    setLoading(true);
    setError(null);

    try {
      const data = await fetchDeliveries(filterParams);
      console.log(`DashboardPage: Получено ${data.length} доставок`);
      
      // Дополнительная фильтрация на клиентской стороне, если сервер вернул некорректные данные
      const filteredData = applyClientFilters(data, filterParams);
      console.log(`DashboardPage: После клиентской фильтрации осталось ${filteredData.length} доставок`);
      
      setDeliveries(filteredData);
      // Увеличиваем ключ для принудительного обновления компонента графика
      setChartKey(prevKey => prevKey + 1);
    } catch (err) {
      console.error('DashboardPage: Ошибка при загрузке данных:', err);
      setError('Ошибка при загрузке данных о доставках');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Применение фильтров на клиентской стороне
  const applyClientFilters = (deliveries: Delivery[], filters: DeliveryFiltersType): Delivery[] => {
    if (!filters || Object.keys(filters).length === 0) {
      console.log('DashboardPage: Нет фильтров для применения на клиенте');
      return deliveries;
    }
    
    console.log('DashboardPage: Применение фильтров на клиентской стороне');
    let filtered = [...deliveries];
    
    // Фильтр по модели транспорта
    if (filters.transportModel) {
      const modelId = Number(filters.transportModel);
      console.log(`DashboardPage: Клиентский фильтр по модели транспорта ID=${modelId}`);
      
      filtered = filtered.filter(delivery => 
        delivery.transport_model && delivery.transport_model.id === modelId
      );
      console.log(`DashboardPage: После фильтрации по модели транспорта осталось ${filtered.length} доставок`);
    }
    
    // Фильтр по услуге
    if (filters.service) {
      const serviceId = Number(filters.service);
      console.log(`DashboardPage: Клиентский фильтр по услуге ID=${serviceId}`);
      
      filtered = filtered.filter(delivery => 
        delivery.services && delivery.services.some(service => service.id === serviceId)
      );
      console.log(`DashboardPage: После фильтрации по услуге осталось ${filtered.length} доставок`);
    }
    
    // Фильтр по упаковке
    if (filters.packaging) {
      const packagingId = Number(filters.packaging);
      console.log(`DashboardPage: Клиентский фильтр по упаковке ID=${packagingId}`);
      
      filtered = filtered.filter(delivery => 
        delivery.packaging && delivery.packaging.id === packagingId
      );
      console.log(`DashboardPage: После фильтрации по упаковке осталось ${filtered.length} доставок`);
    }
    
    // Фильтр по дате начала
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      console.log(`DashboardPage: Клиентский фильтр по дате начала >= ${startDate.toISOString()}`);
      
      filtered = filtered.filter(delivery => {
        if (!delivery.start_time) return false;
        
        const deliveryDate = new Date(delivery.start_time);
        return deliveryDate >= startDate;
      });
      console.log(`DashboardPage: После фильтрации по дате начала осталось ${filtered.length} доставок`);
    }
    
    // Фильтр по дате окончания
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      console.log(`DashboardPage: Клиентский фильтр по дате окончания <= ${endDate.toISOString()}`);
      
      filtered = filtered.filter(delivery => {
        if (!delivery.start_time) return false;
        
        const deliveryDate = new Date(delivery.start_time);
        return deliveryDate <= endDate;
      });
      console.log(`DashboardPage: После фильтрации по дате окончания осталось ${filtered.length} доставок`);
    }
    
    return filtered;
  };

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    console.log('DashboardPage: Первичная загрузка данных');
    loadDeliveries();
  }, [loadDeliveries]);

  // Обработчик изменения фильтров
  const handleFilterChange = useCallback((newFilters: DeliveryFiltersType) => {
    console.log('DashboardPage: Применены фильтры:', newFilters);
    
    // Проверяем, действительно ли фильтры изменились
    const filtersChanged = 
      JSON.stringify(newFilters) !== JSON.stringify(filters);
    
    if (filtersChanged) {
      setFilters(newFilters);
      setLoading(true);
      loadDeliveries(newFilters)
        .finally(() => setLoading(false));
    } else {
      console.log('DashboardPage: Фильтры не изменились, пропускаем загрузку');
    }
  }, [filters, loadDeliveries]);

  // Обработчик обновления данных
  const handleRefresh = useCallback(() => {
    console.log('DashboardPage: Обновление данных с текущими фильтрами:', filters);
    setLoading(true);
    loadDeliveries(filters)
      .finally(() => setLoading(false));
  }, [filters, loadDeliveries]);

  // Сброс фильтров
  const resetFilters = useCallback(() => {
    console.log('DashboardPage: Сброс всех фильтров');
    setFilters({});
    loadDeliveries({});
  }, [loadDeliveries]);

  // Информация о применённых фильтрах
  const getActiveFiltersInfo = () => {
    const activeFilters = [];
    
    if (filters.startDate) activeFilters.push('Дата начала');
    if (filters.endDate) activeFilters.push('Дата окончания');
    if (filters.service) activeFilters.push('Услуга');
    if (filters.transportModel) activeFilters.push('Модель транспорта');
    if (filters.packaging) activeFilters.push('Упаковка');
    
    if (activeFilters.length === 0) return null;
    
    return (
      <Typography variant="body2" sx={{ mt: 1, color: darkTheme.palette.secondary.main }}>
        Активные фильтры: {activeFilters.join(', ')}
      </Typography>
    );
  };

  console.log(`DashboardPage: Рендер с ${deliveries.length} доставками, загрузка: ${loading}, фильтры: ${Object.keys(filters).length}`);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
        {/* Верхняя панель */}
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 500 }}>
              Отчёт по доставкам
            </Typography>
            
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ mr: 2, opacity: 0.9 }}>
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user.username}
                </Typography>
                
                <IconButton edge="end" onClick={logout} sx={{ color: '#BB86FC' }}>
                  <ExitToAppIcon />
                </IconButton>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {/* Заголовок */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#BB86FC', fontWeight: 500 }}>
                Статистика доставок
              </Typography>
              {getActiveFiltersInfo()}
            </Box>
            
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              color="secondary"
              sx={{ ml: 2 }}
            >
              Обновить
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Фильтры */}
          <DeliveryFiltersPanel onFilterChange={handleFilterChange} />

          {/* Индикатор загрузки */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress color="secondary" />
            </Box>
          )}

          {/* Сообщение об ошибке */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          {/* График доставок */}
          {!loading && !error && (
            <DeliveryChart 
              key={`chart-${chartKey}`} // Добавляем ключ для принудительного обновления
              deliveries={deliveries} 
            />
          )}

          {/* Таблица доставок */}
          {!error && (
            <>
              {deliveries.length > 0 ? (
                <DeliveryTable deliveries={deliveries} loading={loading} />
              ) : (
                <Paper 
                  sx={{ 
                    p: 3, 
                    mb: 3, 
                    borderRadius: 2, 
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }} 
                  elevation={1}
                >
                  <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                    Нет данных для отображения
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, mb: 2, color: 'text.secondary' }}>
                    Попробуйте изменить параметры фильтрации или обновить данные
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={resetFilters}
                    startIcon={<RestartAltIcon />}
                  >
                    Сбросить фильтры
                  </Button>
                </Paper>
              )}
            </>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default DashboardPage; 