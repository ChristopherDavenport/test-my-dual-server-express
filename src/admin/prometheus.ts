import promclient from 'prom-client'
import promBundle from "express-prom-bundle"

// Enable default metrics when this file is read initially
promclient.collectDefaultMetrics();

// Configure Prometheus Middleware
const opts: promBundle.Opts = {includeMethod: true}
const middleware = promBundle(opts)

export default {
  middleware
}