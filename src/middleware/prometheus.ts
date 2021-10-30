import promclient from 'prom-client'
import promBundle from "express-prom-bundle"

// Enable default metrics when this file is read initially
// Not usually important as its enabled automatically when the middlware is invoked
// But if you want metrics before a request is served this is a stopgap
promclient.collectDefaultMetrics()

// Configure Prometheus Middleware
const opts: promBundle.Opts = {
  includeMethod: true,
  includeStatusCode: true,
}
// Invocation here actually binds to the global registry
// So the same metrics cannot be registered more than once.
// If this is moved care needs to be taken with the 2 server
// setup to not double bind with this method.
const middleware = promBundle(opts)

/**
 * Any Routes Applied Before the Middleware is applied will not be metered. Highly recommended then that
 * this is applied before any route modifications are done.
 */
export default {
  middleware,
}