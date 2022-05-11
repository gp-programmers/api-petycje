import fetch from "node-fetch";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const config = require("./config.json");
const crypto = require("crypto");

export function randomint(min, max){
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
export async function obtainoauth2(code,redirect,callback){
    let body = {
      "client_id":process.env.ID,
      "client_secret":process.env.SECRET,
      'grant_type':'authorization_code',
      "code":code,
      "redirect_uri":redirect
    }
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
   var request =  await fetch('https://discord.com/api/oauth2/token',{
     method:"POST",
     body:new URLSearchParams(body),
     headers:headers
   })
   var response = await request.json();
   if(response.error)
      callback(undefined)
   else{
     const string = response.scope;
     var tab = config.req_scope;
     var find = true;
     tab.forEach(ele=>{
        if(string.search(ele)>-1)
          string.replace(ele,"");
        else{
          if(find)
            callback(undefined)
          find=false;
        }
     })
     if(!find || response["token_type"]!="Bearer")
      return;
    else
     callback(response)
   }
}
export async function requestjson(url,method,body,headers){
  return new Promise((resolve, reject)=>{
    if(method!="GET")
      var fe = fetch(url,{
      method:method,
      body:body,
      headers:headers
    })
    else
    var fe = fetch(url,{
      method:method,
      headers:headers
    })
  
    fe.then(res=>{
      res.json().then(json=>{
      if(res.status==200)
        resolve(json)
      else{
        reject(json);
        console.error(json)
      }
      })
    })
    .catch(err=>{
      
      reject(err)
    })
  })
}
export function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}
export function makeuniqueid(name){
  var hash = crypto.createHash("md5")
  var time = Math.round(new Date()/1000).toString()
  var id = makeid(32);
  hash=hash.update(name+time+id)
  hash=hash.digest("hex")
  return hash;
}
