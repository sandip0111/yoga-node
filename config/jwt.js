const jwt = require('jsonwebtoken');
const Users= require('../models/UserModel');

var permissions= []

module.exports =
{ 
    genToken : function(payload)
    {
        console.log("Token Generation")
        return new Promise(function(resolve,reject)
        {
            jwt.sign({payload},process.env.jwtSecret,{expiresIn : '31d'},function(err,token)
            {
                if(err)
                {
                    console.log(err);
                    reject(err);
                }
                else
                {
                    resolve(token);
                }
            });
        });
    },
    refreshToken : function(){
        // jwt.verify
    },
    checkToken : function(req,res,next){
        console.log("Check Token")
        const header = req.headers.authorization;
        if(typeof header !== 'undefined'){
            const bearer = header.split(' ');
            const token = bearer[1]

            jwt.verify(token,process.env.jwtSecret,function (err,authorizedata){
                console.log("JWT Error : ",err);
                if(err)
                {
                    res.status(401).json({message : err.message});
                }
                else
                {
                    req.payload=authorizedata.payload;
                    next();
                }
            });
        }
        else{
            res.status(401).json({message : "Login Required"});
        }
    },
    checkDashboadToken : async function(req,res,next){
        const header = req.headers.authorization;
        if(typeof header !== 'undefined'){
            const bearer = header.split(' ');
            const token = bearer[1]

            jwt.verify(token,process.env.jwtSecret, async function (err,authorizedata){
                if(err)
                {
                    return res.status(401).json({message : err.message});
                }
                else
                {
                    req.payload=authorizedata.payload;
                    let aUser=await Users.findOne({email:req.payload});
                    if(!aUser){
                        console.log("user not found==>",req.payload);
                        return res.status(401).json({message : "not authorised"});
                    }
                    // if(!permissions.length){
                    //     permissions=Permission.find({});
                    // }
                    
                    // for (const perm of permissions) {
                    //     if()
                    // }
                    
                    // else if(aUser.role.includes('user') || aUser.role.includes('affiliate') || aUser.role.includes('business')){
                    //     console.log("user found==>",aUser.role);
                    //     res.status(403).json({message : "not authorised"});
                    // }
                    else{
                        req.user=aUser;
                    }
                    next();
                }
            });
        }
        else{
            res.status(401).json({message : "Authorization Failed"});
        }
    },
     
}
