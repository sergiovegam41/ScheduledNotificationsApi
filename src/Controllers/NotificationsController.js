import http from 'axios';
import { DBNames } from './../db.js';
import moment from "moment";
import ReplaceableWordsController from '../Utils/ReplaceableWordsController.js';
import EmailsController from './EmailsController.js';
import WhatsAppController from './WhatsAppController.js';
import UserConfigController from './UserConfigController.js';
import { ObjectId } from 'mongodb';
import admin from "firebase-admin";

class NotificationsController {

    static async sendNotifyToManyV2(MongoClient, req,res){

        res.send({
            success: true,
            message: "OK"
        })

        await NotificationsController.sendNotifyManyByFilterV2(MongoClient, req.body.municipalities,req.body.professions,req.body.title, req.body.body, req.body.role,req.body.type??"comun")

    }

    static async sendNotifyManyByFilterV2(MongoClient, cities = ["649a034560043e9f434a94fe"], professions = ["64c553e73abc6c0ec50e1dc3"], title = "Hola! $[user_name];! bienvenido a Dservices ", body="Dservices te desea un feliz $[dayWeekName];!", role = "TECNICO", tipo="comun"){

        const FIREBASE_TOKEN = (await MongoClient.collection(DBNames.Config).findOne({ name: "FIREBASE_TOKEN" })).value;
        const TokenWebhook = (await MongoClient.collection(DBNames.Config).findOne({ name: "TokenWebhook" })).value;
        const HostBotWhatsApp = (await MongoClient.collection(DBNames.Config).findOne({ name: "HostBotWhatsApp" })).value;
        const cityObjectIds = cities.map(id => ObjectId(id));

        let citiesDocs = null


        if(cityObjectIds.length > 0){
            citiesDocs = await MongoClient.collection(DBNames.municipalities).find({
                _id: { $in: cityObjectIds }
            }).toArray();
        }else{
            citiesDocs = await MongoClient.collection(DBNames.municipalities).find({ }).toArray();
        }

        if(!citiesDocs){
            return false; 
        }
        
        citiesDocs.forEach( async citie => {
            
            
            let users = await MongoClient.collection(DBNames.technical_workplace).find({ municipality_id: citie._id.toString() }).toArray();
            

            if(!users){
                return false;
            }

            let notifiedUsers = [];

            users.forEach( async user => {
                let userID = parseInt(user.user_id.toString());
                if( !notifiedUsers.includes( userID ) ){
                    const professions_technical_details = await MongoClient.collection(DBNames.professions_technical_details).find({ 
                        active: true, // Solo trae documentos donde active es true
                        technical_id: user.user_id.toString(), 
                        profession_id: { $in: professions ?? [] } 
                    }).toArray(); // # FILTRO DE PROFESIONES VINCULADAS
                  
    
                    if( role == "TECNICO" ){
                        if (professions_technical_details.length > 0) {
    
                            let currentUser = await MongoClient.collection(DBNames.UserCopy).findOne({ id: parseInt(user.user_id) });
                            
                            if(currentUser ){
                                if(currentUser.current_role == role){
                                    
                                    this.notificarByUser(MongoClient,FIREBASE_TOKEN, HostBotWhatsApp, TokenWebhook, currentUser, title, body,tipo, {},true );
    
                                }
                            }
                           
        
                        } 
                    }else if(role == "CLIENTE" ){

                        let currentUser = await MongoClient.collection(DBNames.UserCopy).findOne({ id: parseInt(user.user_id) });
                            
                        if(currentUser ){
                            if(currentUser.current_role == role){
                                
                                this.notificarByUser(MongoClient,FIREBASE_TOKEN, HostBotWhatsApp, TokenWebhook, currentUser, title, body,tipo, {},true );

                            }
                        }

                    }

                    notifiedUsers.push(userID)

                    
                }
                
            })
        });



    }


    static async sendNotifyMany(MongoClient,req,res){
        res.send({
            success: true,
            message: "OK"
        })

   

        await this.sendNotifyManyByFilter(MongoClient, req.body.title, req.body.body,req.body.type, { profession_filter: req.body.profession_filter, delay: 0, unique: false, dayOfWeek:false })

    }

    static async sendNotifyManyByFilter(MongoClient, title, body, tipo = "comun", scheduled_notifications) {


        const FIREBASE_TOKEN = (await MongoClient.collection(DBNames.Config).findOne({ name: "FIREBASE_TOKEN" })).value;


        const now = moment();
        const dayOfWeek = now.day();
        const formattedDate = now.format("YYYY/MM/DD");

        if (!scheduled_notifications.unique) {


            if (scheduled_notifications.dayOfWeek) {

                if (scheduled_notifications.dayOfWeek == dayOfWeek) {

                    await this.notifyAll(MongoClient, scheduled_notifications, FIREBASE_TOKEN, title, body, tipo, dayOfWeek)

                }

            } else {

                await this.notifyAll(MongoClient, scheduled_notifications, FIREBASE_TOKEN, title, body, tipo, dayOfWeek)

            }

        } else {


            if (scheduled_notifications.date == formattedDate) {
                
                await this.notifyAll(MongoClient, scheduled_notifications, FIREBASE_TOKEN, title, body, tipo, dayOfWeek)
                await MongoClient.collection(DBNames.scheduled_notifications).deleteOne({ _id: scheduled_notifications._id })

            }

        }

    }


    static async notifyAll(MongoClient, scheduled_notifications, FIREBASE_TOKEN, title, body, tipo = "comun", dayOfWeek, role = "TECNICO") {

 
        let notifyMeOrders = await MongoClient.collection(DBNames.notifyMeOrders).find({ notyfyMe: true }).toArray()

        let millisegundos = ((parseInt(scheduled_notifications.delay || "0") * 60)) * 1000;

        setTimeout(async () => {


            notifyMeOrders.forEach(async element => {

               try {
                let currentUser = await MongoClient.collection(DBNames.UserCopy).findOne({ id: parseInt(element.userID) });


                if (element.notyfyMe && element.firebase_token && currentUser) {



                    if (scheduled_notifications.profession_filter?.length > 0) {

                        
                        const professions_technical_details = await MongoClient.collection(DBNames.professions_technical_details).find({ technical_id: element.userID.toString(), profession_id: { $in: scheduled_notifications.profession_filter }, active: true }).toArray(); // # FILTRO DE PROFESIONES VINCULADAS
                        
                        if (professions_technical_details.length > 0) {
                            await this.sendNotify(MongoClient, FIREBASE_TOKEN, element.firebase_token, ReplaceableWordsController.replaceByUser(title, currentUser, dayOfWeek), ReplaceableWordsController.replaceByUser(body, currentUser, dayOfWeek), tipo)
                        } else {
                        }

                    } else {

                        await this.sendNotify(MongoClient, FIREBASE_TOKEN, element.firebase_token, ReplaceableWordsController.replaceByUser(title, currentUser, dayOfWeek), ReplaceableWordsController.replaceByUser(body, currentUser, dayOfWeek), tipo)

                    }

                } else {

 
                }
               } catch (error) {
               }
            });

        }, millisegundos);
    }


    static async notificarByUserApi(MongoClient, req, res){


        let userID = req.params.id;
        let title = req.body.title
        let body = req.body.body
        let tipo = req.body.tipo
        let data = req.body.data



        if(userID == "" || userID == null){
            return res.send({
                success:fasle,
                message: "BAD REQUEST",
                data: null
              })
        }

         res.send({
            success:true,
            message: "OK",
            data: null
        })

         
        const FIREBASE_TOKEN = (await MongoClient.collection(DBNames.Config).findOne({ name: "FIREBASE_TOKEN" })).value;
        const TokenWebhook = (await MongoClient.collection(DBNames.Config).findOne({ name: "TokenWebhook" })).value;
        const HostBotWhatsApp = (await MongoClient.collection(DBNames.Config).findOne({ name: "HostBotWhatsApp" })).value;

        let currentUser = await MongoClient.collection(DBNames.UserCopy).findOne({ id: parseInt(userID) });


        return this.notificarByUser(MongoClient,FIREBASE_TOKEN, HostBotWhatsApp, TokenWebhook, currentUser, title, body, tipo, data );


       

    }   

    static async notificarByUser(MongoClient,FIREBASE_TOKEN, HostBotWhatsApp, TokenWebhook, currentUser, title, body, tipo = "comun", dataNotify = {}, onlyPush = false){

        
        
        if(!currentUser){
            return;
        }
        
        let userID = currentUser.id

        try {
            
            const now = moment();
            const dayOfWeek = now.day();
            
            let topic =  ReplaceableWordsController.replaceByUser(title, currentUser, dayOfWeek);
            let msj = ReplaceableWordsController.replaceByUser(body, currentUser, dayOfWeek);

            let dispositivos = await MongoClient.collection(DBNames.notifyMeOrders).find({ notyfyMe: true,userID:  parseInt(userID) }).toArray()
            await dispositivos.forEach(async dispositivo => {

                if(dispositivo.notyfyMe){
                    try {
                        this.sendNotify(MongoClient,FIREBASE_TOKEN, dispositivo.firebase_token, topic, msj, tipo, dataNotify );
                    } catch (error) {
                        
                    }
                }

            })

            if(onlyPush == false){

                let CurrentUserConfig = await UserConfigController.searchOrCreateByUserID(MongoClient,parseInt(userID)) 


                if(CurrentUserConfig.notyfyMeByWhatsApp){
                    WhatsAppController.sendMessageByPhone(HostBotWhatsApp,TokenWebhook,`${currentUser.country_code}${currentUser.phone}`, `*${topic.trim()}*\n${msj}` )
                }
                if(CurrentUserConfig.notyfyMeByEmail){
                    EmailsController.sendMailNotiFy(currentUser.email_aux,topic,msj);
                }

            }
            

        
        } catch (error) {
            

        }

    }

    // static async notifyByEmail(){

    // }

    static async sendNotify(MongoClient, FIREBASE_TOKEN, fcmToken, title, body, tipo = "comun", dataNotify = {}) {
        try {
            
            console.log(fcmToken)
    
            const message = {
                token: fcmToken, // Reemplaza con el token del dispositivo
                notification: {
                  title: title,
                  body: body,
                },
                android: {
                  priority: 'high', // Establece la prioridad aquí para Android
                },
                apns: {
                  headers: {
                    'apns-priority': '10', // Establece la prioridad aquí para iOS
                  },
                },
                data: {
                  click_action: 'FLUTTER_NOTIFICATION_CLICK',
                  body: body,
                  title: title,
                  data: JSON.stringify(dataNotify), // Asegúrate de que sea una cadena JSON
                  tipo: tipo,
                },
              };
    
            // Enviar la notificación a través de Firebase
            admin
            .messaging()
            .send(message)
            .then((response) => {
              console.log('Notificación enviada con éxito:', response); // Imprime la respuesta aquí
            })
            .catch((error) => {
                 MongoClient.collection(DBNames.notifyMeOrders).deleteOne({ firebase_token: fcmToken })
            });
    
        } catch (error) {
            console.error("Error enviando notificación:", error);
        }
    
    
          


    }

}


export default NotificationsController 