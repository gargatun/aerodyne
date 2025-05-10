import { I18n } from 'i18n-js';
import { I18nManager } from 'react-native';

// Импортируем словари для разных языков
import ru from './translations/ru';
import en from './translations/en';

// Создаем экземпляр i18n
const i18n = new I18n({
  en,
  ru
});

// Определяем язык по умолчанию
const defaultLocale = 'ru';

// Устанавливаем язык по умолчанию
i18n.defaultLocale = defaultLocale;
i18n.locale = defaultLocale;

// Настраиваем стиль даты и времени
i18n.missingBehavior = 'guess';
i18n.missingTranslationPrefix = '🤔';
i18n.enableFallback = true;

// Решаем проблемы с RTL для некоторых языков
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

export default i18n; 