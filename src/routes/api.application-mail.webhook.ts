import { createFileRoute } from "@tanstack/react-router";

export const Route=createFileRoute("/api/application-mail/webhook")({server:{handlers:{POST:async({request})=>{
  const expected=process.env["APPLICATION_MAIL_WEBHOOK_SECRET"]?.trim();
  const supplied=request.headers.get("x-357-mail-secret")?.trim();
  if(!expected||!supplied||!constantTimeEqual(expected,supplied))return Response.json({error:"Unauthorized"},{status:401});
  try{
    const body=await request.json() as Record<string,unknown>;
    const applicationId=typeof body["applicationId"]==="string"?body["applicationId"].trim():"";
    const userId=typeof body["userId"]==="string"?body["userId"].trim():"";
    const bodyText=typeof body["bodyText"]==="string"?body["bodyText"]:"";
    if(!applicationId||!userId||!bodyText)return Response.json({error:"applicationId, userId and bodyText are required."},{status:400});
    const {ingestApplicationMessage}=await import("@/lib/automation/parity.functions");
    const receivedAt=asString(body["receivedAt"]);
    await ingestApplicationMessage({
      applicationId,userId,direction:"inbound",sender:asString(body["sender"]),recipient:asString(body["recipient"]),subject:asString(body["subject"]),bodyText,providerMessageId:asString(body["providerMessageId"]),
      ...(receivedAt?{receivedAt}:{}),
    });
    return Response.json({received:true});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Message ingestion failed."},{status:400});}
}}}});
function asString(value:unknown){return typeof value==="string"&&value.trim()?value.trim():null;}
function constantTimeEqual(a:string,b:string){if(a.length!==b.length)return false;let value=0;for(let i=0;i<a.length;i+=1)value|=a.charCodeAt(i)^b.charCodeAt(i);return value===0;}
