"use strict";

import fetch from 'node-fetch';

export const SNIPER_GUILD_ID = "url düştüğünde hangi swye çekilecek idyi gir";

export const SNIPER_SELF_TOKEN = "buraya token gir knk";

export const URL_SNIPER_SELF_TOKEN = "burayada aynı tokeni gir";

export const WEBHOOKS = {

    SUCCESS: async (content) => {
    
        await fetch(`buraya 1. webhooku gir`, {
    
        method: "POST",
    
        headers: {
    
            "Content-Type": "application/json",
    
        },
    
        body: JSON.stringify({
    
            content,
    
            username: "^^",
    
        }),
    
    });
    
},
    INFO: async (content) => {
        
        await fetch(`2. webhooku gir`, {
        
        method: "POST",
        
        headers: {
        
        
            "Content-Type": "application/json",
        
        },
        
        body: JSON.stringify({
        
            content,
        
            username: "^^",
        
        }),
        
    });
    
},

FAIL: async (content) => {

    await fetch(`3. webhooku gir`, {

    method: "POST",

    headers: {

        "Content-Type": "application/json",

    },

    body: JSON.stringify({

        content,

        username: "^^",

    }),

});

},

};
