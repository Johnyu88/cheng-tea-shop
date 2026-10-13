import { NextResponse } from "next/server";
import { merchantRequestCookie } from "@/lib/server/merchant-request-access";
import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { advanceTeaOrder, listTeaOrders } from "@/lib/server/tea-order-inbox";
async function authorized(request:Request,method:string){assertLocalDemoHttpRequest(request,method,method==="POST"?"json":undefined);if(!await merchantRequestCookie(request))throw Error("商家登入已過期，請重新登入");}
export async function GET(request:Request){
 try{await authorized(request,"GET");return NextResponse.json({ok:true,value:listTeaOrders()},{headers:{"cache-control":"private, no-store"}});}
 catch{return NextResponse.json({ok:false,error:"無法取得訂單，請重新登入"},{status:403});}
}
export async function POST(request:Request){
 try{
   await authorized(request,"POST");
   const raw=await request.text();if(raw.length>400)throw Error("操作內容不正確");
   const data=JSON.parse(raw) as {id?:unknown;action?:unknown};
   if(typeof data.id!=="string"||typeof data.action!=="string")throw Error("操作內容不正確");
   return NextResponse.json({ok:true,value:advanceTeaOrder(data.id,data.action)},{headers:{"cache-control":"private, no-store"}});
 }catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:"操作失敗"},{status:400});}
}
