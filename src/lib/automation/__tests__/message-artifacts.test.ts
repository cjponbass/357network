import { describe, expect, it } from "vitest";
import { extractMessageArtifacts } from "../message-artifacts";

describe("application message artifact extraction",()=>{
  it("extracts verification codes only with verification context",()=>{const rows=extractMessageArtifacts("Your one-time verification code is 483921. Order 123456 is unrelated.");expect(rows).toContainEqual({type:"verification_code",value:"483921"});expect(rows).not.toContainEqual({type:"verification_code",value:"123456"});});
  it("extracts portal links",()=>{expect(extractMessageArtifacts("Continue at https://jobs.example.com/verify?token=abc123")).toContainEqual({type:"link",value:"https://jobs.example.com/verify?token=abc123"});});
  it("deduplicates artifacts",()=>{const rows=extractMessageArtifacts("OTP code 778899. Your OTP code is 778899.");expect(rows.filter(r=>r.type==="verification_code"&&r.value==="778899")).toHaveLength(1);});
});
