import express from "express"
import {v4 as uuidv4} from "uuid" // Assumption of default export can end in unitialization.
// Uncertain how to tell ahead of time, but this explains things I've found a couple times now.

/**
 * Add A Unique Request Id to each incomming request. 
 */
const middleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const id = req.headers['X-Request-Id'] || req.headers['x-request-id'] || uuidv4().replace(/-/g, '')
    res.locals.requestId = id
    res.setHeader("X-Request-Id", id)
    next()
  } catch(eUntyped) {
    const e: Error = eUntyped
    console.log(e)
    next(e)
  }
}

export type RequestId = string


export default {
  middleware
}