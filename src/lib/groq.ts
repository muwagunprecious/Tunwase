import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const PRIMARY_MODEL = "openai/gpt-oss-120b";
export const FAST_MODEL = "openai/gpt-oss-20b";
