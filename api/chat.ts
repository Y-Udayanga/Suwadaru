import type { IncomingMessage, ServerResponse } from 'node:http'
import { chatHandler } from '../server/chat.ts'
export default function handler(req: IncomingMessage, res: ServerResponse) { return chatHandler(req, res) }
