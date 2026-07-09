import { ZodSchema } from "zod";
import type { NextRequest } from "next/server";
import { ValidationError } from "@/lib/errors";

export async function parseJSON<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError("Invalid JSON body");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    throw new ValidationError("Validation failed", { details });
  }

  return result.data;
}
