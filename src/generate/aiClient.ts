import OpenAI from "openai";

let client: OpenAI | null = null;

export const getClient = () => {
  if (!client) {
    if (process.env.GITHUB_TOKEN) {
      console.log("Using Azure API for OpenAI");
      client = new OpenAI({
        apiKey: process.env.GITHUB_TOKEN,
        baseURL: "https://models.inference.ai.azure.com",
      });
    } else {
      console.log("Using OpenAI API");
      client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }
  return client;
};
