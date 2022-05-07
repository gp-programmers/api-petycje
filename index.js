import { createRequire } from "module";
import { db } from "./db.js";
import { obtainoauth2 } from "./functions.js";
import { petitions } from "./routes/petitions.js";
import { users } from "./routes/users.js";
import bodyParser from "body-parser";

const require = createRequire(import.meta.url);
const express = require("express")
var app = express()
const config = require("./config.json")
const dbc  = new db()
app.use(bodyParser());
app.use("/",(req,res,next)=>{
    res.set('Access-Control-Allow-Origin', 'http://localhost:8080');
    if(req.method=="OPTIONS"){

    
        res.set("Access-Control-Allow-Headers","authorization");}
    next()
})
app.get("/",(req,res)=>{
    res.status(200).send({code:0,message:"Working properly"})
})
app.use("/verify",(req,res)=>{
    if(req.method=="GET"){
    if(req.headers["authorization"]){
        dbc.verify(req.headers["authorization"]).then(json=>{
            res.status(json.auth?200:401).send(json)
        })
    }
    else{
        res.status(401).send({auth:false})
    }}
    else
        res.sendStatus(204);
})
app.get("/login",(req,res)=>{
    obtainoauth2(req.query.code,config.ouath_url,effect=>{
        if(!effect)
            res.status(400).send({code:-1,message:"Error while processing your request"});
        else{
            dbc.register(effect["access_token"],effect["refresh_token"]).then(effectt=>{
                if(effectt === undefined)
                    res.status(400).send({code:-1,message:"Error while processing your request"});
                else
                    res.status(200).send({code:0,token:effectt})
            })
            
        }
    })
})
users(app);
petitions(app);
app.delete("/logout",(req,res)=>{
    if(req.headers["authorization"]!==undefined){
        dbc.logout(req.headers["authorization"]);
        res.sendStatus(204)
    }
    else
        res.status(400).send({message:"You aren't loginned"})
})
app.use("/",(req,res)=>{

    res.status(404).send({code:0,message:"404 Not found"});
})
app.listen(config.port,()=>{
    console.log(`Listening on port ${config.port}`);
})