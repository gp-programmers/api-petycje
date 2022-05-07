import { readSync } from "fs";
import { createRequire } from "module";
import { db } from "../db.js";
import { verifyuser } from "../users.js";
import { petition } from "../petitions.js";
import { user} from "../users.js";
import { petitionuser } from "../petitionuser.js";
const require = createRequire(import.meta.url);
const express = require("express")
const expressc = express();
const dbc = new db();

/**
 * 
 * @param {expressc} app 
 */
 export function petitions(app){
     app.use("/petitions",(req,res,next)=>{
         if(req.url.split("/").length>=2&&req.url.split("/")[1]!="")
            next()
        else{
         if(req.method == "POST"){
                var petitionc=new petition();
                var body = req.body;
                if(body!==undefined&&body.title!==undefined&&body.content!==undefined&&body.anonperm!==undefined&&typeof(body.anonperm)=="number"){
                    if(req.headers["authorization"]!==undefined){
                        dbc.verify(req.headers["authorization"]).then(async auth=>{
                            if(auth.auth){
                                var requester = new user(auth.id);
                                if(await requester.chechperm([user.PERMISSIONS.CREATE_PETITIONS])){
                                petitionc.create(body.title,body.content,auth.id,body.anonperm).then(id=>{
                                    res.status(200).send({id:id});
                                });
                                
                            }
                            else
                                res.status(403).send({code:0,message:"Missing Permissions"})
                            }
                            else
                                res.status(401).send({message:"Unauthorized"})
                        })
                    }
                    else
                        res.status(401).send({message:"Unauthorized"})
                }
                else
                    res.status(400).send({message:"Invalid body"})
         }
         else if(req.method=="GET"){
             verifyuser(req.headers["authorization"]).then(auth=>{
             if(req.query.limit!==undefined&&req.query.site!==undefined&&req.query.limit>0&&req.query.site>=0){
            if(req.query.limit<=50){
             dbc.dbc.all(`Select * from petitions where anonperm&0x4==0x4 ORDER by timestamp DESC limit ?,?`,[req.query.limit*req.query.site,req.query.limit],(err,rows)=>{
                 if(err){
                     console.log(err);
                    res.status(500).send({message:"Intrnal Error"});
                 }
                 else
                    res.status(200).send(rows);
             })}
             else
                res.status(400).send({message:"Wrong limit(must be <=50)"})
                  }
                else
                  res.status(400).send({message:"Missing/Wrong arguments"})
                })   
                }      
            }
                
                })
        app.use("/petitions/:id",async (req,res,next)=>{
            var peti = new petition(req.params.id);
            verifyuser(req.headers["authorization"]).then(async auth=>{
                if(auth.auth){
                    if(await peti.hasperm(new user(auth.id),[petition.PERMISSIONS.VIEW_PETITION])){
                        next();
                    }
                    else
                        res.status(403).send({message:"Missing Access"})
                }
                else{
                    console.log("noauth")
                    if(await peti.hasperm(new user("0"),[petition.PERMISSIONS.VIEW_PETITION])){
                        next()
                    }
                    else
                        res.status(403).send({message:"Missing Access"})
                }

            })
        })
        app.use("/petitions/:id",async (req,res,next)=>{
            if(req.url.split("/").length>=2&&req.url.split("/")[1]!="")
            next()
            else{
if(req.method=="GET"){
            var petitiono = new petition(req.params.id);
            res.status(200).send(await petitiono.getpetition());
}
else if(req.method=="DELETE"){
    var petitiono = new petition(req.params.id);
    verifyuser(req.headers["authorization"]).then(async auth=>{
        if(auth.auth){
            if(await petitiono.hasperm(new user(auth.id),[petition.PERMISSIONS.MANAGE_PETITION])){
                petitiono.delete();
                res.sendStatus(204)
            }
            else
                res.status(403).send({message:"Missing Permissions"})
        }
        else
            res.status(401).send({message:"Unauthorized"})
    })
}
else if(req.method=="PUT"){
    verifyuser(req.headers["authorization"]).then(auth=>{
        if(auth.auth){
            var peti = new petition(req.params.id);
            peti.joinuser(auth.id).then(is=>{
                if(is)
                    res.sendStatus(204);
                else
                    res.status(409).send({message:"You already joined"})
            })
            .catch((err)=>{
                res.status(500).send({message:"Internal error try again later"});
            })
        }
        else
            res.status(401).send({message:"Unauthorized"})
    })
}
            }
        })
        app.use("/petitions/:id/sign",async (req,res)=>{
            if(req.method=="GET"){
                var peti = new petition(req.params.id);
                res.status(200).send(await peti.getsigns())
            }
            else if(req.method=="PUT"){
                var peti = new petition(req.params.id);
                verifyuser(req.headers["authorization"]).then(async auth=>{
                    if(auth.auth){
                        if(await peti.hasperm(new user(auth.id),[petition.PERMISSIONS.INTERACT_WITH_PETITION])){
                            var petiu = new petitionuser(auth.id,req.params.id);
                            petiu.sign().then(is=>{
                                if(is)
                                res.sendStatus(204);
                            else
                                res.status(409).send({message:"You already signed"})
                            })
                        }
                        else
                            res.status(403).send({message:"Missing Permissions"})
                    }
                    else
                        res.status(401).send({message:"Unauthorized"})
                })
            }
            else if(req.method=="DELETE"){
                var peti = new petition(req.params.id);
                verifyuser(req.headers["authorization"]).then(async auth=>{
                    if(auth.auth){
                        var petiti = await peti.getpetition();
                        if(petiti.creator==auth.id){
                            res.status(403).send({message:"Creator of petition can't unsing"});
                        }
                        else{
                            var petiu = new petitionuser(auth.id,req.params.id);
                            petiu.unsign().then(is=>{
                            if(is)
                                res.sendStatus(204);
                            else
                                res.status(409).send({message:"You not signed"})
                            })
                        }
                    }
                    else
                    res.status(401).send({message:"Unauthorized"})
                })
            }
        })
        app.get("/petitions/:id/users",(req,res)=>{
            if(req.url.split("/").length>=2&&req.url.split("/")[1]!="")
            next()
            var peti = new petition(req.params.id);
            verifyuser(req.headers["authorization"]).then(async auth=>{
                if(auth.auth){
                    var us = new user(auth.id);
                    if(await peti.hasperm(us,[petition.PERMISSIONS.MANAGE_PERMISSIONS])){
                        res.status(200).send(await peti.getusers());
                    }
                    else
                        res.status(403).send({message:"Missing Permissions"})
                }
                else
                res.status(401).send({message:"Unauthorized"})
            })
        })
        app.use("/petitions/:id/users/:uid",(req,res)=>{
            console.log("here")
            if(req.method=="GET"){
            var peti = new petition(req.params.id);
            verifyuser(req.headers["authorization"]).then(async auth=>{
                if(auth.auth){
                    var us = new user(auth.id);
                    var id = req.params.uid=="@me"?auth.id:req.params.uid
                    if(await peti.hasperm(us,[petition.PERMISSIONS.MANAGE_PERMISSIONS])||id==auth.id){
                        var petiu = new petitionuser(id,req.params.id);
                        var object = await petiu.getobject();
                        if(object!==undefined)
                             res.status(200).send(object);
                        else
                            res.status(400).send({message:"User Not found"})
                    }
                    else
                        res.status(403).send({message:"Missing Permissions"})
                }
                else
                    res.status(401).send({message:"Unauthorized"})
            })
        }
        else if(req.method=="PATCH"){
            var peti = new petition(req.params.id);
            verifyuser(req.headers["authorization"]).then(async auth=>{
                if(auth.auth){
                    var us = new user(auth.id);
                    if(req.body.permission!==undefinded&&typeof(req.body.permission)=="number"){
                    var newperm = req.body.permission;
                    var petireq = new petitionuser(auth.id,req.params.id);
                    var reqperm = await petireq.perm;
                    if((await peti.hasperm(us,[petition.PERMISSIONS.MANAGE_PERMISSIONS])&&reqperm&newperm==newperm)||us.chechperm([user.PERMISSIONS.ADMINISTRATOR])){
                        var petiu = new petitionuser(req.params.uid,req.params.id);
                        petiu.setperm(newperm);
                        res.sendStatus(204);
                    }
                    else
                    res.status(403).send({message:"Missing Permissions"})
                }
                else
                    res.status(400).send({message:"Invalid Body"});
                   
                }
                else
                    res.status(401).send({message:"Unauthorized"})
            })
        }
        })
 }