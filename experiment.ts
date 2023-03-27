import { IndexedTx, SigningStargateClient, StargateClient } from "@cosmjs/stargate"
import { Tx } from "cosmjs-types/cosmos/tx/v1beta1/tx"
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx"
import { readFile } from "fs/promises"
import { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing"

const rpc = "rpc.sentry-01.theta-testnet.polypore.xyz:26657"

// get alice signer from mnemonic
const getAliceSignerFromMnemonic = async (): Promise<OfflineDirectSigner> => {
    return DirectSecp256k1HdWallet.fromMnemonic((await readFile("./testnet.alice.mnemonic.key")).toString(), {
        prefix: "cosmos",
    })
}

const runAll = async (): Promise<void> => {
    const client = await StargateClient.connect(rpc)

    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())

    // get All Balances
    console.log(
        "Alice balances:",
        await client.getAllBalances("cosmos1l4k7srqh45w9lgdtnagm7heagjm6tq6hmwavdf") // <-- replace with your generated address
    )

    // Get the faucet address
    const faucetTx: IndexedTx = (await client.getTx(
        "43164308B48F1939D882FD23A7230A988AE36C752F29D4739DE394E9D198D547"
    ))!

    // deserialize the transaction
    console.log("Faucet Tx:", faucetTx)
    const decodedTx: Tx = Tx.decode(faucetTx.tx)
    console.log("DecodedTx:", decodedTx)

    // deserialize the message
    const sendMessage: MsgSend = MsgSend.decode(decodedTx.body!.messages[0].value)
    console.log("Sent message:", sendMessage)

    // Get the faucet address another way
    const faucet: string = sendMessage.fromAddress
    console.log("Faucet balances:", await client.getAllBalances(faucet))

    // signing client
    const aliceSigner: OfflineDirectSigner = await getAliceSignerFromMnemonic()
    const alice = (await aliceSigner.getAccounts())[0].address
    console.log("Alice's address from signer", alice)
    const signingClient = await SigningStargateClient.connectWithSigner(rpc, aliceSigner)
    console.log(
        "With signing client, chain id:",
        await signingClient.getChainId(),
        ", height:",
        await signingClient.getHeight()
    )

    // Send tokens
    console.log("Gas fee:", decodedTx.authInfo!.fee!.amount)
    console.log("Gas limit:", decodedTx.authInfo!.fee!.gasLimit.toString(10))
    console.log("Alice balance before:", await client.getAllBalances(alice))
    console.log("Faucet balance before:", await client.getAllBalances(faucet))
    const result = await signingClient.sendTokens(alice, faucet, [{ denom: "uatom", amount: "100000" }], {
        amount: [{ denom: "uatom", amount: "500" }],
        gas: "200000",
    })
    console.log("Transfer result:", result)
    console.log("Alice balance after:", await client.getAllBalances(alice))
    console.log("Faucet balance after:", await client.getAllBalances(faucet))
}

runAll()
