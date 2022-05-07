import { requestjson } from "./functions.js";
import { createRequire } from "module";
import { response } from "express";
const require = createRequire(import.meta.url);
const config = require("./config.json");
export class oauth2{
    #config
    /**
     * 
     * @param {String} token 
     * @param {String} rtoken 
     */
    constructor(token,rtoken){
        this.#config = require("./config.json")
        this.token = token;
        this.rtoken = rtoken;
    }
async getuser(){
        let headers = {
            "Authorization":"Bearer "+this.token
        }
        var request = await requestjson("https://discord.com/api/users/@me","GET",{},headers)
        var response = await request;
        return request;
}
async getguildmember(guildid){
        let headers = {
            "Authorization":"Bearer "+this.token
        }
        try{
        var request = await requestjson(`https://discord.com/api/users/@me/guilds/${guildid}/member`,"GET",{},headers)
        var reponse = await request
        return request;
        }
        catch(err){
            return undefined
        }
}
}