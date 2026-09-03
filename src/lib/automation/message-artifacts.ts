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

  const context=/(?:verification|verify|security|one[- ]?time|otp|login|access|confirmation|\bcode\b)/i;
  const sentences=text.match(/[^.!?\n]+[.!?]?/g)??[];
  for(const sentence of sentences){
    if(!context.test(sentence))continue;
    for(const match of sentence.matchAll(/\b([A-Z0-9]{4,10})\b/gi)){
      const code=match[1];
      if(code&&/[0-9]/.test(code))add("verification_code",code);
    }
  }

  const links=/https?:\/\/[^\s<>"']+/gi;
  for(const match of text.matchAll(links)){
    const link=match[0];
    if(link)add("link",link);
  }

  return artifacts.slice(0,20);
}
