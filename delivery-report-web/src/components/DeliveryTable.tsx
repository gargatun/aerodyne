import React, { useMemo } from 'react';
import { 
  DataGrid, 
  GridColDef, 
  GridSortModel
} from '@mui/x-data-grid';
import { 
  Paper, 
  Typography, 
  Chip, 
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import { Delivery } from '../types';

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
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

interface DeliveryTableProps {
  deliveries: Delivery[];
  loading: boolean;
}

// Преобразуем данные в формат, понятный для DataGrid
const prepareRows = (deliveries: Delivery[]) => {
  return deliveries.map(delivery => ({
    id: delivery.id,
    transport_number: delivery.transport_number || '',
    transport_model_name: delivery.transport_model ? delivery.transport_model.name : '',
    start_time: delivery.start_time || '',
    end_time: delivery.end_time || '',
    distance_km: delivery.distance ? `${delivery.distance} км` : '',
    services: delivery.services || [],
    packaging_name: delivery.packaging ? delivery.packaging.name : '',
    status: delivery.status || null,
    technical_condition: delivery.technical_condition || '',
    source_address: delivery.source_address || '',
    destination_address: delivery.destination_address || '',
    courier: delivery.courier ? (
      delivery.courier.first_name && delivery.courier.last_name 
        ? `${delivery.courier.first_name} ${delivery.courier.last_name}` 
        : delivery.courier.username
    ) : '-'
  }));
};

const DeliveryTable: React.FC<DeliveryTableProps> = ({ deliveries, loading }) => {
  // Подготовленные данные для таблицы
  const rows = prepareRows(deliveries);
  
  // Определяем информацию о моделях транспорта для отображения
  const transportModels = useMemo(() => {
    const models = new Set<string>();
    deliveries.forEach(delivery => {
      if (delivery.transport_model?.name) {
        models.add(delivery.transport_model.name);
      }
    });
    return Array.from(models);
  }, [deliveries]);
  
  // Информация о фильтрации для заголовка
  const filterInfo = useMemo(() => {
    return transportModels.length === 1 
      ? `(${transportModels[0]})` 
      : '';
  }, [transportModels]);

  // Определение столбцов таблицы
  const columns: GridColDef[] = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 70
    },
    { 
      field: 'transport_number', 
      headerName: 'Номер транспорта', 
      width: 150
    },
    { 
      field: 'transport_model_name', 
      headerName: 'Модель транспорта', 
      width: 180
    },
    { 
      field: 'start_time', 
      headerName: 'Дата начала', 
      width: 180,
      sortable: true
    },
    { 
      field: 'end_time', 
      headerName: 'Дата окончания', 
      width: 180
    },
    { 
      field: 'distance_km', 
      headerName: 'Дистанция (км)', 
      width: 130
    },
    { 
      field: 'services', 
      headerName: 'Услуги', 
      width: 200,
      renderCell: (params) => {
        const services = params.value || [];
        if (!services.length) return '-';
        
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {services.map((service: {id: number, name: string}) => (
              <Chip 
                key={service.id} 
                label={service.name} 
                size="small" 
                variant="outlined" 
                color="secondary"
              />
            ))}
          </Box>
        );
      }
    },
    { 
      field: 'packaging_name', 
      headerName: 'Упаковка', 
      width: 150
    },
    { 
      field: 'status', 
      headerName: 'Статус', 
      width: 150,
      renderCell: (params) => {
        const status = params.value;
        if (!status) return '-';
        
        return (
          <Chip 
            label={status.name} 
            style={{ 
              backgroundColor: status.color || '#ccc',
              color: ['white', 'yellow', 'lightgreen'].includes(status.color || '') ? 'black' : 'white'
            }} 
          />
        );
      }
    },
    { 
      field: 'technical_condition', 
      headerName: 'Техническое состояние', 
      width: 200
    },
    { 
      field: 'source_address', 
      headerName: 'Адрес источника', 
      width: 200
    },
    { 
      field: 'destination_address', 
      headerName: 'Адрес назначения', 
      width: 200
    },
    { 
      field: 'courier', 
      headerName: 'Курьер', 
      width: 150
    }
  ];

  // Начальная сортировка
  const initialSortModel: GridSortModel = [
    {
      field: 'start_time',
      sort: 'desc',
    },
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 8px 16px 0 rgba(0,0,0,0.2)',
          overflowX: 'auto' // Добавляем горизонтальную прокрутку для адаптивности
        }}
        elevation={6}
      >
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{ 
            fontWeight: 500,
            color: '#BB86FC',
            mb: 2
          }}
        >
          Список доставок {filterInfo}
        </Typography>
        
        <Box sx={{ 
          width: '100%', 
          height: 'auto',
          minHeight: 400,
          maxHeight: 600  // Увеличиваем максимальную высоту таблицы
        }}>
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
              sorting: {
                sortModel: initialSortModel,
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            loading={loading}
            autoHeight
            sx={{
              '.MuiDataGrid-columnHeader': {
                px: 2,
                py: 1.5,
                fontWeight: 'bold'
              },
              '.MuiDataGrid-cell': {
                px: 2,
                py: 1.5,
              },
              '.MuiDataGrid-virtualScroller': {
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px'
                }
              },
              overflowX: 'auto', // Добавляем горизонтальную прокрутку для таблицы
              width: '100%'
            }}
          />
        </Box>
      </Paper>
    </ThemeProvider>
  );
};

export default DeliveryTable; 