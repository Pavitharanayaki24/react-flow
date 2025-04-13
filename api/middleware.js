import { z, ZodError } from 'zod';

export async function validateRFQueryParams(req, res, next) {
  try {
    const json = await jsonQueryParam.parseAsync(req.query.json);
    const flow = await flowQueryParams.parseAsync(JSON.parse(json));
    res.locals.flow = flow;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).send({ msg: error.issues[0].message });
    }
    return res.status(500).send('Server error');
  }
}

export async function validateRFJsonBody(req, res, next) {
  try {
    const flow = await flowQueryParams.parseAsync(req.body);
    res.locals.flow = flow;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).send({ msg: error.issues[0].message });
    }
    return res.status(500).send('Server error');
  }
}

const flowQueryParams = z.object({
  width: z.number(),
  height: z.number(),
  title: z.optional(z.string()),
  subtitle: z.optional(z.string()),
  position: z.union([
    z.literal('top-left'),
    z.literal('top-right'),
    z.literal('bottom-left'),
    z.literal('bottom-right'),
  ]),
  font: z.optional(z.string()),
  type: z.union([z.literal('html'), z.literal('png'), z.literal('jpg')]),
  nodes: z.array(
    z.object({
      id: z.string({ required_error: "Node 'id' is required" }),
      position: z.object(
        {
          x: z.number({ required_error: "Node 'position.x' is required" }),
          y: z.number({ required_error: "Node 'position.y' is required" }),
        },
        { required_error: "Node 'position' is required" }
      ),
      width: z.number({ required_error: "Node 'width' is required" }),
      height: z.number({ required_error: "Node 'height' is required" }),
    })
  ),
  edges: z
    .array(
      z.object({
        id: z.string({ required_error: "Edge 'id' is required" }),
        source: z.string({ required_error: "Edge 'source' is required" }),
        target: z.string({ required_error: "Edge 'target' is required" }),
        sourceHandle: z.string().optional(),
        targetHandle: z.string().optional(),
      })
    )
    .optional(),
});

const jsonQueryParam = z.string({
  required_error: "Query param 'json' is required",
}); 