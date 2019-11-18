//in koa2, we require Koa is a Class 
const Koa = require('koa');
const args = require('args');
const axios = require('axios');

args.option('port', 'the port on which app will be running', 3000)

const flags = args.parse( process.argv );

//注意它返回的是函数
const router = require('koa-router')();

const blockChain = require('./dist/blockChain').BlockChain

// 创建一个Koa对象表示web app本身
const app = new Koa()

blockChain.init(1)

//log request URL:
app.use( async (ctx, next) => {
    console.log(`Process ${ctx.request.method} ${ctx.request.host} ${ctx.request.url}...`)
    await next()
})

router.get('/blocks', async (ctx, next) => {
    ctx.response.body = JSON.stringify(blockChain.getBlocks())
})

router.get('/blocks/:id', async (ctx, next) => {
    var id = ctx.params.id
    if (null == id){
        console.log("invalid parameter")
    }
    let blocks = blockChain.getBlocks()
    if (+id > blocks.length) {
        console.log("block wasn't found!")
        ctx.request.body = "block wasn't found!"
    } else {
        ctx.response.body = JSON.stringify(blocks[+id])
    }
})

router.get('/transations', async (ctx, next) => {
    ctx.response.body = JSON.stringify(blockChain.getTransaction())
})

router.post('/transactions', async (ctx, next) => {
    var sendAddr = ctx.query.sendAddr || "",
        recAddr = ctx.query.recAddr || "",
        value = +ctx.query.value || 0;

    if (!sendAddr || !recAddr || !value) {
        ctx.response.body = "invalid parameter"
    } else {
        blockChain.submitTransaction(sendAddr, recAddr, value)
        ctx.response.body = `transaction from ${sendAddr} to ${recAddr} of ${value} successfully`
    }
})

router.get('/nodes', async (ctx, next) => {
    ctx.response.body = JSON.stringify(blockChain.getNodes())
})

/**
     * @name: /nodes
     * @param:  id, url
     * @return: 
     * @description: 注册节点
     */
router.post('/nodes', async (ctx, next) => {
    var nodeId = ctx.query.id,
        nodeUrl = ctx.query.url || ""
    if (!nodeId || !nodeUrl) {
        ctx.response.body = "invalid parameter"
    } else {
        if ( blockChain.register(nodeId, nodeUrl) ){
            ctx.response.body = `resister node ${nodeId}`
        } else {
            ctx.response.bofy = `node ${nodeId} already exists!`
        }
    }
})

router.put('/nodes/consensus', async (ctx, next) => {
    let reqs = blockChain.getNodes().map(node => axios.get(`${node.url}/blocks`)) //get blocks from all nodes

    if (!reqs.length) {
        ctx.response.body = `no node need to sync`
    } else {
        await axios.all(reqs).then(axios.spread((...blockChains) => {
            if (blockChain.consensus(blockChains.map(res => res.data))) {
                ctx.response.body = `get consensus!`
            } else {
                ctx.response.body = `no consensus get!`
            }
        }))
    }
})

// mineblock
router.get('/mine', async (ctx, next) => {
    const newBlock = blockChain.createBlock() // it may timeout as http keepalive is time limited
    ctx.response.body = `mine new block ${newBlock.blockNumber}`
})

app.use(router.routes())

app.listen(flags.port)
console.log(`app started at ${flags.port}...`)
