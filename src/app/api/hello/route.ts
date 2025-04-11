import { ActionError, ActionGetResponse, ActionPostRequest, ActionPostResponse, createActionHeaders, createPostResponse } from "@solana/actions";




const headers = createActionHeaders();



export async function GET(request: Request) {
  return new Response('Hello, from API!')
}
