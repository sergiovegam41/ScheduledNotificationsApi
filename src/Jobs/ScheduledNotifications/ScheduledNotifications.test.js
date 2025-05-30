import { ScheduledNotifications } from './ScheduledNotifications.js';

const mockMongoClient = {
  collection: jest.fn()
};

const mockNotificationsController = {
  sendNotifyManyByFilterV2: jest.fn()
};

describe('ScheduledNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe enviar notificaciones programadas para cada país y notificación', async () => {
    // Mock de datos
    const countries = [
      { _id: '1', offset_utc_timezone: 0 },
      { _id: '2', offset_utc_timezone: 2 }
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

    expect(mockNotificationsController.sendNotifyManyByFilterV2).toHaveBeenCalled();
  });
});

