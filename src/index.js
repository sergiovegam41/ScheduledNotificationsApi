import app  from './app.js';
// import { Server as WebSocketServer } from 'socket.io';
import http from 'http';
import { connectDB } from './db.js';
// import sockets from './sockets.js';
import routes from './route.js';
import { PORT,MONGODB_NAME } from './config.js';
import admin from "firebase-admin";
import { DBNames } from './db.js';

( async ()=>{
    
    await connectDB(function(Mongoclient){

        var MongoClient = Mongoclient.db(MONGODB_NAME);
        console.log( "mongodb connect to " + MONGODB_NAME )

        routes(app,MongoClient)
        
        const server = http.createServer(app)

        
        
        const httpServer = server.listen(PORT,'0.0.0.0',async () => {
            
            console.log("Server runing in port "+PORT)


            // Verificar si Firebase ya está inicializado
            if (!admin.apps.length) {
                
                // Obtener las credenciales de Firebase desde la base de datos MongoDB
                let credentials = (
                    await MongoClient.collection(DBNames.Config).findOne({
                        name: "FIREBASE_CREDENTIALS",
                    })
                ).value;
    
                // Convertir las credenciales de JSON a objeto
                credentials = JSON.parse(credentials);
    
                // Inicializar Firebase si aún no ha sido inicializado
                admin.initializeApp({
                    credential: admin.credential.cert(credentials),
                });
    
                console.log("Firebase inicializado correctamente");
            } else {
                console.log("Firebase ya estaba inicializado.");
            }
            
            // const io = new WebSocketServer(httpServer, {
            //     cors: {
            //     origin:"*"
            // }})

            // sockets(io,MongoClient)

        })

    })

} )();

