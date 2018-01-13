var bitcoinjs = require('bitcoinjs-lib');
var bitcoinMessage = require('bitcoinjs-message');
var blockchain = require('cb-blockr');
var assert = require('assert');
var blockchain = new blockchain('testnet');
var Datastore = require('nedb'), db = new Datastore({ filename: 'data.dat' });
var hd;

function createHDNode(tprv){
    if(typeof tprv === 'undefined'){
        keyPair = bitcoinjs.ECPair.makeRandom({network:bitcoinjs.networks.testnet})
        var chainCode = Buffer.alloc(32)
        hd = new bitcoinjs.HDNode(keyPair, chainCode);
        db.insert([{tprv: hd.toBase58()}], function (err, newDocs) { });
    } else {
        hd = new bitcoinjs.HDNode.fromBase58(tprv, bitcoinjs.networks.testnet);
    }
}

db.loadDatabase(function (err) {
    db.find({}, function (err, docs) {
        if(err){

        } else {
            if(docs.length>0){
                //console.log(docs[0]);
                createHDNode(docs[0].tprv);
            } else {
                createHDNode();
            }
            //console.log(hd);
            console.log("BITCOIN WALLET");
            console.log("Address:", hd.getAddress());
            console.log("TPRV:", hd.toBase58());
            blockchain.addresses.unspents(hd.getAddress(), function(err, unspents) {
                console.log(unspents)
            });
        };
    });
});