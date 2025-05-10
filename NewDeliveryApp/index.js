/**
 * @format
 */

import 'react-native-gesture-handler'; // Этот импорт должен быть самым первым
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Чтение имени приложения из app.json
AppRegistry.registerComponent(appName, () => App);
