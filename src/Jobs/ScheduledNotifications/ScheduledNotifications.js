import NotificationsController from '../../Controllers/NotificationsController.js';
import { DBNames } from './../../db.js';
// import axios from 'axios';

class ScheduledNotifications {

    static async run(MongoClient, hour){

        console.log("hour: ",hour)

        let countries = await MongoClient.collection(DBNames.countries).find({}).toArray()

        for (let countrie of countries ) {

           let countrieHour = (parseInt(hour) - parseInt(countrie.offset_utc_timezone) + 24) % 24;
            if (countrieHour < 0) {
                countrieHour += 24;
            }

            let scheduled_notifications = await MongoClient.collection(DBNames.scheduled_notifications).find({ hour:countrieHour, country_id:countrie._id.toString() }).toArray();

            
            for (let element of scheduled_notifications ) {
                
                
                // static async sendNotifyManyByFilterV2(MongoClient, cities = ["649a034560043e9f434a94fe"], professions = ["64c553e73abc6c0ec50e1dc3"], title = "Hola! $[user_name];! bienvenido a Dservices ", body="Dservices te desea un feliz $[dayWeekName];!", role = "TECNICO", tipo="comun"){
                let AllCities = []
                let departments = await MongoClient.collection(DBNames.departments).find({ countri_id: element.country_id}).toArray();
                    
                    
                for (let departament of departments ) {

                    let cities = await MongoClient.collection(DBNames.cities).find({ departament_id: departament._id.toString()}).toArray();
                    AllCities.push(...cities);
                }


               await NotificationsController.sendNotifyManyByFilterV2(MongoClient, AllCities, element.profession_filter, element.title, element.description,element.title, element.role??"TECNICO",tipo="comun")
            //    await NotificationsController.sendNotifyManyByFilter(MongoClient,element.title,element.description,"comun",element)
                
            };
            
        };


        

    }
 
}

export default ScheduledNotifications 