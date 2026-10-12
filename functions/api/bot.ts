// Cloudflare Pages Function: /api/bot
import worker, { Env } from '../../workers/telegram-bot/src/index';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
  data: Record<string, any>;
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  return worker.fetch(context.request, context.env);
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  return worker.fetch(context.request, context.env);
}

export async function onRequestOptions(context: PagesContext): Promise<Response> {
  return worker.fetch(context.request, context.env);
}
