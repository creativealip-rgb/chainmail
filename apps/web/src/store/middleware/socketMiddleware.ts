/**
 * Socket.IO middleware stub — W5.5 will wire up real WS push.
 * For now, this is a no-op that just passes actions through.
 */
import type { Middleware } from "@reduxjs/toolkit";

export const socketMiddleware: Middleware = () => (next) => (action) => {
  return next(action);
};
