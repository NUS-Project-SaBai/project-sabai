import { z } from "zod";

/**
 * Shared, dependency-free validation primitives for eyesight fields,
 * safe to import on both server and client. Request-shape schemas live in the
 * router.
 * 
 * Per clinic SOP: Snellen fractions 6/6..6/120 (6m tumbling-E chart) with an
 * optional "+N" for N letters read on the next line (e.g. "6/9 +2"), plus the
 * low-vision codes CF (counting fingers), HM (hand movement),
 * LP (light perception), NLP (no light perception).
 */

const ACUITY_PATTERN =
  "6\\/(6|9|12|18|24|36|60|120)(\\s*\\+\\d{1,2})?|CF|HM|LP|NLP";

/** Visual acuity (degree) fields. Case-insensitive. */
export const VISUAL_ACUITY_REGEX = new RegExp(`^(${ACUITY_PATTERN})$`, "i");

/** Pinhole fields: acuity values plus "NI" (no improvement). Case-insensitive. */
export const PINHOLE_REGEX = new RegExp(`^(${ACUITY_PATTERN}|NI)$`, "i");

// Optional, trimmed string field; empty string means "not recorded".
const optionalField = (regex: RegExp, message: string) =>
  z.string().trim().regex(regex, message).or(z.literal("")).optional();

export const visualAcuitySchema = optionalField(
  VISUAL_ACUITY_REGEX,
  "Must be VA notation (e.g. 6/9, 6/9 +2, 6/120) or CF, HM, LP, NLP",
);

export const pinholeSchema = optionalField(
  PINHOLE_REGEX,
  "Must be VA notation (e.g. 6/9, 6/9 +2, 6/120), CF, HM, LP, NLP, or NI",
);
