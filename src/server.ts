import express from "express"
import http from 'http';
import adminApp from './routes/admin/admin'
import tracing from './util/tracing';
import httpApp from './routes/http/http'
import configs from "./config/configs";
import { Tracer } from "opentracing";

// Helper Functions
const onListen = (server: http.Server, port: number, desc: string) => {
  server.on("listening", () => {
    console.log(desc + " Server started at: " + port)
  })
}

// Server Setup and Initialization
const runServer = () => {
  const config = configs.loadConfig()
  const tracer = tracing.createTracer(config.tracing)

  // Abstract Server Creation?
  const httpApplication = express()
  httpApplication.set('port', config.http.port)
  const httpServer = http.createServer(httpApp.buildApp(httpApplication, tracer))
  httpServer.listen(config.http.port)
  onListen(httpServer, config.http.port, config.http.description)

  const adminApplication = express()
  adminApplication.set('port', config.admin.port)
  const adminServer = http.createServer(adminApp.buildApp(adminApplication, tracer))
  adminServer.listen(config.admin.port)
  onListen(adminServer, config.admin.port, config.admin.description)
}

export default {
  runServer
}