export type MessageArtifact={type:"verification_code"|"link";value:string};

export function extractMessageArtifacts(text:string):MessageArtifact[]{
  const artifacts:MessageArtifact[]=[];
  const seen=new Set<string>();
  const add=(type:MessageArtifact["type"],value:string)=>{
    const clean=value.trim().replace(/[).,;]+$/g,"");
    const key=`${type}:${clean}`;
    if(clean&&!seen.has(key)){
      seen.add(key);
      artifacts.push({type,value:clean});
    }
  };

  const codeContext=/(?:verification|verify|security|one[- ]?time|otp|login|access|confirmation)[^\n]{0,50}?\b([A-Z0-9]{4,10})\b/gi;
  for(const match of text.matchAll(codeContext)){
    const code=match[1];
    if(code&&/[0-9]/.test(code))add("verification_code",code);
  }

  const standalone=/\b(\d{4,8})\b/g;
  for(const match of text.matchAll(standalone)){
    const code=match[1];
    if(!code)continue;
    const around=text.slice(Math.max(0,(match.index??0)-60),(match.index??0)+80);
    if(/code|otp|verify|verification|security|one[- ]?time|login|access/i.test(around))add("verification_code",code);
  }

  const links=/https?:\/\/[^\s<>"']+/gi;
  for(const match of text.matchAll(links)){
    const link=match[0];
    if(link)add("link",link);
  }

  return artifacts.slice(0,20);
}
