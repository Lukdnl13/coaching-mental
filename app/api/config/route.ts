export async function GET(){
 // Only the publishable/anonymous key is sent to the browser. Never a secret key.
 const url=process.env.SUPABASE_URL||'',key=process.env.SUPABASE_PUBLISHABLE_KEY||'';
 let valid=key.startsWith('sb_publishable_');
 if(key.startsWith('eyJ')){try{valid=JSON.parse(atob(key.split('.')[1])).role==='anon';}catch{valid=false;}}
 return Response.json({url:valid?url:'',key:valid?key:''},{headers:{'Cache-Control':'no-store'}});
}
