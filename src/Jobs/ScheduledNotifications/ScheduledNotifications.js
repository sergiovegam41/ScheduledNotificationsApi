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

            // console.log("countrieHour: "+countrieHour)
            
            let scheduled_notifications = await MongoClient.collection(DBNames.scheduled_notifications).find({ hour:countrieHour, country_id:countrie._id.toString() }).toArray();
            
            // console.log(scheduled_notifications)
            
            for (let element of scheduled_notifications ) {
                
                
                let AllCities = []
                let departments = await MongoClient.collection(DBNames.departments).find({ countri_id: element.country_id}).toArray();
                
                
                for (let departament of departments ) {
                    
                    let cities = await MongoClient.collection(DBNames.municipalities).find({ departament_id: departament._id.toString()}).toArray();
                    let cityIds = cities.map(city => city._id.toString()); // Transforma cada ciudad a su ID en formato string
                    AllCities.push(...cityIds); 
                }

                let profesionsList = element.profession_filter;

                if(element.role == "TECNICO" || element.role == null || element.role == ""){

                    if( profesionsList == null || profesionsList == [] || profesionsList == ""){
                        let professions = await MongoClient.collection(DBNames.professions).find({}).toArray();
                        profesionsList = professions.map(profession => profession._id.toString());
                    }
                    
                }
                
                
                await NotificationsController.sendNotifyManyByFilterV2(MongoClient, AllCities, profesionsList, element.title, element.description, element.role,"comun")
                
            };
            
        };


        

    }
 
}

export default ScheduledNotifications 