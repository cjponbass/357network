export type MessageArtifact={type:"verification_code"|"link";value:string};

export function extractMessageArtifacts(text:string):MessageArtifact[]{
  const artifacts:MessageArtifact[]=[];const seen=new Set<string>();
  const add=(type:MessageArtifact["type"],value:string)=>{const clean=value.trim().replace(/[).,;]+$/g,"");const key=`${type}:${clean}`;if(clean&&!seen.has(key)){seen.add(key);artifacts.push({type,value:clean});}};
  const codeContext=/(?:verification|verify|security|one[- ]?time|otp|login|access|confirmation)[^\n]{0,50}?\b([A-Z0-9]{4,10})\b/gi;
  for(const match of text.matchAll(codeContext))if(match[1]&&/[0-9]/.test(match[1]))add("verification_code",match[1]);
  const standalone=/\b(\d{4,8})\b/g;for(const match of text.matchAll(standalone)){const around=text.slice(Math.max(0,(match.index??0)-60),(match.index??0)+80);if(/code|otp|verify|verification|security|one[- ]?time|login|access/i.test(around)&&match[1])add("verification_code",match[1]);}
  const links=/https?:\/\/[^\s<>"']+/gi;for(const match of text.matchAll(links))if(match[0])add("link",match[0]);
  return artifacts.slice(0,20);
}
