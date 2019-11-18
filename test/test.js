import { BlockChain } from "../src/blockChain"
import { Block } from "../src/block"

const testPow = () => {
    let newBlock = Block.generate(0, [], 1, "")
    let sha = Block.computeSha256(newBlock)
    console.log("sha:", sha)
    console.log("target:", BlockChain.getTarget)
    console.log("isPowvalid", BlockChain.isPowValid(sha))
}

const mineBlock = () => {
    BlockChain.init(1000)
    BlockChain.submitTransaction("aa", "bb", 100)
    BlockChain.submitTransaction("cc", "dd", 200)
    BlockChain.createBlock()
    BlockChain.save()
}
mineBlock()

var http = require("http")

var options = {
    hostname: "ac.aiskill.komect.com",
    port : 8090,
}

var req = http.request(options, function(res){
    res.setEncoding('utf-8');
    res.on("data", function(chunk){
        console.log(chunk.toString())
    });
    console.log(res.statusCode);
});

req.on("error", function(err){
    console.log(err.message);
});

req.end();
