import OpenAI from "openai";

let _client;

export function getOpenAI() {
    if (_client) return _client;
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return _client;
}

export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
