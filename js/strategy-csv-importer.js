(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyCsvImporter=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const MAX_BYTES=10*1024*1024,MAX_ROWS=50000,MAX_COLUMNS=100,MAX_CELL=16000;
  const DEFINITIONS=Object.freeze({
    contracted_modules_csv:Object.freeze({
      label:'Anotação de Venda / Produtos Contratados',generatesMrr:true,
      fields:Object.freeze([
        {key:'date',label:'Data da venda',required:true,aliases:['Data Lançam.','Data Lancam','Data Lançamento','Data']},
        {key:'seller',label:'Vendedor',required:true,aliases:['UsuarioVenda','Usuário Venda','Vendedor']},
        {key:'squad',label:'Grupo / Squad',required:true,aliases:['grupoAtendimento','grupo','Squad']},
        {key:'product',label:'Produto contratado',required:true,aliases:['Produto','Módulo']},
        {key:'amount',label:'Mensalidade adicionada (MRR)',required:true,aliases:['Vl Atual Ativo','Valor Atual Ativo']},
        {key:'customer',label:'Cliente',required:false,aliases:['Cliente']},
        {key:'taxId',label:'CNPJ do cliente',required:false,aliases:['ClienteCNPJ','CNPJ']},
        {key:'contractDate',label:'Cadastro do item contratual',required:false,aliases:['DataCadItemContrato']},
        {key:'segment',label:'Segmento',required:false,aliases:['Segmento']},
        {key:'state',label:'UF',required:false,aliases:['UF']},
        {key:'customerUser',label:'Usuário cliente',required:false,aliases:['UsuarioCliente']},
        {key:'customerCreated',label:'Cadastro do cliente',required:false,aliases:['DataCadCliente']},
        {key:'monthsCustomer',label:'Meses como cliente',required:false,aliases:['Meses Cliente']}
      ])
    }),
    merchandise_sales_csv:Object.freeze({
      label:'Venda de Mercadorias',generatesMrr:false,
      fields:Object.freeze([
        {key:'saleId',label:'Referência da venda',required:true,aliases:['id','Id Venda','Venda ID']},
        {key:'date',label:'Data da venda',required:true,aliases:['Data','Data Venda']},
        {key:'seller',label:'Vendedor',required:true,aliases:['Vendedor','UsuarioVenda']},
        {key:'squad',label:'Grupo / Squad',required:true,aliases:['grupo','grupoAtendimento','Squad']},
        {key:'product',label:'Produto vendido',required:true,aliases:['Produto']},
        {key:'amount',label:'Valor total da linha (sem multiplicar)',required:true,aliases:['vlTotalItem','Valor Total Item']},
        {key:'quantity',label:'Quantidade',required:false,aliases:['quantidade','Quantidade']}
      ])
    })
  });
  for(const def of Object.values(DEFINITIONS))Object.freeze(def.fields.forEach(f=>Object.freeze(f))||def.fields);
  function normalize(value){return String(value??'').normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');}
  function definition(key){return DEFINITIONS[String(key||'')]||null}
  function sniffDelimiter(text){
    const candidates=[',',';','\t','|'];const scores=new Map(candidates.map(c=>[c,0]));
    let quoted=false,lines=0;
    for(let i=0;i<text.length&&lines<6;i++){
      const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"')i++;else quoted=!quoted;continue}
      if(!quoted&&scores.has(ch))scores.set(ch,scores.get(ch)+1);
      if(!quoted&&(ch==='\n'||ch==='\r')){lines++;if(ch==='\r'&&text[i+1]==='\n')i++;}
    }
    return candidates.reduce((best,c)=>scores.get(c)>scores.get(best)?c:best,',');
  }
  function parse(text,{maxRows=MAX_ROWS}={}){
    if(typeof text!=='string'||!text.trim())throw new Error('CSV vazio.');
    if(text.length>MAX_BYTES*2)throw new Error('CSV acima do tamanho permitido.');
    const content=text.replace(/^\uFEFF/,'');const delimiter=sniffDelimiter(content);
    const records=[];let row=[],cell='',quoted=false,finishedQuote=false,atFieldStart=true;
    function pushCell(){if(cell.length>MAX_CELL)throw new Error('Campo CSV muito longo.');row.push(cell);cell='';finishedQuote=false;atFieldStart=true;if(row.length>MAX_COLUMNS)throw new Error('CSV com excesso de colunas.');}
    function pushRow(){pushCell();if(row.some(v=>v.trim()!=='')){records.push(row);if(records.length>maxRows+1)throw new Error(`CSV excede o limite de ${maxRows} registros.`);}row=[];}
    for(let i=0;i<content.length;i++){
      const ch=content[i];
      if(quoted){if(ch==='"'){if(content[i+1]==='"'){cell+='"';i++;}else{quoted=false;finishedQuote=true;}}else cell+=ch;}
      else if(ch==='"'){if(!atFieldStart)throw new Error('Aspas inválidas no campo CSV.');quoted=true;atFieldStart=false;}
      else if(ch===delimiter){pushCell();}
      else if(ch==='\r'||ch==='\n'){pushRow();if(ch==='\r'&&content[i+1]==='\n')i++;}
      else if(finishedQuote&&ch!==' '&&ch!=='\t')throw new Error('Caractere inesperado após aspas no CSV.');
      else if(!finishedQuote){cell+=ch;atFieldStart=false;}
      if(cell.length>MAX_CELL)throw new Error('Campo CSV muito longo.');
    }
    if(quoted)throw new Error('CSV contém aspas sem fechamento.');
    if(cell||row.length)pushRow();
    if(records.length<2)throw new Error('CSV sem cabeçalho e registros.');
    const headers=records.shift().map(v=>v.trim());
    if(headers.some(h=>!h)||new Set(headers.map(normalize)).size!==headers.length)throw new Error('Cabeçalhos vazios ou duplicados.');
    if(records.some((r)=>r.length!==headers.length))throw new Error('CSV contém linhas com número de colunas diferente do cabeçalho.');
    return {headers,rows:records,delimiter,rowCount:records.length};
  }
  function suggest(sourceKey,headers){
    const def=definition(sourceKey);if(!def)throw new Error('Origem CSV desconhecida.');
    if(!Array.isArray(headers)||!headers.length)throw new Error('Cabeçalhos obrigatórios.');
    const used=new Set(),mapping={};
    for(const f of def.fields){
      const found=headers.find(h=>!used.has(h)&&f.aliases.some(a=>normalize(a)===normalize(h)));
      if(found){mapping[f.key]=found;used.add(found);}
    }
    return mapping;
  }
  function validateMapping(sourceKey,headers,mapping){
    const def=definition(sourceKey);if(!def)throw new Error('Origem CSV desconhecida.');
    if(!mapping||typeof mapping!=='object'||Array.isArray(mapping))throw new Error('Mapeamento inválido.');
    const validKeys=new Set(def.fields.map(f=>f.key));const used=new Set();const clean={};
    for(const [key,value] of Object.entries(mapping)){
      if(!validKeys.has(key))throw new Error(`Campo desconhecido: ${key}.`);
      if(value===null||value==='')continue;
      if(typeof value!=='string'||!headers.includes(value))throw new Error(`Coluna indisponível: ${String(value)}.`);
      if(used.has(value))throw new Error(`Coluna duplicada no mapeamento: ${value}.`);
      clean[key]=value;used.add(value);
    }
    for(const f of def.fields)if(f.required&&!clean[f.key])throw new Error(`Campo obrigatório sem coluna: ${f.label}.`);
    return Object.freeze(clean);
  }
  function normalizeSquad(value){const v=String(value||'').trim().toUpperCase();return /^[A-E]$/.test(v)?v:null;}
  function dateOnly(value){const v=String(value??'').trim();const iso=v.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/);if(iso)return `${iso[3]}/${iso[2]}/${iso[1]}`;const br=v.match(/^(\d{2}\/\d{2}\/\d{4})(?:\s.*)?$/);return br?br[1]:v;}
  function getColumn(row,headers,mapping,key){const column=mapping[key];return column===undefined?'':String(row[headers.indexOf(column)]??'').trim();}
  function identifyProducts(sourceKey,parsed,mapping){
    const clean=validateMapping(sourceKey,parsed.headers,mapping);const productIndex=parsed.headers.indexOf(clean.product);
    const grouped=new Map();let empty=0,ignoredNoGroup=0;
    const groupIndex=parsed.headers.indexOf(clean.squad);
    for(const row of parsed.rows){if(!normalizeSquad(row[groupIndex])){ignoredNoGroup++;continue;}const name=String(row[productIndex]||'').trim();const norm=normalize(name);
      if(!norm){empty++;continue;}
      if(!grouped.has(norm))grouped.set(norm,{name,count:0,sourceKey,generatesMrr:definition(sourceKey).generatesMrr});
      grouped.get(norm).count++;
    }
    return Object.freeze({products:Array.from(grouped.values()).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')),emptyProductRows:empty,ignoredNoGroup,totalUnique:grouped.size});
  }
  function preview(sourceKey,parsed,mapping,limit=12){
    const clean=validateMapping(sourceKey,parsed.headers,mapping);const fields=definition(sourceKey).fields.filter(f=>clean[f.key]);
    return parsed.rows.slice(0,Math.max(0,Math.min(50,limit))).map(row=>Object.fromEntries(fields.map(f=>[f.key,['date','contractDate','customerCreated'].includes(f.key)?dateOnly(getColumn(row,parsed.headers,clean,f.key)):getColumn(row,parsed.headers,clean,f.key)])));
  }
  function createTemplatePayload({organizationId,userId,sourceKey,name,headers,mapping}){
    if(!organizationId||!userId)throw new Error('Organização e usuário obrigatórios.');
    if(!definition(sourceKey))throw new Error('Origem inválida.');
    const templateName=String(name||'').trim();if(!templateName||templateName.length>80)throw new Error('Informe um nome de modelo com até 80 caracteres.');
    if(!Array.isArray(headers)||headers.length>MAX_COLUMNS||headers.some(h=>typeof h!=='string'||h.length>250))throw new Error('Cabeçalhos inválidos.');
    const clean=validateMapping(sourceKey,headers,mapping);
    return Object.freeze({organization_id:organizationId,created_by:userId,source_key:sourceKey,name:templateName,columns:clean,headers:headers.slice()});
  }
  return Object.freeze({DEFINITIONS,MAX_BYTES,MAX_ROWS,MAX_COLUMNS,definition,normalize,normalizeSquad,dateOnly,sniffDelimiter,parse,suggest,validateMapping,identifyProducts,preview,createTemplatePayload});
});
