var crypto = require('crypto')

const state = {
    blockNumber: 0,
    transaction: [],
    timestamp: Date.now(),
    nonce: 0,
    prevBlock: ""
}

export const Block = {
    generate: (blockNumber, transaction, nonce, prevBlock, timestamp) => {
        state.blockNumber = blockNumber
        state.transaction = transaction
        state.nonce = nonce
        state.prevBlock = prevBlock
        state.timestamp = timestamp || Date.now()
        return Object.assign({}, state)
    },
    computeSha256: (state) => {
        return sha256(JSON.stringify(state))
    },
    init: () => {

    },
}

function sha256(str) {
    var hash = crypto.createHash('sha256')
    hash.update(str)
    return hash.digest('hex')
}