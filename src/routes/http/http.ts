import express, { application } from "express"
import createError from "http-errors"
import { Span, Tracer } from "opentracing"
import prometheus from "../../util/prometheus"
import tracing from "../../util/tracing"

/*
  HTTP Server Declaration
*/

const buildApp = (app: express.Application, tracer: Tracer) => {
  // const app = express();
  app.use(prometheus.middleware)
  app.use(tracing.middleware(tracer))

  // Define the Http Response Functions
  app.get("/ping", (req, res) => {
    res.send("pong")
  })

  app.get( "/", ( req, res ) => {
    res.json( { foo: "Hello world!"} );
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

  // catch 404 and forward to error handler
  app.use((req, res, next) =>  {
    next(createError(404));
  });

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