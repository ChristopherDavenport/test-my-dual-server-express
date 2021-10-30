import express from "express"
import createError from "http-errors"
import { Tracer } from "opentracing"
import prometheus from "../../middleware/prometheus"
import tracing from "../../middleware/tracing"

/*
  Health Server Declaration
*/

const buildApp = (app: express.Application, tracer: Tracer) => {
  app.use(tracing.middleware(tracer))
  // Only Run This Middleware on Admin App to serve metrics calls
  // Ensures other endpoints on admin don't trigger metrics
  // which would get confusing for the http metrics.
  app.get('/metrics', async (req, res, next) => {
    prometheus.middleware(req, res, next)
  })

  app.get("/ping", (req, res) => {
    res.send("pong")
  })

  app.get("/health", (req, res) => {
    res.send()
  })

  app.get("/", (req, res) => {
    res.set('Content-Type', 'text/html')
    res.send(Buffer.from(`
    <html><h2><ul>
    <li><a href=\"/ping\">Ping</a></li>
      <li><a href=\"/metrics\">Metrics</a></li>
      <li><a href=\"/health\">Health</a></li>
    </ul></h2></html>
  `))
  })

  // catch 404 and forward to error handler
  app.use((req, res, next) =>  {
    next(createError(404))
  })

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) =>  {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.json({level: 'error', err})
  })
  return app
}

export default {
  buildApp
}