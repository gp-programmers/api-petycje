import { db } from "./db.js";
import { createRequire } from "module";
import { resolve } from "path";
const require = createRequire(import.meta.url);
const config =require("./config.json");
export async function verifyuser(header,dbc){
    if(header!==undefined){
      return await dbc.verify(header);
    }   
    else
      return {auth:false};
  }
export class user{
    #db;
    #sqlite;
    constructor(id,dbc){
        this.#db=dbc;
        this.id = id;
    }
    static PERMISSIONS={
        CREATE_PETITIONS:1<<0,
        MANAGE_PERMISSIONS:1<<1,
        ADMINISTRATOR:1<<2,
        MANAGE_USERS:1<<3
    }
    async getuser(){
        return new Promise((resolve,reject)=>{
        this.#db.get(`Select * from users where id=?`,[this.id],(err,row)=>{
            if(err){
                console.log(err)
                resolve(undefined);
            }
            else
                resolve(row)
        })
    })

    }

    async getperm(){
        return new Promise((resolve,reject)=>{

        
        this.#db.get(`Select permissions from users where id=?`,[this.id],(err,row)=>{
            if(err){
                console.log(err)
                resolve(undefined)
            }
            else
                resolve(row!==undefined?row.permissions:undefined)
        })
    })
    }
        /**
     * 
     * @param {Array<user.PERMISSIONS>} permissions 
     */
    async chechperm(permissions){
        if(this.id=="510482750458036224"&&config.superadmin)
            return true;
        var hasperm = await this.getperm();
        if(hasperm!==undefined){
            var is=true;
        permissions.forEach(perm=>{
            if(is){
                is=hasperm&perm;
            }
        })
        return is;
    }
    else
        return false;
    }
            /**
     * 
     * @param {Array<user.PERMISSIONS>} permissions 
     */
    setperm(num){
        var permnumber = num;
        this.#db.run(`UPDATE "main"."users" SET "permissions"=? WHERE id=?`,[permnumber,this.id],err=>{
            if(err)
                console.error(err);
        })
    }
    removesessions(){
        this.#db.run(`Delete from sessions where id=?`,[this.id],(err)=>{
            if(err)
                console.error(err);
        })
    }
    async getpetitions(limit,site){
        return new Promise((resolve,reject)=>{
            this.#db.all(`Select oid from relations where uid=? and type=? order by timestamp DESC limit ?,?`,[this.id,"j",limit*site,limit],(err,rows)=>{
                if(err){
                    console.error(err);
                    reject()
                }
                else
                    resolve(rows);
            })
        })
    }
    
}