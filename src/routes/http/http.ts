import express from "express"
import createError from "http-errors"
import { Span, Tracer } from "opentracing"
import requestId, { RequestId } from "../../middleware/requestId"
import prometheus from "../../middleware/prometheus"
import tracing from "../../middleware/tracing"
import c from "../../middleware/client"


/**
 * HTTP Server Declaration
 * TODO: Investigate Router, Isolate Handler Functions
 */
const buildApp = (app: express.Application, tracer: Tracer) => {
  app.use(prometheus.middleware) // Meters Traffic in this app
  app.use(tracing.middleware(tracer)) // Guarantees Presence of res.local.span
  app.use(requestId.middleware)

  // Define the Http Response Functions
  app.get("/ping", (req, res) => {
    res.send("pong")
  })

  app.get("/health", (req, res) => {
    res.send()
  })

  app.get( "/", ( req, res ) => {
    res.json( { foo: "Hello world!"} )
  } )

  app.get("/hello/:bar", (req, res) => {
    const value = req.params.bar
    const span: Span = res.locals.span
    const span2 = span.tracer().startSpan(
      "Arbitrary Span", {
        childOf : span.context()
      }
    )
    span2.finish()
    res.json({foo: "Hello " + value + "!"})
  })

  app.get("/client/hello/:entry", async (req, res) => {
    const value = req.params.entry
    const span: Span = res.locals.span
    const id: RequestId = res.locals.requestId
    span.setTag("request.id", id)
    const client = c.propagatedClient(id)(span)
    const resp = await client.get("http://localhost:8080/hello/" + value)
    // We actually round trip with our current span! This shows up correctly!
    res.json(resp.data)
  })

  // catch 404 and forward to error handler
  app.use((req, res, next) =>  {
    next(createError(404))
  })

  // error handler -- Types dont work currently
  app.use((err: any, req: express.Request, res: express.Response, next: any) =>  {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}


    // render the error page
    res.status(err.status || 500)
    res.json({level: 'error', error: res.locals.error}) // Probably Need a Different PROD default
  })

  return app
}

export default {
  buildApp
}