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
                
                
                let AllCities = []
                let departments = await MongoClient.collection(DBNames.departments).find({ countri_id: element.country_id}).toArray();
                
                
                for (let departament of departments ) {
                    
                    let cities = await MongoClient.collection(DBNames.municipalities).find({ departament_id: departament._id.toString()}).toArray();
                    let cityIds = cities.map(city => city._id.toString()); // Transforma cada ciudad a su ID en formato string
                    AllCities.push(...cityIds); 
                }
                
                
                // static async sendNotifyManyByFilterV2(MongoClient, cities = ["649a034560043e9f434a94fe"], professions = ["64c553e73abc6c0ec50e1dc3"], title = "Hola! $[user_name];! bienvenido a Dservices ", body="Dservices te desea un feliz $[dayWeekName];!", role = "TECNICO", tipo="comun"){
                    // await NotificationsController.sendNotifyManyByFilterV2(MongoClient,req,[session.location.municipality_id],[form.professions_id],`Nuevo servicio ${parseInt(priceService)>0?"~ "+cantidadFormateada: ""}`, `Hola $[user_name];, tenemos un Nuevo servicio disponible para ti ${main_address.value.district != ""?"en "+main_address.value.district:""}`, "TECNICO","new_services")
                    console.log(AllCities);
                    console.log(element.profession_filter);
                    console.log(element.title);
                    console.log(element.description);
                    console.log(element.title);
                    console.log("comun");
               
                    await NotificationsController.sendNotifyManyByFilterV2(MongoClient, AllCities, element.profession_filter, element.title, element.description, element.role,"comun")
            //    await NotificationsController.sendNotifyManyByFilter(MongoClient,element.title,element.description,"comun",element)
                
            };
            
        };


        

    }
 
}

export default ScheduledNotifications 