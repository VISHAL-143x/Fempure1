import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { NextApiRequest, NextApiResponse } from 'next';
import { shopAddress, usdcAddress } from '../../lib/addresses';
import calculatePrice from '../../lib/calculatePrice';
import { createTransferCheckedInstruction, getAssociatedTokenAddress, getMint } from '@solana/spl-token';

export type MakeTransactionInputData = {
    account : string,
}
export type MakeTransactionOutputData = {
    transaction : string,
    message : string,
}
type ErrorOutput = {
    error : string
}

export default async function handler(
    req : NextApiRequest,
    res : NextApiResponse<MakeTransactionOutputData | ErrorOutput>
){
    try{
        // Here pass the selected items in the query, calculate the expected cost price
        const amount = calculatePrice(req.query);
        if(amount.toNumber() === 0){
            res.status(400).json({ error: "Cant checkout with charge of 0" })
            return
        }

        // we pass the reference to use in the query
        const {reference} = req.query
        if(!reference){
            res.status(400).json({ error: "No reference passed" })
            return
        }

        // we pass the buyers public key in JSON body
        const {account} = req.body as MakeTransactionInputData
        if(!account){
            res.status(400).json({ error: "No account provided" })
            return
        }
        const buyerPublicKey = new PublicKey(account)
        const shopPublicKey = shopAddress

        // intialize a connection to Solana Network(devnet here)

        const network = WalletAdapterNetwork.Devnet
        const endpoint = clusterApiUrl(network)
        const connection = new Connection(endpoint)

        // get details about USDC token
        const usdcMint = await getMint(connection, usdcAddress)

        // get the buyer's USDC token account address
        const buyersUsdcAddress = await getAssociatedTokenAddress(usdcAddress, buyerPublicKey)

        // get the shop's USDC token account address
        const shopsUsdcAddress = await getAssociatedTokenAddress(usdcAddress, shopAddress)

        // get a recent block hash to include in the transaction
        //so transaction should only be valid for a short time

        const { blockhash } = await (connection.getLatestBlockhash('finalized'))

        const transaction = new Transaction({
            recentBlockhash: blockhash,
            // the buyer pays the transaction fee
            feePayer: buyerPublicKey,
        })

        // create the instruction to send crypto token(now USDC) from buyer to the shop
        const transferInstruction = createTransferCheckedInstruction(
            buyersUsdcAddress, //source
            usdcAddress, // mint (token address)
            shopsUsdcAddress, //destination
            buyerPublicKey, // owner of source address
            amount.toNumber() * (10 ** (await usdcMint).decimals), // amount to transfer(in units of usdc token)
            usdcMint.decimals, // decimals of the token

        )

        // add the instruction to the transaction as a key
        // this will mean this transaction is returned as a result of the query for reference
        transferInstruction.keys.push({
            pubkey: new PublicKey(reference),
            isSigner: false,
            isWritable: false,
        })

        // add the instruction to the transaction
        transaction.add(transferInstruction)

        //serialize the transaction and convert to base64 to return it
        const serializedTransaction = transaction.serialize({
            // will require buyer to sign the transaction after its returned to them
            requireAllSignatures: false,
        })
        const base64 = serializedTransaction.toString('base64')

        // Insert into database: reference, amount

        // return the serialized transaction
        res.status(200).json({
            transaction: base64,
            message: "thanks for your order 🍪",
        })
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'error creating transaction', })
        return
    }
}
