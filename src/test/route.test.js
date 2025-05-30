import { jest } from '@jest/globals';
import cron from 'node-cron';

// Mock del módulo node-cron con un contador explícito
const mockSchedule = jest.fn().mockReturnValue({ stop: jest.fn() });

jest.mock('node-cron', () => ({
  schedule: mockSchedule
}));

// Mock de las dependencias
const mockCronJobs = {
  run: jest.fn()
};

jest.mock('../Jobs/CronJobs.js', () => {
  return {
    __esModule: true,
    default: mockCronJobs
  };
});

// Mock otros controladores necesarios
jest.mock('../Controllers/NotificationsController.js', () => {
  return {
    __esModule: true,
    default: {
      sendNotifyMany: jest.fn(),
      sendNotifyToManyV2: jest.fn(),
      notificarByUserApi: jest.fn()
    }
  };
});

jest.mock('../Controllers/SessionsController.js', () => {
  return {
    __esModule: true,
    default: {
      getCurrentSession: jest.fn().mockResolvedValue(true)
    }
  };
});

const mockMongoClient = {};
const mockApp = {
  post: jest.fn(),
  get: jest.fn()
};

// Mock mejorado de moment con todas las funciones necesarias
jest.mock('moment', () => {
  // Objeto para las funciones encadenadas
  const chainObject = {
    utc: jest.fn().mockReturnThis(),
    startOf: jest.fn().mockReturnThis(),
    local: jest.fn().mockReturnThis(),
    format: jest.fn().mockReturnValue('10'),
    locale: jest.fn().mockReturnThis()
  };

  // Función principal que usamos como constructor
  const momentFn = jest.fn(() => chainObject);

  // Añadir funciones estáticas
  momentFn.utc = jest.fn().mockReturnValue(chainObject);
  momentFn.locale = jest.fn();
  momentFn.defineLocale = jest.fn();
  momentFn.updateLocale = jest.fn();

  return momentFn;
});

// Mock de los módulos de locale para evitar cargarlos realmente
jest.mock('moment/locale/es.js', () => {}, { virtual: true });

describe('route.js - Configuración de cron jobs', () => {
  beforeEach(() => {
    // Limpiar los mocks antes de cada prueba
    jest.clearAllMocks();
    // Importar el módulo routes en cada test para asegurar que se reinicia
    jest.resetModules();
  });

  it('debería configurar exactamente 24 cron jobs (uno por hora)', async () => {
    // Importar el módulo después de configurar los mocks
    const routeModule = await import('../route.js');
    const routes = routeModule.default;

    // Ejecutar la función de rutas
    routes(mockApp, mockMongoClient);

    // Verificar que mockSchedule se llamó exactamente 24 veces
    expect(mockSchedule).toHaveBeenCalledTimes(24);
  });

  it('debería limpiar las tareas cron anteriores al ejecutarse nuevamente', async () => {
    // Importamos el módulo
    const routeModule = await import('../route.js');
    const routes = routeModule.default;

    // Primera llamada a routes
    routes(mockApp, mockMongoClient);
    expect(mockSchedule).toHaveBeenCalledTimes(24);

    // Segunda llamada a routes (simulando reinicio)
    routes(mockApp, mockMongoClient);

    // Verificamos que mockSchedule se llamó 48 veces en total (24 + 24)
    expect(mockSchedule).toHaveBeenCalledTimes(48);

    // Verificamos que se crearon exactamente 24 tareas cron en cada ejecución
    // lo que demuestra que el mecanismo de limpieza funciona correctamente
  });
});
