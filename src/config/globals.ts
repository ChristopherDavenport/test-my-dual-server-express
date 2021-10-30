import configs, {HttpConfig, ServerConfig} from "./configs"
import express from "express"
import http, { Server } from 'http'
import { JaegerTracer } from "jaeger-client"
import tracing from "../util/tracing"

const onListen = (server: http.Server, port: number, desc: string) => {
  server.on("listening", () => {
    console.log(desc + " Server started at: " + port)
  })
}

const buildServer = (httpConfig: HttpConfig, listener: (express: express.Express) => http.RequestListener) => {
  const httpApplication = express()
  httpApplication.set('port', httpConfig.port)
  const httpServer = http.createServer(listener(httpApplication))
  onListen(httpServer, httpConfig.port, httpConfig.description)
  httpServer.listen(httpConfig.port)
  return httpServer
}

export interface Globals {
  tracer: JaegerTracer,
  httpServerSetup: (listener: (express: express.Express) => http.RequestListener) => http.Server,
  adminServerSetup: (listener: (express: express.Express) => http.RequestListener) => http.Server,
}

const loadGlobals: (config: ServerConfig) => Globals =  (config: ServerConfig) => {
  return {
    tracer: tracing.createTracer(config.tracing),
    httpServerSetup: (listener: (express: express.Express) => http.RequestListener) => buildServer(config.http, listener),
    adminServerSetup: (listener: (express: express.Express) => http.RequestListener) => buildServer(config.admin, listener),
  }
}


export default {
  loadGlobals
}