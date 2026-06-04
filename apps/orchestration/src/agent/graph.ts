import { builder } from '../graph/graph.js';
import { checkpointer } from '../db/checkpointer.js';

await checkpointer.setup();

export const graph = builder.compile({ checkpointer });
graph.name = 'Agenvik Chat Agent';
