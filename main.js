var bitcoinjs = require('bitcoinjs-lib');
//var bitcoinMessage = require('bitcoinjs-message');
var base64Img = require('base64-img');
var blockexplorer = require('blockchain.info/blockexplorer').usingNetwork(3);
var pushtx = require('blockchain.info/pushtx').usingNetwork(3);
var assert = require('assert');
var Datastore = require('nedb'), db = new Datastore({ filename: 'data.dat' });
var conv = require('binstring');
var async = require('async');
var hd, img;
var fee = 1000000;

base64Img.base64('img/ico.bmp', function(err, data) {
    var image = data.split("base64,");
    img = image[1];
})

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

function getBalance(address, utxo, cb){
    blockexplorer.getBalance(address)
    .then((balance) => {
        if(balance[address].total_received && balance[address].final_balance && utxo.unspent_outputs[0].length == 0)
            cb(true, utxo, {});
        else cb(null, utxo, balance);
    })
    .catch((err) => {
        cb(true, utxo, {});
    })
}

function getUTXO(address, cb){
    blockexplorer.getUnspentOutputs(address, {confirmations:1})
    .then((utxo) => {
        getBalance(address, utxo, cb);
    })
    .catch((err) => {
        getBalance(address, {}, cb);
    })
}

function pushTX(transaction, cb){
    pushtx.pushtx(transaction)
    .then((result) => { console.log(result); cb(null)})
    .catch((err) => { console.log(err); cb(true)})
}

function moveAll(from, to, op_return, cb){
    getUTXO(from.getAddress(), function(err, utxo, balance){
        if(!err){
            if(Object.keys(utxo).length>0){
                if(utxo.unspent_outputs.length>0){
                    utxo.unspent_outputs.forEach(function(tx) {
                        tx.tx_hash = tx.tx_hash.match(/[a-fA-F0-9]{2}/g).reverse().join('');
                    });
                    var txb = new bitcoinjs.TransactionBuilder(bitcoinjs.networks.testnet);
                    var utxo_arry = utxo.unspent_outputs;
                    utxo_arry.forEach(function(tx) {
                        txb.addInput(tx.tx_hash, 0);
                    });

                    txb.addOutput(to.getAddress(), balance[from.getAddress()].final_balance-fee);

                    if(op_return.length > 0){
                        var data = Buffer.from(op_return, 'utf8');
                        var dataScript = bitcoinjs.script.nullData.output.encode(data);
                        txb.addOutput(dataScript, 0);
                    }

                    var i = 0;
                    txb.inputs.forEach(function(vin) {
                        txb.sign(i, from.keyPair);
                        i++;
                    });
                    console.log("tx:", txb.build().toHex());
                    return pushTX(txb.build().toHex(), cb);
                } else { console.log(from.getAddress(), "UTXO array is empty"); cb(true); }
            } else { console.log(from.getAddress(), "next"); cb(null); }
        } else { console.log(from.getAddress(), "UTXO array is empty, balance is 0"); cb(true); }
    });
}

function getTXs(address, cb){
    blockexplorer.getAddress(address)
    .then((data) => {
        if(data.txs.length>0){
            if(data.txs.length>1){
                nextHash = data.txs[0].hash;
                hash = data.txs[1].hash;
            }
            else {
                nextHash = null;
                hash = data.txs[0].hash;
            }
            blockexplorer.getTx(hash)
            .then((tx) => {
                console.log("TX:", address, hash);
                console.log("TX script:", tx.out[1].script.slice(4));
                console.log("OP_RETURN:", conv(tx.out[1].script.slice(4), { in:'hex', out:'utf8' }));
                
                if(nextHash !== null)
                    blockexplorer.getTx(nextHash)
                    .then((nextTX) => {
                        console.log("NEXT address:", nextTX.out[0].addr);
                        nextAddr = nextTX.out[0].addr;
                        return cb(null, conv(tx.out[1].script.slice(4), { in:'hex', out:'utf8' }), nextAddr);
                    })
                    .catch((err) => {
                    throw err
                    })
                else
                    return cb(null, conv(tx.out[1].script.slice(4), { in:'hex', out:'utf8' }), null);
            })
            .catch((err) => {
            throw err
            })
        }
    })
    .catch((err) => {
      throw err
    })
}

db.loadDatabase(function (err) {
    db.find({}, function (err, docs) {
        if(err){

        } else {
            if(docs.length>0){
                createHDNode(docs[0].tprv);
            } else {
                createHDNode();
            }
            console.log("BITCOIN WALLET");
            console.log("Testnet address:", hd.getAddress());
            console.log("Testnet private key:", hd.toBase58());

            var master = hd.derivePath('m/44\'/0\'/0\'/0/0\'');
            console.log("Master address:", master.getAddress());

            var m1 = hd.derivePath('m/44\'/0\'/0\'/0/1\'');
            console.log("M1 address:", m1.getAddress());

            var m2 = hd.derivePath('m/44\'/0\'/0\'/0/2\'');
            console.log("M2 address:", m2.getAddress());

            var m3 = hd.derivePath('m/44\'/0\'/0\'/0/3\'');
            console.log("M3 address:", m3.getAddress());

            var m4 = hd.derivePath('m/44\'/0\'/0\'/0/4\'');
            console.log("M4 address:", m4.getAddress());

            var m5 = hd.derivePath('m/44\'/0\'/0\'/0/5\'');
            console.log("M5 address:", m5.getAddress());

            var d1 = img.slice(0, 40);
            var d2 = img.slice(40, 40+40);
            var d3 = img.slice(40+40, 40+40+40);
            var d4 = img.slice(40+40+40, 40+40+40+40);
            var d5 = img.slice(40+40+40+40);

            console.log(d1, d1.length);
            console.log(d2, d2.length);
            console.log(d3, d3.length);
            console.log(d4, d4.length);
            console.log(d5, d5.length);

            /*
            async.waterfall([
                function(callback) {
                    async.retry({times: 15, interval: 60000*2}, function(cb){ moveAll(hd, master, "", cb) }, function(err, result) {
                        console.log(err, result);
                        callback(err);
                    });
                },
                function(callback) {
                    async.retry({times: 15, interval: 60000*2}, function(cb){ moveAll(master, m1, d1, cb) }, function(err, result) {
                        console.log(err, result);
                        callback(err);
                    });
                },
                function(callback) {
                    async.retry({times: 15, interval: 60000*2}, function(cb){ moveAll(m1, m2, d2, cb) }, function(err, result) {
                        console.log(err, result);
                        callback(err);
                    });
                },
                function(callback) {
                    async.retry({times: 15, interval: 60000*2}, function(cb){ moveAll(m2, m3, d3, cb) }, function(err, result) {
                        console.log(err, result);
                        callback(err);
                    });
                },
                function(callback) {
                    async.retry({times: 15, interval: 60000*2}, function(cb){ moveAll(m3, m4, d4, cb) }, function(err, result) {
                        console.log(err, result);
                        callback(err);
                    });
                },
                function(callback) {
                    async.retry({times: 15, interval: 60000*2}, function(cb){ moveAll(m4, m5, d5, cb) }, function(err, result) {
                        console.log(err, result);
                        callback(err);
                    });
                }
            ], function (err, result) {
                console.log(err, result);
            });*/

            //moveAll(m3,m4,d4);

            var data_from_op_return = "";

            async.waterfall([
                function(callback) {
                    getTXs(m1.getAddress(), callback);
                },
                function(arg1, arg2, callback) {
                    data_from_op_return += arg1;
                    getTXs(arg2, callback);
                },
                function(arg1, arg2, callback) {
                    data_from_op_return += arg1;
                    getTXs(arg2, callback);
                },
                function(arg1, arg2, callback) {
                    data_from_op_return += arg1;
                    getTXs(arg2, callback);
                },
                function(arg1, arg2, callback) {
                    data_from_op_return += arg1;
                    getTXs(arg2, callback);
                },
            ], function (err, result) {
                if(!err){
                    data_from_op_return += result;
                    console.log(data_from_op_return);
                    base64Img.img('data:image/bmp;base64,'+data_from_op_return, 'download', 'image', function(err, filepath) {

                    });
                }
            });

        };
    });
});