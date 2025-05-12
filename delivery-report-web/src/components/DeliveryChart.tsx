import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Paper,
  Typography, 
  Box,
  useTheme
} from '@mui/material';
import { Delivery, DeliveryFilters as DeliveryFiltersType } from '../types';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DeliveryChartProps {
  deliveries: Delivery[];
}

// Тип для данных графика
interface ChartData {
  date: string;
  formattedDate: string;
  count: number;
}

const DeliveryChart: React.FC<DeliveryChartProps> = ({ deliveries }) => {
  const theme = useTheme();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const prevDeliveriesRef = useRef<Delivery[]>([]);
  
  // Определяем информацию о моделях транспорта для отображения - перемещено выше условных return
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
      : transportModels.length > 0 
        ? `(${transportModels.length} типов транспорта)` 
        : '';
  }, [transportModels]);
  
  // Сравниваем текущие и предыдущие deliveries для отладки
  useEffect(() => {
    if (prevDeliveriesRef.current !== deliveries) {
      console.log(`DeliveryChart: Обнаружено изменение списка доставок: старый=${prevDeliveriesRef.current.length}, новый=${deliveries.length}`);
      
      // Проверяем, действительно ли это новые объекты, а не просто то же самое
      if (prevDeliveriesRef.current.length > 0 && deliveries.length > 0) {
        // Проверим первые несколько элементов
        const oldIds = prevDeliveriesRef.current.slice(0, 3).map(d => d.id).join(',');
        const newIds = deliveries.slice(0, 3).map(d => d.id).join(',');
        console.log(`DeliveryChart: ID первых доставок - предыдущие: [${oldIds}], новые: [${newIds}]`);
      }
      
      prevDeliveriesRef.current = deliveries;
    }
  }, [deliveries]);
  
  console.log(`DeliveryChart: Получены новые данные, ${deliveries.length} доставок`);
  
  // Используем useMemo для вычисления данных графика только когда меняется массив deliveries
  const processedChartData = useMemo(() => {
    console.log(`DeliveryChart: Обработка новых данных через useMemo, получено ${deliveries.length} доставок`);
    
    if (deliveries.length === 0) {
      console.log('DeliveryChart: Пустой массив доставок');
      return [];
    }
    
    // Логируем первые 3 доставки для отладки
    if (deliveries.length > 0) {
      console.log('DeliveryChart: Примеры доставок:');
      deliveries.slice(0, 3).forEach((delivery, index) => {
        console.log(`Доставка ${index + 1}:`, {
          id: delivery.id,
          start_time: delivery.start_time,
          transport_model: delivery.transport_model?.name,
          service: delivery.services?.map(s => s.name).join(', '),
          packaging: delivery.packaging?.name
        });
      });
    }
    
    // Преобразование данных для графика
    console.log('DeliveryChart: Формирование данных графика');
    
    // Группируем доставки по дате
    const groupedByDate: Record<string, number> = {};
    
    deliveries.forEach(delivery => {
      if (!delivery.start_time) {
        console.log('DeliveryChart: Пропущена доставка без start_time:', delivery.id);
        return;
      }
      
      try {
        // Получаем дату в формате YYYY-MM-DD
        const date = format(parseISO(delivery.start_time), 'yyyy-MM-dd');
        
        // Увеличиваем счетчик для этой даты
        groupedByDate[date] = (groupedByDate[date] || 0) + 1;
      } catch (e) {
        console.error('DeliveryChart: Ошибка при парсинге даты:', delivery.start_time, e);
      }
    });
    
    // Преобразуем сгруппированные данные в массив для графика
    const chartData = Object.entries(groupedByDate)
      .map(([date, count]) => ({
        date,
        // Для отображения на графике преобразуем дату
        formattedDate: format(parseISO(date), 'd MMM', { locale: ru }),
        count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    console.log(`DeliveryChart: Сформировано ${chartData.length} точек данных для графика`);
    
    // Подробно логируем точки данных
    if (chartData.length > 0) {
      console.log('DeliveryChart: Точки данных графика:', JSON.stringify(chartData));
    }
    
    return chartData;
  }, [deliveries]);
  
  // Обновляем состояние при изменении вычисленных данных
  useEffect(() => {
    console.log('DeliveryChart: Обновление состояния chartData из мемоизированных данных');
    setChartData(processedChartData);
  }, [processedChartData]);
  
  // Если нет данных, показываем соответствующее сообщение
  if (!deliveries.length) {
    console.log('DeliveryChart: Рендер "Нет данных для отображения на графике"');
    return (
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          height: 300, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }}
        elevation={3}
      >
        <Typography variant="subtitle1" color="text.secondary">
          Нет данных для отображения на графике
        </Typography>
      </Paper>
    );
  }
  
  // Если нет данных для графика (возможно, из-за неправильных дат или нет доставок после фильтрации)
  if (chartData.length === 0) {
    console.log('DeliveryChart: Рендер "Нет данных для построения графика с текущими фильтрами"');
    return (
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          height: 300, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }}
        elevation={3}
      >
        <Typography variant="subtitle1" color="text.secondary">
          Нет данных для построения графика с текущими фильтрами
        </Typography>
      </Paper>
    );
  }
  
  console.log(`DeliveryChart: Рендер графика с ${chartData.length} точками данных`);
  
  return (
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3,
        borderRadius: 2,
        boxShadow: '0 4px 12px 0 rgba(0,0,0,0.15)',
        overflowX: 'auto'
      }}
      elevation={3}
    >
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{ 
          fontWeight: 500, 
          color: theme.palette.primary.main,
          mb: 2
        }}
      >
        Количество доставок по дням {filterInfo} ({chartData.length} {chartData.length === 1 ? 'день' : chartData.length < 5 ? 'дня' : 'дней'})
      </Typography>
      
      {/* Дополнительная информация о моделях транспорта */}
      {transportModels.length > 1 && (
        <Typography 
          variant="body2" 
          gutterBottom
          sx={{ 
            mb: 2,
            color: theme.palette.text.secondary
          }}
        >
          Модели транспорта: {transportModels.join(', ')}
        </Typography>
      )}
      
      <Box sx={{ 
        width: '100%', 
        height: 300,
        minWidth: chartData.length > 10 ? 800 : '100%'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme.palette.divider}
            />
            <XAxis 
              dataKey="formattedDate" 
              stroke={theme.palette.text.secondary}
              tick={{ fill: theme.palette.text.secondary }}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              tick={{ fill: theme.palette.text.secondary }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} доставок`, 'Количество']}
              labelFormatter={(label: string) => `Дата: ${label}`}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.divider}`
              }}
              itemStyle={{ color: theme.palette.text.primary }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
            />
            <Legend 
              wrapperStyle={{ color: theme.palette.text.primary }}
            />
            <Bar 
              name="Количество доставок" 
              dataKey="count" 
              fill={theme.palette.secondary.main}
              barSize={30} 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default DeliveryChart; 