import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Stack,
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button,
  SelectChangeEvent,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { DeliveryFilters as DeliveryFiltersType } from '../types';
import { fetchServices, fetchTransportModels, fetchPackagingTypes } from '../services/deliveryService';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// Типы для свойств компонента
interface DeliveryFiltersPanelProps {
  onFilterChange: (filters: DeliveryFiltersType) => void;
}

// Компонент фильтров
const DeliveryFiltersPanel: React.FC<DeliveryFiltersPanelProps> = ({ onFilterChange }) => {
  const theme = useTheme();
  
  // Состояния для фильтров
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [service, setService] = useState<number | null>(null);
  const [transportModel, setTransportModel] = useState<number | null>(null);
  const [packaging, setPackaging] = useState<number | null>(null);
  
  // Состояния для опций
  const [services, setServices] = useState<Array<{ id: number, name: string }>>([]);
  const [transportModels, setTransportModels] = useState<Array<{ id: number, name: string }>>([]);
  const [packagingTypes, setPackagingTypes] = useState<Array<{ id: number, name: string }>>([]);
  
  // Состояние загрузки
  const [loading, setLoading] = useState(false);

  // Загрузка опций при первом рендере
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoading(true);
      try {
        // Загрузка данных для фильтров
        const [servicesData, modelsData, packagingData] = await Promise.all([
          fetchServices(),
          fetchTransportModels(),
          fetchPackagingTypes()
        ]);
        
        setServices(servicesData);
        setTransportModels(modelsData);
        setPackagingTypes(packagingData);
      } catch (error) {
        console.error('Ошибка при загрузке опций фильтров:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFilterOptions();
  }, []);

  // Применение фильтров
  const applyFilters = () => {
    const filters: DeliveryFiltersType = {};
    
    if (startDate) filters.startDate = startDate.toISOString();
    if (endDate) filters.endDate = endDate.toISOString();
    if (service) filters.service = service;
    if (transportModel) filters.transportModel = transportModel;
    if (packaging) filters.packaging = packaging;
    
    console.log('DeliveryFilters: Применяем фильтры:', filters);
    onFilterChange(filters);
  };

  // Сброс фильтров
  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setService(null);
    setTransportModel(null);
    setPackaging(null);
    
    console.log('DeliveryFilters: Сбрасываем все фильтры');
    onFilterChange({});
  };

  // Обработчики изменения фильтров
  const handleServiceChange = (event: SelectChangeEvent<number | string>) => {
    setService(event.target.value === '' ? null : Number(event.target.value));
  };
  
  const handleTransportModelChange = (event: SelectChangeEvent<number | string>) => {
    setTransportModel(event.target.value === '' ? null : Number(event.target.value));
  };
  
  const handlePackagingChange = (event: SelectChangeEvent<number | string>) => {
    setPackaging(event.target.value === '' ? null : Number(event.target.value));
  };

  return (
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 2,
        boxShadow: '0 4px 12px 0 rgba(0,0,0,0.15)'
      }}
      elevation={3}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterAltIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
        <Typography 
          variant="h6" 
          component="h2" 
          sx={{ 
            fontWeight: 500, 
            color: theme.palette.primary.main 
          }}
        >
          Фильтры
        </Typography>
      </Box>
      
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
          {/* Фильтр по дате начала */}
          <Box sx={{ width: { xs: '100%', sm: '48%', md: '25%' } }}>
            <DatePicker
              label="Дата начала"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              slotProps={{
                textField: {
                  variant: 'outlined',
                  fullWidth: true,
                  margin: 'normal',
                  size: 'small'
                }
              }}
            />
          </Box>
          
          {/* Фильтр по дате окончания */}
          <Box sx={{ width: { xs: '100%', sm: '48%', md: '25%' } }}>
            <DatePicker
              label="Дата окончания"
              value={endDate}
              onChange={(date) => setEndDate(date)}
              slotProps={{
                textField: {
                  variant: 'outlined',
                  fullWidth: true,
                  margin: 'normal',
                  size: 'small'
                }
              }}
            />
          </Box>
          
          {/* Фильтр по услуге */}
          <Box sx={{ width: { xs: '100%', sm: '48%', md: '16.66%' } }}>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="service-label">Услуга</InputLabel>
              <Select
                labelId="service-label"
                id="service"
                value={service ?? ''}
                label="Услуга"
                onChange={handleServiceChange}
                disabled={loading || services.length === 0}
              >
                <MenuItem value="">
                  <em>Не выбрано</em>
                </MenuItem>
                {services.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {/* Фильтр по модели транспорта */}
          <Box sx={{ width: { xs: '100%', sm: '48%', md: '16.66%' } }}>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="transport-model-label">Модель транспорта</InputLabel>
              <Select
                labelId="transport-model-label"
                id="transport-model"
                value={transportModel ?? ''}
                label="Модель транспорта"
                onChange={handleTransportModelChange}
                disabled={loading || transportModels.length === 0}
              >
                <MenuItem value="">
                  <em>Не выбрано</em>
                </MenuItem>
                {transportModels.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {/* Фильтр по типу упаковки */}
          <Box sx={{ width: { xs: '100%', sm: '48%', md: '16.66%' } }}>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="packaging-label">Тип упаковки</InputLabel>
              <Select
                labelId="packaging-label"
                id="packaging"
                value={packaging ?? ''}
                label="Тип упаковки"
                onChange={handlePackagingChange}
                disabled={loading || packagingTypes.length === 0}
              >
                <MenuItem value="">
                  <em>Не выбрано</em>
                </MenuItem>
                {packagingTypes.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </LocalizationProvider>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          onClick={resetFilters}
          startIcon={<RestartAltIcon />}
          sx={{ mr: 1 }}
          disabled={loading}
        >
          Сбросить
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={applyFilters}
          startIcon={<FilterAltIcon />}
          disabled={loading}
        >
          Применить
        </Button>
      </Box>
    </Paper>
  );
};

export default DeliveryFiltersPanel; 