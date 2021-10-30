import express from 'express';
import { OutgoingHttpHeaders } from 'http';
import opentracing from "opentracing";
import url from "url";
import jaegerClient, { Logger } from "jaeger-client";
import promClient from 'prom-client'
import {TracingConfig} from '../config/configs'

const buildMiddleware = (tracer: opentracing.Tracer) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const wireCtx = tracer.extract('http_headers', req.headers);
    const pathname = url.parse(req.url).pathname;
    const span = tracer.startSpan(pathname, {childOf: wireCtx});
    span.log({message: "request_received"});


    // include some useful tags on the trace
    span.setTag("http.method", req.method);
    span.setTag("span.kind", "server");
    span.setTag("http.url", req.url);

    // include trace ID in headers so that we can debug slow requests we see in
    // the browser by looking up the trace ID found in response headers
    const responseHeaders: OutgoingHttpHeaders = {};
    tracer.inject(span, 'text_map', responseHeaders);
    Object.keys(responseHeaders).forEach(key => res.setHeader(key, responseHeaders[key]));

    // add the span to the request object for handlers to use
    // Object.assign(req, {span});
    res.locals.span = span

    // finalize the span when the response is completed
    res.on('close', () => {
      span.log({message: "response_closed"});
      span.finish();
    });

    res.on('finish', () => {
      span.log({message: "response_finished"});
      // Route matching often happens after the middleware is run. Try changing the operation name
      // to the route matcher.
      const opName = (req.route && req.route.path) || pathname;
      span.setOperationName(opName);
      span.setTag("http.status_code", res.statusCode);
      if (res.statusCode >= 500) {
        span.setTag("error", true);
        span.setTag("sampling.priority", 1);
      }
    });

    next();
  };
}



const info = (msg: string) => {
  console.info(msg)
}
const error = (msg: string) => {
  console.error(msg)
}
const logger: Logger = {
  info,
  error
}


const createTracer = (config: TracingConfig) => {
  // See schema https://github.com/jaegertracing/jaeger-client-node/blob/master/src/configuration.js#L37

  const metrics = new jaegerClient.PrometheusMetricsFactory(promClient, config.serviceName);
  const internalOptions = {
    tags: {
      'test-my-dual-service.version' : config.serviceVersion,
    },
    logger,
    metrics,
  }

  const finalTracer = jaegerClient.initTracer(config, internalOptions)
  const codec = new jaegerClient.ZipkinB3TextMapCodec({ urlEncoding: true })
  finalTracer.registerInjector('http_headers', codec)
  finalTracer.registerExtractor('http_headers', codec)
  return finalTracer
}

export default {
  createTracer,
  middleware: buildMiddleware
}
