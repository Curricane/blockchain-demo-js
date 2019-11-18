'use strict';

var bignumber_js = require('bignumber.js');
var fs = require('fs');
var path = require('path');

const state = {
    recipientAddr: "",
    senderAddr: "",
    value: 0
};

const Transaction = {
    generate: (rec, sen, val) => {
        state.recipientAddr = rec;
        state.senderAddr = sen;
        state.value = val;
        return Object.assign({}, state);
    }
};

var crypto = require('crypto');

const state$1 = {
    blockNumber: 0,
    transaction: [],
    timestamp: Date.now(),
    nonce: 0,
    prevBlock: ""
};

const Block = {
    generate: (blockNumber, transaction, nonce, prevBlock, timestamp) => {
        state$1.blockNumber = blockNumber;
        state$1.transaction = transaction;
        state$1.nonce = nonce;
        state$1.prevBlock = prevBlock;
        state$1.timestamp = timestamp || Date.now();
        return Object.assign({}, state$1);
    },
    computeSha256: state => {
        return sha256(JSON.stringify(state));
    },
    init: () => {}
};

function sha256(str) {
    var hash = crypto.createHash('sha256');
    hash.update(str);
    return hash.digest('hex');
}

/**
 * 节点数据结构
 * @id：节点id
 * @url：节点url
 */

const state$2 = {
    id: 0,
    url: ""
};

const NodeAction = {
    generate: (id, url) => {
        state$2.id = id;
        state$2.url = url;
        //return { ...state }
        return Object.assign({}, state$2);
    }
};

const COINBASE_SENDER = "<COINBASE";
const COINBASE_REWARD = 50;

const difficuty = 2;
const state$3 = {
    nodeId: 0,
    nodes: [],
    blocks: [],
    transactionPool: [],
    genesisBlock: Block.generate(0, [], 0, ""),
    target: 2 ** (256 - difficuty),
    storagePath: ""
};

const BlockChain = {
    /**
     * @name:init
     * @param: id{Number}
     * @return:null
     * @description: init blockchain
     */
    init: id => {
        state$3.nodeId = id;
        state$3.storagePath = path.resolve(__dirname, "../data/", `${state$3.nodeId}.blockchain`);
        state$3.blocks.push(state$3.genesisBlock);
        BlockChain.save();
    },

    /**
     * @name:register
     * @param: id{nodeId}, url{node url}
     * @return: true{register success}, false{register failed}
     * @description: register node to blockchain
     */
    register: (id, url) => {
        if (state$3.nodes.find(item => item.id == id)) {
            return false;
        } else {
            let node = NodeAction.generate(id, url);
            state$3.nodes.push(node);
            return true;
        }
    },

    getNodes: () => {
        return state$3.nodes;
    },
    getBlocks: () => {
        return state$3.blocks;
    },
    getTransaction: () => {
        return state$3.transactionPool;
    },
    getTarget: () => {
        return state$3.target;
    },
    /**
     * @name:load
     * @param:
     * @return: 
     * @description: get blocks from local json file
     */
    load: () => {
        try {
            state$3.blocks = JSON.parse(fs.readFileSync(state$3.storagePath, "utf-8"));
        } catch (e) {
            console.log("read blockchain failed, init blockchain first");
        }
    },

    /**
     * @name:save
     * @param: 
     * @return: 
     * @description: store blocks to local json file
     */
    save: () => {
        try {
            fs.writeFileSync(state$3.storagePath, JSON.stringify(state$3.blocks), "utf-8");
        } catch (e) {
            console.log("fail to save blockchain");
        }
    },

    /**
     * @name: verify
     * @param: blocks{block array to store blockcain}
     * @return: true{the blocks is valid}, false{the block is invalid}
     * @description: to verufy one blocks is valid or not
     */
    verify: blocks => {
        try {
            if (!blocks.length) {
                console.log("cann't verify empty blocks!");
                throw new Error("cann't verify empty blocks!");
            }
            //verify genesis block
            if (JSON.stringify(state$3.genesisBlock) != JSON.stringify(blocks[0])) {
                throw new Error("genesis block data error!");
            }

            blocks.forEach((item, index) => {
                //verify prevBlock
                if (index > 0 && item.prevBlock != Block.computeSha256(blocks[index - 1])) {
                    throw new Error("invalid prev block sha256");
                }

                //verify pow
                if (index > 0 && BlockChain.isPowValid(Block.computeSha256(item))) {
                    console.log("----verify pow---", Block.computeSha256(item));
                    throw new Error("invalid pow");
                }
            });
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    /**
     * @name:consensus
     * @param: blockChains{some blockchains from nodes}
     * @return: true{consensus success}, false{consensus failed}
     * @description: consensus the longest blockchain
     */
    consensus: blockChains => {
        let maxLength = 0,
            candidateIndex = -1;
        blockChains.forEach((item, index) => {
            console.log("------------------consensus----------------", item, BlockChain.verify(item));
            if (item.length < maxLength) {} else if (BlockChain.verify(item)) {
                maxLength = item.length;
                candidateIndex = index;
            }
        });
        if (candidateIndex >= 0 && (maxLength >= state$3.blocks.length || !BlockChain.verify(state$3.blocks))) {
            state$3.blocks = [...blockChains[candidateIndex]];
            BlockChain.save();
            return true;
        }
        return false;
    },
    submitTransaction: (rec, sen, val) => {
        state$3.transactionPool.push(Transaction.generate(rec, sen, val));
    },
    isPowValid: pow => {
        try {
            if (!pow.startsWith("0x")) {
                pow = "0x" + pow;
            }
            // console.log(new BigNumber(pow))
            // console.log(state.target)
            return new bignumber_js.BigNumber(pow).isLessThanOrEqualTo(state$3.target);
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    mineBlock: (transactions = []) => {
        let lastBlock = state$3.blocks[state$3.blocks.length - 1];

        transactions = [Transaction.generate(COINBASE_SENDER, state$3.nodeId, COINBASE_REWARD), ...transactions];

        const newBlock = Block.generate(lastBlock.blockNumber + 1, transactions, 0, Block.computeSha256(lastBlock));
        while (true) {
            let sha = Block.computeSha256(newBlock);
            console.log("mine block with nonce", newBlock.nonce);
            if (BlockChain.isPowValid(sha) || newBlock.nonce > 10000) {
                //暂时以为10000次计算算满足工作量了
                console.log("found valid pow", sha);
                break;
            }
            newBlock.nonce++;
        }
        return newBlock;
    },
    createBlock: () => {
        const newBlock = BlockChain.mineBlock(BlockChain.transactionPool);
        state$3.blocks.push(newBlock);
        BlockChain.transactionPool = [];
        return newBlock;
    }
};

const mineBlock = () => {
    BlockChain.init(1000);
    BlockChain.submitTransaction("aa", "bb", 100);
    BlockChain.submitTransaction("cc", "dd", 200);
    BlockChain.createBlock();
    BlockChain.save();
};
mineBlock();

var http = require("http");

var options = {
    hostname: "ac.aiskill.komect.com",
    port: 8090
};

var req = http.request(options, function (res) {
    res.setEncoding('utf-8');
    res.on("data", function (chunk) {
        console.log(chunk.toString());
    });
    console.log(res.statusCode);
});

req.on("error", function (err) {
    console.log(err.message);
});

req.end();
