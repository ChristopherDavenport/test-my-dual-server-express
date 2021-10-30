import express from "express";
import createError from "http-errors";
import prometheus from "./prometheus";
import tracing from "./tracing";

/*
  Health Server Declaration
*/

export const port: number = parseInt("PORT1", 10) || 8081

const buildApp = () => {
  const app = express()
  app.set('port', port)

  app.use(tracing.default.middleware)
  // Only Run This Middleware on Admin App to serve metrics calls
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
    next(createError(404));
  });

  app.use((err: any, req: express.Request, res: express.Response, next: any) =>  {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json({level: 'error', err});
  });
  return app
}

export default {
  buildApp,
  port,
  description: 'Admin'
}