import { createRequire } from "module";
import { db } from "../db.js";
import { user, verifyuser} from "../users.js";
const require = createRequire(import.meta.url);
const express = require("express")
const expressc = express();
const dbc = new db();

/**
 * 
 * @param {expressc} app 
 */
export function users(app){
    app.get("/users/:id/petitions",(req,res,next)=>{
        if(req.url.split("/").length>4)
            next()
        else{
        verifyuser(req.headers["authorization"]).then(async auth=>{
            if(auth.auth){
                var requester = new user(auth.id);
                var uid = req.params.id=="@me"?auth.id:req.params.id;
                if(req.query.limit!==undefined&&req.query.site!==undefined&&req.query.limit>0&&req.query.limit<=50&&req.query.site>=0){
                if(auth.id==uid||await requester.chechperm([user.PERMISSIONS.MANAGE_USERS])){
                    var uuser=new user(uid);
                    res.status(200).send(await uuser.getpetitions(req.query.limit,req.query.site));
                }
                else
                    res.status(403).send({message:"Missing Access"})
            }
            else
                res.status(400).send({message:"missing / wrong parametrs"})
            }
            else
                res.status(401).send({message:"Unauthorized"})
        })
    }
    })
    app.use("/users/:id",async (req,res,next)=>{
        if(req.url!=="/")
            next()
        else{
        if(req.method=="GET"){
            if(req.params.id=="@me"){
                if(req.headers["authorization"]!==undefined){
                    var token = req.headers["authorization"];
                    dbc.verify(token).then(json=>{
                        if(!(json.auth))
                            res.status(401).send({code:0,message:"Unauthorized"});
                        else{
                            var tmp = new user(json.id)
                            tmp.getuser().then(user=>{
                                res.status(user===undefined?400:200).send(user);
                            })
                        }
                    })
                }
                else{
                    res.status(401).send({code:0,message:"Unauthorized"})
                }
            }
            else{
                var auth=false;
                if(req.headers["authorization"]!==undefined){
                    var json = await dbc.verify(req.headers["authorization"]);
                    auth = json.auth;
                }
                var tmp=new user(req.params.id)
                var us=user;
                tmp.getuser().then(async user=>{
                    if(auth)
                        var requester=new us(json.id)
                    if(!auth&&user!==undefined)
                        user["nick_guild"]=null;
                    if(!auth&&user!==undefined)
                        user["permissions"]=null;
                    if(auth&&(!(await requester.chechperm([us.PERMISSIONS.MANAGE_PERMISSIONS]))||req.params.id==json.id)&&user!==undefined)
                        user["permissions"]=null;
                    res.status(user===undefined?400:200).send(user);
                })
            }
        }
        else if(req.method == "PURGE"){
            if(req.headers["authorization"]!==undefined){
                dbc.verify(req.headers["authorization"]).then(async auth=>{
                    if(auth.auth){
                        var requester = new user(auth.id)
                        var useroid=req.params.id=="@me"?auth.id:req.params.id;
                        if(await requester.chechperm([user.PERMISSIONS.MANAGE_USERS])||auth.id==userois){
                            var usero = new user(useroid);
                            usero.removesessions();
                            res.sendStatus(204);
                        }
                        else
                            res.status(403).send({code:0,message:"Missing Permissions"})
                    }
                    else
                        res.status(401).send({code:0,message:"Unauthorized"}) 
                })
            }
            else
                res.status(401).send({code:0,message:"Unauthorized"})
        }
    else if(req.method == "PATCH"){
        verifyuser(req.headers["authorization"]).then(auth=>{
            if(auth.auth){
                if(req.body.newperm!==undefined&&typeof(req.body.newperm)=="number"){
                var newperm = req.body.newperm;
                var reqperm = await new user(auth.id).getperm();
                var requester = new user(auth.id);
                if((await requester.chechperm([user.PERMISSIONS.MANAGE_PERMISSIONS])&&reqperm&newperm==newperm)||await requester.chechperm([user.PERMISSIONS.ADMINISTRATOR])){
                    new user(req.params.id).setperm(newperm);
                    res.sendStatus(204);
                }
                else
                res.status(403).send({code:0,message:"Missing Permissions"})
            }
            else
                res.status(400).send({message:"Invalid body"})
            }
            else
            res.status(401).send({code:0,message:"Unauthorized"}) 
        })
    }
        }
    })
   
}