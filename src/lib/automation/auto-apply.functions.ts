import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePaidPlan } from "@/lib/billing/billing.functions";

function validateJob(input:{jobId:string}){const jobId=input?.jobId?.trim();if(!jobId)throw new Error("A saved job is required.");return{jobId};}

export type AutoApplyResult={
  applicationId:string;
  mode:"review"|"automatic";
  resumeGenerated:boolean;
  coverLetterGenerated:boolean;
  state:string;
  message:string;
};

export const applyWith357=createServerFn({method:"POST"})
  .middleware([requireSupabaseAuth])
  .inputValidator(validateJob)
  .handler(async({data,context}):Promise<AutoApplyResult>=>{
    await requirePaidPlan(context.supabase,context.userId,"auto");
    const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
    const {data:job,error:jobError}=await supabaseAdmin.from("jobs").select("id,title,company,source_url").eq("id",data.jobId).eq("created_by",context.userId).maybeSingle();
    if(jobError)throw new Error(jobError.message);if(!job)throw new Error("Saved job not found.");if(!job.source_url)throw new Error("This saved job has no employer application URL.");

    let {data:application,error:appError}=await supabaseAdmin.from("applications").select("id,resume_document_id,cover_letter_document_id,status").eq("job_id",job.id).eq("user_id",context.userId).maybeSingle();
    if(appError)throw new Error(appError.message);
    if(!application){const created=await supabaseAdmin.from("applications").insert({user_id:context.userId,job_id:job.id,status:"draft"}).select("id,resume_document_id,cover_letter_document_id,status").single();if(created.error)throw new Error(created.error.message);application=created.data;}

    const {data:prefs,error:prefsError}=await supabaseAdmin.from("automation_preferences").select("manual_review,ai_generated_resume,ai_generated_cover_letter").eq("user_id",context.userId).maybeSingle();
    if(prefsError)throw new Error(prefsError.message);
    const manualReview=prefs?.manual_review!==false;
    const generateResume=prefs?.ai_generated_resume!==false;
    const generateCover=prefs?.ai_generated_cover_letter!==false;
    let resumeGenerated=false;let coverLetterGenerated=false;

    if(generateResume){const {runGenerateTailoredResume}=await import("@/lib/ai/tasks.server");const result=await runGenerateTailoredResume(context.supabase,context.userId,job.id);const documentId=await persistGeneratedPdf({userId:context.userId,applicationId:application.id,jobTitle:job.title,company:job.company,kind:"resume",text:result.text});await supabaseAdmin.from("applications").update({resume_document_id:documentId}).eq("id",application.id).eq("user_id",context.userId);resumeGenerated=true;}
    if(generateCover){const {runGenerateCoverLetter}=await import("@/lib/ai/tasks.server");const result=await runGenerateCoverLetter(context.supabase,context.userId,job.id);const documentId=await persistGeneratedPdf({userId:context.userId,applicationId:application.id,jobTitle:job.title,company:job.company,kind:"cover_letter",text:result.text});await supabaseAdmin.from("applications").update({cover_letter_document_id:documentId}).eq("id",application.id).eq("user_id",context.userId);coverLetterGenerated=true;}

    if(manualReview){const {error}=await supabaseAdmin.from("application_review_queue").upsert({application_id:application.id,user_id:context.userId,review_type:"documents_and_questions",status:"pending",created_at:new Date().toISOString(),reviewed_at:null},{onConflict:"application_id"});if(error)throw new Error(error.message);return{applicationId:application.id,mode:"review",resumeGenerated,coverLetterGenerated,state:"needs_review",message:"Application materials are prepared and waiting in the Review Queue. Nothing has been sent to the employer."};}

    const {runSubmission}=await import("./orchestrator.server");const execution=await runSubmission(context.supabase,context.userId,application.id,crypto.randomUUID());
    return{applicationId:application.id,mode:"automatic",resumeGenerated,coverLetterGenerated,state:execution.state,message:execution.message};
  });

async function persistGeneratedPdf(args:{userId:string;applicationId:string;jobTitle:string;company:string;kind:"resume"|"cover_letter";text:string}){
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {buildTextPdf}=await import("@/lib/documents/text-pdf");
  const id=crypto.randomUUID();const label=args.kind==="resume"?"Tailored Resume":"Tailored Cover Letter";const filename=`${sanitize(args.company)}-${sanitize(args.jobTitle)}-${args.kind==="resume"?"resume":"cover-letter"}.pdf`;const storagePath=`${args.userId}/generated/${args.applicationId}/${id}.pdf`;const bytes=buildTextPdf(`${label} — ${args.jobTitle} at ${args.company}`,args.text);
  const upload=await supabaseAdmin.storage.from("candidate-documents").upload(storagePath,bytes,{contentType:"application/pdf",upsert:false});if(upload.error)throw new Error(upload.error.message);
  const inserted=await supabaseAdmin.from("documents").insert({id,user_id:args.userId,name:filename,kind:args.kind,mime_type:"application/pdf",size_bytes:bytes.byteLength,storage_path:storagePath,is_default:false}).select("id").single();
  if(inserted.error){await supabaseAdmin.storage.from("candidate-documents").remove([storagePath]);throw new Error(inserted.error.message);}return inserted.data.id as string;
}
function sanitize(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50)||"357network";}
