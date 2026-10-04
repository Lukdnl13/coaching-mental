import {createClient} from '@supabase/supabase-js';
let client:ReturnType<typeof createClient>|null=null;
export async function getSupabase(){
 if(client)return client;
 const res=await fetch('/api/config',{cache:'no-store'});if(!res.ok)throw new Error('Configuration indisponible.');
 const {url,key}=await res.json() as {url?:string;key?:string};if(!url||!key)return null;
 client=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 return client;
}
