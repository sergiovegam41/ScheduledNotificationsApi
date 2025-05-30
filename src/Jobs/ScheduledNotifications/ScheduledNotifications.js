import NotificationsController from '../../Controllers/NotificationsController.js';
import {DBNames} from './../../db.js';

class ScheduledNotifications {
    static async run(MongoClient, hour, notificationsController = NotificationsController) {
        console.log("hour: ", hour);
        const countries = await MongoClient.collection(DBNames.countries).find({}).toArray();
        for (const country of countries) {
            const countryHour = ScheduledNotifications.#calculateCountryHour(hour, country.offset_utc_timezone);
            const scheduledNotifications = await MongoClient.collection(DBNames.scheduled_notifications)
                .find({hour: countryHour, country_id: country._id.toString()})
                .toArray();
            for (const notification of scheduledNotifications) {
                const allCities = await ScheduledNotifications.#getAllCities(MongoClient, notification.country_id);
                let professionsList = notification.profession_filter;
                if (notification.role === "TECNICO" || !notification.role) {
                    if (!professionsList || professionsList.length === 0) {
                        professionsList = await ScheduledNotifications.#getAllProfessions(MongoClient);
                    }
                }
                await notificationsController.sendNotifyManyByFilterV2(
                    MongoClient,
                    allCities,
                    professionsList,
                    notification.title,
                    notification.description,
                    notification.role,
                    "comun"
                );
            }
        }
    }

    static #calculateCountryHour(hour, offset) {
        let countryHour = (parseInt(hour) - parseInt(offset) + 24) % 24;
        if (countryHour < 0) countryHour += 24;
        return countryHour;
    }

    static async #getAllCities(MongoClient, countryId) {
        const departments = await MongoClient.collection(DBNames.departments).find({countri_id: countryId}).toArray();
        let allCities = [];
        for (const department of departments) {
            const cities = await MongoClient.collection(DBNames.municipalities)
                .find({departament_id: department._id.toString()})
                .toArray();
            const cityIds = cities.map(city => city._id.toString());
            allCities.push(...cityIds);
        }
        return allCities;
    }

    static async #getAllProfessions(MongoClient) {
        const professions = await MongoClient.collection(DBNames.professions).find({}).toArray();
        return professions.map(profession => profession._id.toString());
    }
}

export default ScheduledNotifications;
export {ScheduledNotifications}; // Para testing

