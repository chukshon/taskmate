import type { Request, RequestHandler } from "express";
import { z } from "zod";

export type RequestValidationSchema = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

export type ValidatedLocals<S extends RequestValidationSchema> = {
  validated: z.output<z.ZodObject<S>>;
};

export type ValidatedHandler<S extends RequestValidationSchema> =
  RequestHandler<
    Request["params"],
    unknown,
    unknown,
    Request["query"],
    ValidatedLocals<S>
  >;

export function validateRequest<S extends RequestValidationSchema>(
  schemas: S,
): ValidatedHandler<S> {
  const requestSchema = z.object(schemas);

  return async (req, res, next) => {
    try {
      res.locals.validated = await requestSchema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
}
