import { ScheduledNotifications } from './ScheduledNotifications.js';

const mockMongoClient = {
  collection: jest.fn()
};

const mockNotificationsController = {
  sendNotifyManyByFilterV2: jest.fn().mockResolvedValue(true)
};

describe('ScheduledNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe enviar notificaciones programadas para cada país y notificación', async () => {
    // Mock de datos - Sólo un país para simplificar el test
    const countries = [
      { _id: '1', offset_utc_timezone: 0 }
    ];
    const scheduledNotifications = [
      {
        country_id: '1',
        profession_filter: ['a'],
        title: 't',
        description: 'd',
        role: 'TECNICO'
      }
    ];
    const departments = [{ _id: 'dep1' }];
    const cities = [{ _id: 'city1' }];
    const professions = [{ _id: 'prof1' }];

    // Configuración de mocks
    mockMongoClient.collection.mockImplementation((name) => {
      switch (name) {
        case 'countries':
          return { find: () => ({ toArray: () => countries }) };
        case 'scheduled_notifications':
          return { find: () => ({ toArray: () => scheduledNotifications }) };
        case 'departments':
          return { find: () => ({ toArray: () => departments }) };
        case 'municipalities':
          return { find: () => ({ toArray: () => cities }) };
        case 'professions':
          return { find: () => ({ toArray: () => professions }) };
        default:
          return { find: () => ({ toArray: () => [] }) };
      }
    });

    await ScheduledNotifications.run(mockMongoClient, 10, mockNotificationsController);

    // Verificamos que sendNotifyManyByFilterV2 se llame exactamente una vez
    expect(mockNotificationsController.sendNotifyManyByFilterV2).toHaveBeenCalledTimes(1);

    // Verificamos que se llame con los parámetros correctos
    expect(mockNotificationsController.sendNotifyManyByFilterV2).toHaveBeenCalledWith(
      mockMongoClient,
      ['city1'],
      ['a'],
      't',
      'd',
      'TECNICO',
      'comun'
    );
  });

  it('debe calcular correctamente la hora del país según el offset', async () => {
    // Esta prueba verifica indirectamente el cálculo de horas
    // probando que las notificaciones se buscan con la hora correcta
    const testHour = 10;
    const testOffset = 2;
    const expectedCountryHour = 8; // 10 - 2 = 8

    const testCountry = { _id: 'test', offset_utc_timezone: testOffset };

    // Spy en el método find para verificar los parámetros
    const findSpy = jest.fn().mockReturnValue({ toArray: () => [] });

    mockMongoClient.collection.mockImplementation((name) => {
      if (name === 'countries') {
        return { find: () => ({ toArray: () => [testCountry] }) };
      }
      if (name === 'scheduled_notifications') {
        return { find: findSpy };
      }
      return { find: () => ({ toArray: () => [] }) };
    });

    await ScheduledNotifications.run(mockMongoClient, testHour, mockNotificationsController);

    // Verificamos que scheduled_notifications.find se llamó con la hora correcta
    expect(findSpy).toHaveBeenCalledWith({
      hour: expectedCountryHour,
      country_id: testCountry._id.toString()
    });
  });
});
