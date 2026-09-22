"use client";

/**
 * Immer freezes produced objects by default. Auth/Apollo data stored via
 * zustand+immer then becomes read-only; React 19 / Recharts mutate internals
 * during updates and throw (e.g. FiberNode.lanes, pendingLanes).
 */
import { setAutoFreeze } from "immer";

setAutoFreeze(false);
