import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import {fileURLToPath} from "node:url";
dotenv.config();
const app=express(),PORT=process.env.PORT||3000,__dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({limit:"1mb"})); app.use(express.static(path.join(__dirname,"public")));
const cache=new Map();
async function brapi(endpoint){
 const headers={}; if(process.env.BRAPI_TOKEN)headers.Authorization=`Bearer ${process.env.BRAPI_TOKEN}`;
 const r=await fetch("https://brapi.dev/api"+endpoint,{headers,signal:AbortSignal.timeout(15000)});
 const data=await r.json(); if(!r.ok)throw new Error(data.message||data.error||`Brapi HTTP ${r.status}`); return data;
}
app.get("/api/health",(_q,s)=>s.json({ok:true,quoteProvider:"Brapi",quoteTokenConfigured:!!process.env.BRAPI_TOKEN,aiConfigured:!!process.env.OPENAI_API_KEY,updatedAt:new Date().toISOString()}));
app.get("/api/quote/:tickers",async(req,res)=>{
 const symbols=String(req.params.tickers||"").toUpperCase().split(",").map(x=>x.trim()).filter(x=>/^[A-Z0-9]{4,12}$/.test(x)).slice(0,15);
 if(!symbols.length)return res.status(400).json({error:"Informe tickers como PETR4,VALE3,ITUB4."});
 const key=symbols.join(",");
 if(cache.has(key)&&Date.now()-cache.get(key).time<60000)return res.json({...cache.get(key).value,cached:true});
 try{
  const d=await brapi(`/api/v2/stocks/quote?symbols=${encodeURIComponent(symbols.join(","))}`);
  const results=(d.results||[]).map(r=>{const x=r.data||r;return {symbol:r.symbol||r.requestedSymbol||x.symbol||"",name:x.longName||x.shortName||x.name||r.symbol||"",price:x.regularMarketPrice??null,change:x.regularMarketChangePercent??null,marketCap:x.marketCap??null,currency:x.currency||"BRL",time:d.requestedAt||null,source:"Brapi"}});
  const value={results,source:"Brapi",updatedAt:d.requestedAt||new Date().toISOString(),note:"Consulte horário, cobertura e termos do provedor."};cache.set(key,{time:Date.now(),value});res.json(value);
 }catch(e){res.status(502).json({error:"Falha ao consultar dados de mercado.",detail:e.message});}
});
app.get("/api/fundamentals/:ticker",async(req,res)=>{
 const ticker=String(req.params.ticker||"").toUpperCase();if(!/^[A-Z0-9]{4,12}$/.test(ticker))return res.status(400).json({error:"Ticker inválido."});
 try{
  const [stats,profile,financial]=await Promise.allSettled([
   brapi(`/api/v2/stocks/statistics?symbols=${encodeURIComponent(ticker)}`),
   brapi(`/api/v2/stocks/profile?symbols=${encodeURIComponent(ticker)}`),
   brapi(`/api/v2/stocks/financial-data?symbols=${encodeURIComponent(ticker)}`)
  ]);
  res.json({ticker,statistics:stats.status==="fulfilled"?stats.value:null,profile:profile.status==="fulfilled"?profile.value:null,financialData:financial.status==="fulfilled"?financial.value:null,updatedAt:new Date().toISOString(),source:"Brapi"});
 }catch(e){res.status(502).json({error:"Não foi possível buscar fundamentos.",detail:e.message});}
});
app.post("/api/analyze",async(req,res)=>{
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"IA não configurada. Adicione OPENAI_API_KEY nas variáveis de ambiente do servidor."});
 const ticker=String(req.body?.ticker||"").toUpperCase().slice(0,12),data=JSON.stringify(req.body?.data||{}).slice(0,18000),question=String(req.body?.question||"Faça uma análise educacional do ativo, dos dados disponíveis, dos riscos e das informações que faltam.").slice(0,3000);
 const messages=[
  {role:"system",content:"Você é o analista educacional do JS — Análises com Base e Conteúdo. Responda em português brasileiro. Use somente dados recebidos; nunca invente números, fatos, fontes ou indicadores. Separe: resumo, dados observados, interpretação, riscos e dados ausentes. Declare claramente quando a resposta do provedor estiver vazia ou incompleta. Não prometa retorno e não apresente recomendação personalizada de compra/venda. Inclua que é conteúdo educativo."},
  {role:"user",content:`Ativo: ${ticker||"não informado"}\nDados recebidos de API externa: ${data}\nPedido: ${question}`}
 ];
 try{
  const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4.1-mini",messages,temperature:.2}),signal:AbortSignal.timeout(60000)});
  const d=await r.json();if(!r.ok)throw new Error(d.error?.message||`OpenAI HTTP ${r.status}`);
  res.json({ticker,report:d.choices?.[0]?.message?.content||"",model:d.model,createdAt:new Date().toISOString()});
 }catch(e){res.status(502).json({error:"Falha ao gerar relatório de IA.",detail:e.message});}
});
app.get("*",(_q,s)=>s.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`JS Análises iniciado na porta ${PORT}`));
