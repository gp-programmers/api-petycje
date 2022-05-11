import { makeid } from "./functions.js";
import { createRequire } from "module";
import { oauth2 } from "./oauth2.js";

const require = createRequire(import.meta.url);
const crypto = require("crypto");
const config = require("./config.json")
export class db{
    #db;
    #sqlite;
    
    constructor(){
        this.path="db.db"
        this.#sqlite = require("sqlite3").verbose();
        this.#db = new this.#sqlite.Database(":memory:")
        this.#db.run(`CREATE TABLE "sessions" (
            "token"	TEXT,
            "id"	TEXT
        )`);
        this.#db.run(`CREATE TABLE "users" (
            "id"	TEXT,
            "tag"	TEXT,
            "image_url"	TEXT,
            "nick_guild"	TEXT
        , "permissions"	INTEGER)`);
    }
    async verify(token){
        return new Promise((resolve,reject)=>{
        this.#db.get(`Select * from sessions where token=?`,[token],(err,row)=>{
            if(err)
            {
                console.log(err)
                resolve({auth:false})
            }
            else
                if(row!==undefined){
                resolve({auth:true,id:row.id})
                }
                else
                resolve({auth:false})

        })
    })
    }
    get dbc(){
        return this.#db;
    }
    async register(token,rtoken){
        return new Promise(async (resolve,reject)=>{
        const oc = new oauth2(token,rtoken)
    var user = await oc.getuser()
    var hash = crypto.createHash("sha256")
    var code = Math.round(new Date()/1000).toString()
    hash = hash.update(code+user.id+makeid(65))
    hash = hash.digest("hex");
    var guild = undefined;
    if(config.req_guild.is){
        guild = await oc.getguildmember(config.req_guild.id);
        var reponse = await guild;
        if(guild===undefined)
            resolve(undefined);
    }
    console.log(config.whitelist.find(ele=>ele==user.id))
    if(config.whitelist.find(ele=>ele==user.id)!==-1){
    this.#db.run(`INSERT INTO "main"."sessions"("token","id") VALUES (?,?);`,[hash,user.id],err=>{
        if(err){
            console.error(err)
            resolve(undefined)
        }
        else
        this.#db.all(`Select * FROM users where id=?`,[user.id],(err,rows)=>{
            if(err){
                console.error(err);
                resolve(undefined)
            }  
            else
            if(rows.length==0)
                this.#db.run(`INSERT INTO "main"."users" ("id","tag","image_url","nick_guild","permissions") VALUES (?,?,?,?,?);`,[user.id,`${user.username}#${user.discriminator}`,user.avatar,guild===undefined?null:guild.nick,config.default_perm],err=>{
                
                if(err){
                    console.error(err);
                    resolve(undefined)
                }
                else{
                    resolve(hash)
                }
                    
            })
            else
                resolve(hash)
        })
    })
}
else
    resolve(undefined);
})
    }
    logout(token){
        this.#db.run(`Delete from sessions where token`,[token],err=>{
            if(err){
                console.log(err);
            }
        })
    }
    
    
}
