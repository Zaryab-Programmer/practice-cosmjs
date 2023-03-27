import { IndexedTx, StargateClient } from "@cosmjs/stargate"
import { Tx } from "cosmjs-types/cosmos/tx/v1beta1/tx"
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx"


const rpc = "rpc.sentry-01.theta-testnet.polypore.xyz:26657";

const runAll = async(): Promise<void> => {
    const client = await StargateClient.connect(rpc);

    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())
    
    // get All Balances
    console.log(
        "Alice balances:",
        await client.getAllBalances("cosmos1gd3lmm3p3rv2g5nuvz7vxpcmemuc4czwjrs5hp"), // <-- replace with your generated address
    )

    // Get the faucet address
    const faucetTx: IndexedTx = (await client.getTx(
        "43164308B48F1939D882FD23A7230A988AE36C752F29D4739DE394E9D198D547",
    ))!
    
    // deserialize the transaction
    console.log("Faucet Tx:", faucetTx)
    const decodedTx: Tx = Tx.decode(faucetTx.tx)
    console.log("DecodedTx:", decodedTx)

    // deserialize the message
    const sendMessage: MsgSend = MsgSend.decode(decodedTx.body!.messages[0].value)
    console.log("Sent message:", sendMessage)

    const faucet: string = sendMessage.fromAddress
    console.log("Faucet balances:", await client.getAllBalances(faucet))
}

runAll()