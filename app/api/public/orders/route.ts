import { NextResponse } from "next/server";
import { readPublicTeaCatalog } from "@/lib/server/public-tea-publication";
import { placeTeaOrder, type TeaOrderInput } from "@/lib/server/tea-order-inbox";
export async function POST(request:Request){
  try{
    if(process.env.PUBLIC_STOREFRONT_SERVER!=="enabled")return new NextResponse("Not found",{status:404});
    if(request.headers.get("origin")!==new URL(request.url).origin) return NextResponse.json({ok:false,error:"來源驗證失敗"},{status:403});
    if(!/^application\/json(?:;|$)/i.test(request.headers.get("content-type")||""))return NextResponse.json({ok:false,error:"請使用網站送出訂單"},{status:415});
    const raw=await request.text();
    if(raw.length>12000)throw Error("訂單資料過長");
    const input=JSON.parse(raw) as TeaOrderInput;
    const receipt=placeTeaOrder(input,await readPublicTeaCatalog());
    return NextResponse.json({ok:true,value:receipt},{headers:{"cache-control":"no-store"}});
  }catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:"訂單送出失敗"},{status:400,headers:{"cache-control":"no-store"}});}
}
