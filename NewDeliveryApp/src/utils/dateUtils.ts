/**
 * Форматирует дату в формат дд.мм.гггг
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}.${month}.${year}`;
};

/**
 * Форматирует дату и время в формат дд.мм.гггг чч:мм
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

/**
 * Возвращает относительную дату (сегодня, вчера, и т.д.)
 */
export const getRelativeDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const diffTime = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Сегодня';
  } else if (diffDays === 1) {
    return 'Вчера';
  } else if (diffDays <= 7) {
    return `${diffDays} дн. назад`;
  } else {
    return formatDate(d);
  }
}; 