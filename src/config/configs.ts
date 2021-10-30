import { env } from 'process'

export interface ServerConfig {
  http: HttpConfig,
  admin: HttpConfig,
  tracing: TracingConfig,
}

export interface HttpConfig {
  port: number
  description: string
}

// This Config is specificically named so it can be passed to jaeger succesfully.
// Consider a seperate internal type there in the future.
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

const loadTraceConfig: () => TracingConfig = () => {
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

const loadConfig: () => ServerConfig = () => {
  return {
    http: {
      port: parseInt("PORT0", 10) || 8080,
      description: 'Http'
    },
    admin: {
      port: parseInt("PORT1", 10) || 8081,
      description: 'Admin'
    },
    tracing: loadTraceConfig()
  }
}

export default {
  loadConfig
}