import type { TranscriptEntry } from "@paperclipai/adapter-utils";
/**
 * Parse a Kilo CLI stdout line into Paperclip transcript entries.
 *
 * This module is intentionally self-contained because Paperclip reads the
 * source text and evaluates it in the UI runtime. Avoid imports beyond the
 * shared type-only contract.
 */
export declare function parseKiloStdoutLine(line: string, ts: string): TranscriptEntry[];
//# sourceMappingURL=ui-parser.d.ts.map