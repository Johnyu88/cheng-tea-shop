import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let pw;try{pw=require('@playwright/test')}catch{pw=require('playwright')}
const {webkit,devices}=pw;
const origin='https://cheng-tea-password-demo.onrender.com';
(async()=>{const b=await webkit.launch({proxy:{server:process.env.HTTPS_PROXY}});try{
const options={...devices['iPhone 13'],httpCredentials:{username:'preview',password:process.env.DEMO_ACCEPTANCE_PREVIEW_PASSWORD}};
const c=await b.newContext(options),p=await c.newPage();p.setDefaultTimeout(30000);
const identity=async()=>{await p.goto(origin+'/orders');await p.getByLabel('訂單編號').fill(process.env.DEMO_ACCEPTANCE_ORDER||'261002-001');await p.getByLabel('顧客姓名').fill('手機查單');await p.getByLabel('手機末三碼').fill('000');};
const issue=()=>p.getByRole('button',{name:'取得查單驗證碼',exact:true}).click();
const inViewport=async locator=>{const box=await locator.boundingBox(),h=await p.evaluate(()=>innerHeight);assert.ok(box&&box.y>=0&&box.y+box.height<=h,JSON.stringify({box,h}));return box;};
let mode='success';await p.route('**/api/demo/otp',r=>mode==='network'?r.abort('failed'):mode==='rate'?r.fulfill({status:429,headers:{'Retry-After':'87'},body:'busy'}):mode==='failure'?r.fulfill({status:500,json:{ok:false,error:'取得驗證碼失敗，請稍後再試。'}}):r.fulfill({json:{ok:true,value:{challengeId:'layout-test',expiresAt:Date.now()+300000,resendAvailableAt:Date.now()+60000,usable:true,demoCode:'123456'}}}));
await identity();await issue();await p.getByRole('heading',{name:'第二步：驗證並查詢訂單'}).waitFor();
const otp=p.getByLabel('驗證碼',{exact:true});const box=await inViewport(otp);assert.equal(await otp.evaluate(e=>document.activeElement===e),true);
await inViewport(p.getByRole('button',{name:'查詢訂單',exact:true}));assert.match(await p.getByText(/沙盒測試 OTP/).textContent(),/123456/);assert.match(await p.getByText(/OTP 有效時間/).textContent(),/剩餘/);assert.equal(await p.getByLabel('顧客姓名').count(),0);assert.equal(await p.getByRole('button',{name:/重新取得驗證碼（冷卻/}).isDisabled(),true);
await p.screenshot({path:process.env.DEMO_ACCEPTANCE_SCREENSHOT||'test-results/otp-stage-two.png'});console.log('PASS explicit stage 2, OTP focus/in-viewport, query button in-viewport, 123456 hint, expiry, resend cooldown '+JSON.stringify({otp:box,viewport:await p.evaluate(()=>({width:innerWidth,height:innerHeight}))}));
await p.route('**/api/demo/orders/lookup',r=>r.fulfill({status:403,json:{ok:false,error:'查無符合資料的訂單，或驗證碼無效／過期，請確認訂單編號、姓名及手機末三碼後再試'}}));await otp.fill('123456');await p.getByRole('button',{name:'查詢訂單',exact:true}).click();await p.getByRole('alert').waitFor();assert.match(await p.getByRole('alert').textContent(),/查無符合資料/);await inViewport(p.getByRole('alert'));assert.equal(await otp.count(),1);console.log('PASS no-match text visible; OTP stage retained');
for(const state of ['failure','network','rate']){mode=state;await identity();await issue();await p.getByRole('alert').waitFor();const text=await p.getByRole('alert').textContent();assert.match(text,state==='rate'?/冷卻.*87|87 秒/:state==='network'?/暫時無法連線/:/取得驗證碼失敗/);await inViewport(p.getByRole('alert'));if(state==='rate'){assert.equal(await p.getByRole('button',{name:/冷卻中，請等待/}).isDisabled(),true);await p.waitForTimeout(1100);assert.match(await p.getByRole('alert').textContent(),/剩餘 8[56] 秒/);}console.log('PASS '+state+' explicit visible feedback');}
await c.close();console.log('Mobile WebKit two-stage UI regression PASS (mocked failure responses; actual deployed frontend).');
}finally{await b.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});

