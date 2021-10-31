import axios, {Axios} from "axios";
import {Span, FORMAT_HTTP_HEADERS} from "opentracing";
import {RequestId} from "../middleware/requestId";

const propagatedClient : (id: RequestId) => (span: Span) => Axios = (id) => (span) => {
  const tracer = span.tracer()
  const reqHeaders = {
    "X-Request-Id": id
  }
  tracer.inject(span, FORMAT_HTTP_HEADERS, reqHeaders)
  return axios.create({
    headers: reqHeaders
  })
}

export type SpannedClient = (span: Span) => Axios

export default {
  propagatedClient
}