import express, { application } from "express";
import createError from "http-errors";
import prometheus from "./admin/prometheus";

/*
  HTTP Server Declaration
*/
const port = parseInt("PORT0", 10) || 8080;

const buildApp = () => {
  const app = express();
  app.set('port', port)
  app.use(prometheus.middleware)

  // Define the Http Response Functions
  app.get("/ping", (req, res) => {
    res.send("pong")
  })

  app.get( "/", ( req, res ) => {
    res.json( { foo: "Hello world!"} );
  } );

  app.get("/hello/:bar", (req, res) => {
    const value = req.params.bar
    res.json({foo: "Hello " + value + "!"})
  })

  // catch 404 and forward to error handler
  app.use((req, res, next) =>  {
    next(createError(404));
  });

  // error handler -- Types dont work currently
  app.use((err: any, req: express.Request, res: express.Response, next: any) =>  {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  return app
}

export default {
  buildApp,
  port,
  description: 'Http'
}