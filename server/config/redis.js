var redis = require("redis");
var client = redis.createClient();

//Initialisation redis
// Supprime le cache des infos
client.del("Tab_stats_vm");
client.keys("InfoVm:*", (err, keys) => {
    for(const k of keys){
        console.log("[Redis] : Sup key : ", k);
        client.del(k);
    }
});
client.keys("NombreVmDemander:*", (err, keys) => {
    for(const k of keys){
        console.log("[Redis] : Sup key : ", k);
        client.del(k);
    }
});
client.keys("SocketDemandeInfo:*", (err, keys) => {
    for(const k of keys){
        console.log("[Redis] : Sup key : ", k);
        client.del(k);
    }
});
client.keys("Socket:*", (err, keys) => {
    for(const k of keys){
        console.log("[Redis] : Sup key : ", k);
        client.del(k);
    }
});


exports.client = client;