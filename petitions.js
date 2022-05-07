import { db } from "./db.js";
import { makeuniqueid } from "./functions.js";
import { petitionuser } from "./petitionuser.js";
import { user } from "./users.js";
var us = user;
export class petition{
    static PERMISSIONS={
        MANAGE_PETITION:1<<0,
        VIEW_PETITION:1<<2,
        MANAGE_PERMISSIONS:1<<3,
        ADD_COMMENTS:1<<4,
        VIEW_COMMENTS:1<<5,
        INTERACT_WITH_PETITION:1<<6,
        INTERACT_WITH_COMMENTS:1<<7
    }
    constructor(id=undefined){
        this.id=id;
        this.dbc = new db().dbc
    }
    create(title,content,userid,anonperm){
        return new Promise((resolve,reject)=>{
            if(this.id===undefined){
                var id=makeuniqueid(userid);
                this.dbc.run(`INSERT INTO "main"."petitions"("title","content","creator","anonperm","timestamp","id") VALUES (?,?,?,?,?,?);`,[title,content,userid,anonperm,Math.floor(new Date()/1000),id],err=>{
                    if(err){
                        console.error(err);
                        reject();
                    }
                    else{
                        resolve(id);
                        this.id=id;
                        this.dbc.run(`INSERT INTO "main"."relations"("oid","uid","type","timestamp","permission") VALUES (?,?,?,?,?);`,[id,userid,"j",Math.floor(new Date()/1000),0]);
                        this.dbc.run(`INSERT INTO "main"."relations"("oid","uid","type","timestamp","permission") VALUES (?,?,?,?,?);`,[id,userid,"s",Math.floor(new Date()/1000),0]);
                    }
                })
            }
            else
                reject()
        })     
    }
    getpetition(){
        return new Promise((resolve,reject)=>{
        if(this.id!==undefined){
            this.dbc.get(`Select * from petitions where id=?`,[this.id],(err,row)=>{
                if(err){
                    console.error(err)
                    reject()
                }
                else
                    resolve(row);
            })
        }
        else
            reject()
        })
    }
    /**
     * 
     * @param {user} user
     * @param {Array<petition.PERMISSIONS>} perms 
     */
    async hasperm(user,perms){
        if(this.id!==undefined){
        var petition = await this.getpetition();
        if(petition===undefined){
            console.log("not found");
            return false;
        }
            
        if(await user.chechperm([us.PERMISSIONS.ADMINISTRATOR])||user.id==petition.creator){
            return true;
        }
        var petitionu = new petitionuser(user.id,this.id);
        if(await petitionu.exist){
            var uperm = await petitionu.perm;
            var is=true;
            perms.forEach(perm=>{
                if(is){
                    is=uperm&perm;
                }
            })

        }
        else{
            var anonperm = petition.anonperm;
            var is=true;
            perms.forEach(perm=>{
                if(is){
                    is=anonperm&perm;
                }
            })
        }
        return is;
        
    }
    }
    delete(){
        this.dbc.run(`Delete from petitions where id=?`,[this.id],err=>{
            if(err){
                console.error(err)
                this.dbc.run(`Delete from relations where oid=?`,[this.id],err=>{
                    if(err)
                        console.error(err);
                })
            }
        })
    }
    async joinuser(userid){
        return new Promise(async (resolve,reject)=>{
            var petitionu = new petitionuser(userid,this.id);
        if(await petitionu.exist)
            resolve(false);
        else{
            var petition = await this.getpetition();
        this.dbc.run(`INSERT INTO "main"."relations"("oid","uid","type","timestamp","permission") VALUES (?,?,?,?,?);`,[this.id,userid,"j",Math.floor(new Date()/1000),petition.anonperm],err=>{
            if(err){
                console.error(err);
                reject();
            }
            else
                resolve(true);
        });
    }
        })
        
    }
    async getsigns(){
        return new Promise((resolve,reject)=>{
            this.dbc.all(`Select uid,timestamp from relations where oid=? AND type=?`,[this.id,"s"],(err,rows)=>{
                if(err){
                    console.error(err);
                    resolve([]);
                }
                else
                    resolve(rows);
            })
        })
    }
    async getusers(){
        return new Promise((resolve,reject)=>{
            this.dbc.all(`Select * from relations where oid=? AND type=?`,[this.id,"j"],(err,rows)=>{
                if(err)
                    console.error(err)
                resolve(rows);
            })
        })

    }
}