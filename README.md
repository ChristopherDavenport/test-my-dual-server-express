# Test-My-Dual-Server Express

Playing around with setting up a dual server with express.

Includes

- `./src/admin/prometheus.ts` - Integrations for Prometheus Metrics
- `./src/admin/admin.ts` - Express Server that runs on `PORT1` defaulting to 8081. Serves `/`, `/metrics`, `/ping`, `/health`
- `./src/http.ts` - Express Server that runs on `PORT0` defaulting to 8080. This is where one should instantiate application behavior.