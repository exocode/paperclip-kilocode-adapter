import type { ServerAdapterModule } from "@paperclipai/adapter-utils";
import { type, models, agentConfigurationDoc } from "../index.js";
import { execute } from "./execute.js";
import { testEnvironment } from "./test.js";
import { sessionCodec } from "./session-codec.js";
import { listKiloModels } from "./models.js";

export function createServerAdapter(): ServerAdapterModule {
  return {
    type,
    execute,
    testEnvironment,
    sessionCodec,
    models,
    listModels: listKiloModels,
    agentConfigurationDoc,
    // Kilo CLI 1.0 can run unattended and does not need Paperclip to synthesize
    // a separate local session JWT contract for the basic local adapter path.
    supportsLocalAgentJwt: false,
  };
}
