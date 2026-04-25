import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'

// Глобальное логирование всех запросов
axios.interceptors.request.use(
  (config) => {
    console.log('[AXIOS REQ]', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('[AXIOS REQ ERR]', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log('[AXIOS RES]', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('[AXIOS RES ERR]', error.response?.status, error.config?.url, error.message);
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')!).render(
  <App />,
)
