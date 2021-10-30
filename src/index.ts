import { prototype } from 'events';
import http from 'http';
import adminApp from './admin/admin'
import httpApp from './http'

// Helper Functions
const onListen = (server: http.Server, port: number, desc: string) => {
  server.on("listening", () => {
    console.log(desc + " Server started at: " + port)
  })
}

// Server Setup and Initialization
const httpServer = http.createServer(httpApp.buildApp())
httpServer.listen(httpApp.port)
onListen(httpServer, httpApp.port, httpApp.description)


const adminServer = http.createServer(adminApp.buildApp())
adminServer.listen(adminApp.port)
onListen(adminServer, adminApp.port, httpApp.description)
