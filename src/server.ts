import http from 'http'
import adminApp from './routes/admin/admin'
import httpApp from './routes/http/http'
import configs, { ServerConfig } from "./config/configs"
import { JaegerTracer } from "jaeger-client"
import globals from "./config/globals"
import { iLogger } from './util/loggerGen'

// Helper Functions

const shutdownServers = (httpServer: http.Server, adminServer: http.Server, tracer: JaegerTracer) => {
  process.on('SIGTERM', () => {
    iLogger.info('SIGTERM Sent')
    adminServer.close(() => {
      iLogger.info('Admin server closed')
    })
    httpServer.close(() => {
      iLogger.info('HTTP server closed')
      tracer.close()
    })
  })
  process.on('SIGINT', () => {
    iLogger.info('SIGINT Sent')
    adminServer.close(() => {
      iLogger.info('Admin server closed')
    })
    httpServer.close(() => {
      tracer.close()
      iLogger.info("Tracer closed")
      iLogger.info('HTTP server closed')
    })
  })
}

/**
 * This is primary execution and setup process for the server setup.
 * Configurations are loaded,
 * Globals from Configs Loaded,
 * Supplementary Components Built
 * Servers are Initialized
 *
 * All Dependencies are managed via explicit
 */
const runServer = () => {
  const config: ServerConfig = configs.loadConfig()
  const {
    tracer,
    httpServerSetup,
    adminServerSetup
  } = globals.loadGlobals(config)

  const httpServer = httpServerSetup(exp => httpApp.buildApp(exp, tracer))
  const adminServer = adminServerSetup(exp => adminApp.buildApp(exp, tracer))

  shutdownServers(httpServer, adminServer, tracer)
}

export default {
  runServer
}