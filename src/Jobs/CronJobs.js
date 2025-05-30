import ScheduledNotifications from './ScheduledNotifications/ScheduledNotifications.js';

class CronJobs {
    static async run(MongoClient, hour) {
        try {
            // Añadimos el await para esperar a que termine la ejecución
            await ScheduledNotifications.run(MongoClient, hour);
            console.log(`[INFO] ScheduledNotifications ejecutado correctamente para la hora: ${hour}`);
        } catch (error) {
            console.log("[ERROR ScheduledNotifications]");
            console.log(error.message || error);
        }
    }
}

export default CronJobs;

