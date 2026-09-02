/** Workday adapter — conservative common fields plus authoritative live-form mapping. */
import type { AtsFormField, ResolvedField } from "../types";
import { structuredProfileValue } from "./contract";
import type { AdapterInspectResult, AtsAdapter, CandidateContext, CandidateDocumentFact } from "./contract";

const WORKDAY_FIELDS: AtsFormField[] = [
  { key: "full_name", label: "Full name", required: true, sensitive: false, kind: "text" },
  { key: "email", label: "Email", required: true, sensitive: false, kind: "email" },
  { key: "phone", label: "Phone", required: false, sensitive: false, kind: "phone" },
  { key: "location", label: "Location", required: false, sensitive: false, kind: "text" },
  { key: "resume", label: "Resume", required: true, sensitive: false, kind: "file" },
  { key: "cover_letter", label: "Cover letter", required: false, sensitive: false, kind: "long_text" },
  { key: "linkedin", label: "LinkedIn", required: false, sensitive: false, kind: "url" },
  { key: "website", label: "Website / portfolio", required: false, sensitive: false, kind: "url" },
  { key: "work_authorization", label: "Work authorization / sponsorship", required: false, sensitive: true, kind: "choice" },
  { key: "compensation", label: "Compensation expectations", required: false, sensitive: true, kind: "text" },
  { key: "demographic_questions", label: "Voluntary demographic questions", required: false, sensitive: true, kind: "choice" },
];
function matchSavedAnswer(label:string,candidate:CandidateContext){const words=label.toLowerCase().split(/[^a-z]+/).filter(w=>w.length>3);if(!words.length)return null;const hit=candidate.savedAnswers.find(a=>words.every(w=>a.question.toLowerCase().includes(w))&&a.answer.trim());return hit?.answer??null;}
function fromText(field:AtsFormField,value:string|null,source:Exclude<ResolvedField["source"],"unresolved">):ResolvedField{return value&&value.trim()?{...field,value,fill:{type:"text",text:value},source}:{...field,value:null,fill:null,source:"unresolved"};}
function fromDocument(field:AtsFormField,document:CandidateDocumentFact|null|undefined):ResolvedField{return document?{...field,value:document.fileName,fill:{type:"private_file",documentId:document.id,fileName:document.fileName,mimeType:document.mimeType,sizeBytes:document.sizeBytes},source:"document"}:{...field,value:null,fill:null,source:"unresolved"};}

export const workdayAdapter:AtsAdapter={
  provider:"workday",displayName:"Workday",implemented:true,
  inspectForm(targetUrl:string):AdapterInspectResult{const notes=["Workday tenant flows vary widely. The live browser inspection is authoritative.","If Workday requires account creation, login, CAPTCHA/bot verification, or an unsupported widget, automation stops for the user rather than bypassing it."];if(!/workday|myworkdayjobs\.com/i.test(targetUrl))notes.push("URL does not look like a Workday application page; treat the static field list as indicative only.");return{fields:WORKDAY_FIELDS,notes};},
  mapFacts(fields,candidate){return fields.map((field):ResolvedField=>{if(field.sensitive)return fromText(field,matchSavedAnswer(field.label,candidate),"saved_answer");switch(field.key){case"full_name":case"name":return fromText(field,candidate.fullName,"profile");case"email":return fromText(field,candidate.email,"profile");case"phone":return fromText(field,candidate.phone,"profile");case"location":return fromText(field,candidate.location,"profile");case"resume":return fromDocument(field,candidate.resumeDocument);case"cover_letter":case"additional_information":{if(field.kind==="file")return fromDocument(field,candidate.coverLetterDocument);const letter=candidate.coverLetterText?.trim()??"";return letter?{...field,value:`Prepared cover letter (${letter.length} characters)`,fill:{type:"text",text:letter},source:"materials"}:{...field,value:null,fill:null,source:"unresolved"};}case"linkedin":return fromText(field,candidate.linkedinUrl,"profile");case"website":case"portfolio":return fromText(field,candidate.websiteUrl??candidate.githubUrl,"profile");default:if(field.kind==="file")return{...field,value:null,fill:null,source:"unresolved"};{const profileValue=structuredProfileValue(field.key,candidate);if(profileValue)return fromText(field,profileValue,"profile");return fromText(field,matchSavedAnswer(field.label,candidate),"saved_answer");}}});}
};
