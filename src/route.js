import CronJobs from './Jobs/CronJobs.js';
import moment from "moment";
import cron from 'node-cron';
import SessionsController from './Controllers/SessionsController.js';
import NotificationsController from './Controllers/NotificationsController.js';

export default (app, MongoClient) => {

  app.post('/sendNotifyMany',validationMiddleware,  async (req, res) => NotificationsController.sendNotifyMany(MongoClient,req,res))
  app.post('/sendNotifyToManyV2',validationMiddleware,  async (req, res) => NotificationsController.sendNotifyToManyV2(MongoClient,req,res))
  app.post('/notifyByUserID/:id',  validationMiddleware ,async (req, res) => NotificationsController.notificarByUserApi(MongoClient,req,res))
  
  app.get('/ping', async function (req, res) {
    return res.send(true)
  })

  async function validationMiddleware(req, res, next) {

    console.log("validationMiddleware");
    
    try {
      
      let session = await SessionsController.getCurrentSession(MongoClient, req)
      if (session) {
        return next()
      }
    } catch (error) {
      return res.status(404).send('BAD_REQUEST');
    }
    return res.status(404).send('BAD_REQUEST');
  }
  let formattedTime = parseInt(moment.utc().startOf('day').local().format('H'))
  let UTCRangeTimeInvert = []

  for ( let i = 0; i <= 23 ; i++ ){

    if(formattedTime > 23){
      formattedTime = 0;
    }

    UTCRangeTimeInvert[i] = {formattedTime,utc_hour:i};
    formattedTime++;

  }
  
  // console.log(UTCRangeTimeInvert);
  UTCRangeTimeInvert.forEach(function(valor, clave) {
    
    cron.schedule(`0 ${valor.formattedTime} * * *`, () => {


      CronJobs.run(MongoClient,valor.utc_hour)

    });
  });


  async function validationMiddleware(req, res, next) {
    try {
      let session = await SessionsController.getCurrentSession(MongoClient, req)
      if (session) {
        return next()
      }
    } catch (error) {
      return res.status(404).send('BAD_REQUEST');
    }
    return res.status(404).send('BAD_REQUEST');
  }


 
}


