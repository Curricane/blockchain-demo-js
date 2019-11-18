import { Transaction } from './transaction'
import { Block } from './block'
import { NodeAction } from "./node"
import { BigNumber } from 'bignumber.js'

import * as fs from "fs"
import * as path from "path"

const COINBASE_SENDER = "<COINBASE";
const COINBASE_REWARD = 50;

const difficuty = 2
const state = {
    nodeId: 0,
    nodes: [],
    blocks: [],
    transactionPool: [],
    genesisBlock: Block.generate(0, [], 0, ""),
    target: 2 ** (256 - difficuty),
    storagePath: "",
}

export const BlockChain = {
    /**
     * @name:init
     * @param: id{Number}
     * @return:null
     * @description: init blockchain
     */
    init: (id) => {
        state.nodeId = id
        state.storagePath = path.resolve(__dirname, "../data/", `${state.nodeId}.blockchain`)
        state.blocks.push(state.genesisBlock)
        BlockChain.save()
    },

    /**
     * @name:register
     * @param: id{nodeId}, url{node url}
     * @return: true{register success}, false{register failed}
     * @description: register node to blockchain
     */
    register: (id, url) => {
        if (state.nodes.find(item => item.id == id)){
            return false
        } else {
            let node = NodeAction.generate(id, url)
            state.nodes.push(node)
            return true
        }  
    },

    
    getNodes: () => {
        return state.nodes
    },
    getBlocks: () => {
        return state.blocks
    },
    getTransaction: () => {
        return state.transactionPool
    },
    getTarget: () => {
        return state.target
    },
    /**
     * @name:load
     * @param:
     * @return: 
     * @description: get blocks from local json file
     */
    load: () => {
        try {
            state.blocks = JSON.parse(fs.readFileSync(state.storagePath, "utf-8"))
        } catch (e) {
            console.log("read blockchain failed, init blockchain first")
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
            fs.writeFileSync(state.storagePath, JSON.stringify(state.blocks), "utf-8")
        } catch (e) {
            console.log("fail to save blockchain")
        }
    },

    /**
     * @name: verify
     * @param: blocks{block array to store blockcain}
     * @return: true{the blocks is valid}, false{the block is invalid}
     * @description: to verufy one blocks is valid or not
     */
    verify: (blocks) => {
        try {
            if (!blocks.length) {
                console.log("cann't verify empty blocks!")
                throw new Error("cann't verify empty blocks!")
            }
            //verify genesis block
            if (JSON.stringify(state.genesisBlock) != JSON.stringify(blocks[0])){
                throw new Error("genesis block data error!")
            }

            blocks.forEach((item, index) => {
                //verify prevBlock
                if (index > 0 && item.prevBlock != Block.computeSha256(blocks[index - 1])) {
                    throw new Error("invalid prev block sha256")
                }

                //verify pow
                if (index > 0 && BlockChain.isPowValid(Block.computeSha256(item))) {
                    console.log("----verify pow---", Block.computeSha256(item))
                    throw new Error("invalid pow")
                }
            })
            return true
        } catch (e) {
            console.log(e)
            return false
        }
    },
    /**
     * @name:consensus
     * @param: blockChains{some blockchains from nodes}
     * @return: true{consensus success}, false{consensus failed}
     * @description: consensus the longest blockchain and verify it
     */
    consensus: (blockChains) => {
        let maxLength = 0, candidateIndex = -1;
        blockChains.forEach((item, index) => {
            console.log("------------------consensus----------------", item, BlockChain.verify(item))
            if (item.length < maxLength) {

            } else if (BlockChain.verify(item)) {
                maxLength = item.length;
                candidateIndex = index;
            }
        })
        if (candidateIndex >= 0 && (maxLength >= state.blocks.length || !BlockChain.verify(state.blocks))) {
            state.blocks = [...blockChains[candidateIndex]]
            BlockChain.save()
            return true
        }
        return false
    },
    submitTransaction: (rec, sen, val) => {
        state.transactionPool.push(Transaction.generate(rec, sen, val))
    },
    isPowValid: (pow) => {
        try {
            if (!pow.startsWith("0x")) {
                pow = "0x" + pow
            }
            // console.log(new BigNumber(pow))
            // console.log(state.target)
            return new BigNumber(pow).isLessThanOrEqualTo(state.target)
        } catch (e) {
            console.log(e)
            return false
        }
    },
    mineBlock: (transactions = []) => {
        let lastBlock = state.blocks[state.blocks.length-1]
        
        transactions = [Transaction.generate(COINBASE_SENDER, state.nodeId, COINBASE_REWARD), ...transactions]

        const newBlock = Block.generate(lastBlock.blockNumber+1, transactions, 0, Block.computeSha256(lastBlock))
        while (true) {
            let sha = Block.computeSha256(newBlock)
            console.log("mine block with nonce", newBlock.nonce)
            if (BlockChain.isPowValid(sha)|| newBlock.nonce > 10000) { //暂时以为10000次计算算满足工作量了
                console.log("found valid pow", sha)
                break
            }
            newBlock.nonce++
        }
        return newBlock
    },
    createBlock: () => {
        const newBlock = BlockChain.mineBlock(BlockChain.transactionPool)
        state.blocks.push(newBlock)
        BlockChain.transactionPool = []
        return newBlock
    }
}