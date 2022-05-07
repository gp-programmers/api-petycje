import { db } from "./db.js";
import { makeuniqueid } from "./functions.js";
import { petition } from "./petitions.js";
import { user } from "./users.js";
var us = user;
export class petitionuser{
    constructor(id,pid){
        this.id=id;
        this.pid=pid
        this.dbc = new db().dbc
    }
    getobject(){
        return new Promise((resolve,reject)=>{
            this.dbc.get(`Select uid,timestamp,oid,permission from relations where oid=? and uid=? and type=?`,[this.pid,this.id,"j"],(err,row)=>{
                if(err){
                    console.error(err)
                }
                else
                    resolve(row)
            })
        })
    }
    setperm(num){
            this.dbc.run(`UPDATE "main"."relations" SET "permission"=? WHERE oid=? AND uid=? AND type=?`,[num,this.pid,this.id,"j"],err=>{
                if(err){
                    console.error(err);
                }
            })
    }
    get exist(){
        return new Promise((resolve,reject)=>{
            this.dbc.get(`Select * from relations where oid=? and uid=? and type=?`,[this.pid,this.id,"j"],(err,row)=>{
                if(err){
                    console.error(err)
                    reject();
                }
                else
                    resolve(row!==undefined)
            })
        })
    }
    get perm(){
        return new Promise(async (resolve,reject)=>{
            if(await this.exist){
                this.dbc.get(`Select * from relations where oid=? and uid=? and type=?`,[this.pid,this.id,"j"],(err,row)=>{
                    if(err){
                        console.error(err)
                        reject();
                    }
                    else
                        resolve(row.permission);
                })
            }
            else
                resolve(undefined);
        })
    }
    get signed(){
        return new Promise(async (resolve,reject)=>{


        this.dbc.get(`Select * from relations where oid=? and uid=? and type=?`,[this.pid,this.id,"s"],(err,rows)=>{
            if(err)
                console.error(err);
            resolve(rows!==undefined);
        })
    })
    }
    async sign(){
        return new Promise(async (resolve,reject)=>{
        if(await this.signed)
            resolve(false)
        else{
        if(await this.exist){
            this.dbc.run(`INSERT INTO "main"."relations"("oid","uid","type","timestamp","permission") VALUES (?,?,?,?,?);`,[this.pid,this.id,"s",Math.floor(new Date()/1000),0],err=>{
                if(err){
                    console.error(err);
                }
                resolve(true);
            });
        }
        else{
            var peti = new petition(this.pid);
            peti.joinuser(this.id);
            this.dbc.run(`INSERT INTO "main"."relations"("oid","uid","type","timestamp","permission") VALUES (?,?,?,?,?);`,[this.pid,this.id,"s",Math.floor(new Date()/1000),0],err=>{
                if(err){
                    console.error(err);
                }
                resolve(true);
            });
        }
    }
    })
    }
    async unsign(){
        return new Promise(async (resolve,reject)=>{
            if(await this.signed){
                this.dbc.run(`Delete from relations where oid=? AND uid=? AND type=?`,[this.pid,this.id,"s"],err=>{
                    if(err){
                        console.error(err)
                    }
                    resolve(true);
                })
            }
            else
                resolve(false);
        })
    }

}