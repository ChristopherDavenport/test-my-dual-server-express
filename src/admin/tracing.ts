import express from 'express';
import { OutgoingHttpHeaders } from 'http';
import opentracing from "opentracing";
import url from "url";
import jaegerClient, { Logger } from "jaeger-client";
import promClient from 'prom-client'
import { env } from 'process';

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



export interface TracingConfig {
  serviceName: string,
  serviceVersion: string,
  sampler: {
    type: string,
    param: number,
    hostPort: string
  },
  reporter: {
    agentHost: string,
    agentPort: number
  }
}

const loadConfig: () => TracingConfig = () => {
  return {
    serviceName: (env.APP_NAME || 'test_my_dual_service').replace(/-/g, '_'), // Can't use `-`
    serviceVersion: env.APP_VERSION || '0.0.0',
    sampler: {
      type: process.env.JAEGER_SAMPLER_TYPE || 'remote',
      param: parseInt(process.env.JAEGER_SAMPLER_PARAM, 10) || 1,
      hostPort: process.env.JAEGER_SAMPLER_MANAGER_HOST_PORT || 'http://localhost:5778/sampling'
    },
    reporter: {
      agentHost: process.env.JAEGER_AGENT_HOST || '',
      agentPort: parseInt(process.env.JAEGER_AGENT_PORT, 10) || 6832
    }
  }
}

const createTracing = (config: TracingConfig) => {
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

  const middleware = buildMiddleware(finalTracer)
  return {
    middleware,
    closeTracer: finalTracer.close
  }

}

const defaultTracing = () => {
  return createTracing(loadConfig())
}

export default {
  loadConfig,
  createTracing,
  defaultTracing,
  default: defaultTracing()
}
