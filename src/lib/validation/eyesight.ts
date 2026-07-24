import { z } from "zod";

/**
 * Shared, dependency-free validation primitives for eyesight fields,
 * safe to import on both server and client. Request-shape schemas live in the
 * router.
 */

// Snellen fractions (6/6..6/60, optional +/- suffix) plus low-vision codes: CF (counting fingers), HM (hand motion), PL/NPL (perception of light).
const ACUITY_PATTERN = "6\\/(6|9|12|18|24|36|60)[+-]?|CF|HM|PL|NPL";

/** Visual acuity (degree) fields. Case-insensitive. */
export const VISUAL_ACUITY_REGEX = new RegExp(`^(${ACUITY_PATTERN})$`, "i");

/** Pinhole fields: acuity values plus "NI" (no improvement). Case-insensitive. */
export const PINHOLE_REGEX = new RegExp(`^(${ACUITY_PATTERN}|NI)$`, "i");

// Optional, trimmed string field; empty string means "not recorded".
const optionalField = (regex: RegExp, message: string) =>
  z.string().trim().regex(regex, message).or(z.literal("")).optional();

export const visualAcuitySchema = optionalField(
  VISUAL_ACUITY_REGEX,
  "Must be Snellen notation (e.g. 6/6, 6/12) or CF, HM, PL, NPL",
);

export const pinholeSchema = optionalField(
  PINHOLE_REGEX,
  "Must be Snellen notation (e.g. 6/6, 6/12), CF, HM, PL, NPL, or NI",
);
