/**
 * @jest-environment node
 */

// Importamos función de mock de Jest
import { jest } from '@jest/globals';

// Hacemos referencia directa al mock de ScheduledNotifications
jest.mock('./ScheduledNotifications/ScheduledNotifications.js');

// Importamos el módulo real
import CronJobs from './CronJobs.js';
// Importamos el mock para poder configurarlo
import ScheduledNotifications from './ScheduledNotifications/ScheduledNotifications.js';

describe('Tests para CronJobs', () => {
  // Mock para console.log
  let consoleLogMock;

  beforeEach(() => {
    // Limpiamos los mocks antes de cada prueba
    jest.clearAllMocks();
    // Creamos un mock para console.log
    consoleLogMock = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    // Restauramos el comportamiento original
    consoleLogMock.mockRestore();
  });

  test('debe llamar a ScheduledNotifications.run con los parámetros correctos', async () => {
    // Preparar el test
    const mockMongoClient = { db: jest.fn() };
    const mockHour = 10;

    // Configurar el mock para que se resuelva exitosamente
    ScheduledNotifications.run.mockResolvedValueOnce();

    // Ejecutar la función que queremos probar
    await CronJobs.run(mockMongoClient, mockHour);

    // Verificar que los métodos se llamaron correctamente
    expect(ScheduledNotifications.run).toHaveBeenCalledTimes(1);
    expect(ScheduledNotifications.run).toHaveBeenCalledWith(mockMongoClient, mockHour);
    expect(consoleLogMock).toHaveBeenCalledWith(
      `[INFO] ScheduledNotifications ejecutado correctamente para la hora: ${mockHour}`
    );
  });

  test('debe manejar los errores correctamente', async () => {
    // Preparar el test
    const mockMongoClient = { db: jest.fn() };
    const mockHour = 10;
    const testError = new Error('Error de prueba');

    // Configurar el mock para que falle
    ScheduledNotifications.run.mockRejectedValueOnce(testError);

    // Ejecutar la función que queremos probar
    await CronJobs.run(mockMongoClient, mockHour);

    // Verificar que se manejó el error correctamente
    expect(ScheduledNotifications.run).toHaveBeenCalledTimes(1);
    expect(consoleLogMock).toHaveBeenCalledWith('[ERROR ScheduledNotifications]');
    expect(consoleLogMock).toHaveBeenCalledWith(testError.message);
  });
});
