import { useRouter } from "next/router";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { useEffect, useState, useMemo } from "react";
import BackLink from "../components/BackLink";
import Loading from "../components/Loading";
import { MakeTransactionInputData, MakeTransactionOutputData } from "./api/makeTransaction";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { findReference, FindReferenceError } from "@solana/pay";



export default function Checkout() {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey , sendTransaction } = useWallet();

  // state to hold API response fields
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Read the URL query(conatins products chosen by the user)

  const searchParams = new URLSearchParams();
  for(const [key, value] of Object.entries(router.query)) {
    if(value){
      if(Array.isArray(value)){
        for(const val of value){
          searchParams.append(key, val);
        }
      }else {
        searchParams.append(key, value);
      }
    }
  }

  // Generate the unique reference which will be used to track the transaction
  const reference = useMemo(() => Keypair.generate().publicKey, []);

  //adding it to params well make it available to the API
  searchParams.append('reference', reference.toString());

  // Using API to fetch the transaction of selected products
  async function getTransaction() 
  {
   if(!publicKey){
    return;
   } 
  const body: MakeTransactionInputData = {
    account: publicKey.toString(),
  }
    const response = await fetch(`/api/makeTransaction?${searchParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    })
  

  const json = await response.json() as MakeTransactionOutputData;

  if( response.status !== 200) {
    console.error(json);
    return;
  }

  //Deserialize the transaction from response
  const transaction = Transaction.from(Buffer.from(json.transaction, 'base64'));
  setTransaction(transaction);
  setMessage(json.message);
  console.log(transaction);
}

useEffect(() => {
  getTransaction()
},[ publicKey ])

 // Send the fetched transaction to the connected wallet
 async function trySendTransaction() {
  if (!transaction) {
    return;
  }
  try {
    await sendTransaction(transaction, connection)
  } catch (e) {
    console.error(e)
  }
}
// send the transaction once its fetched
 useEffect(() => {
  trySendTransaction()
}, [transaction])

// check every 0.5 seconds if the transaction is confirmed
useEffect(() => {
  const interval = setInterval(async () => {
    try{
      //check if any transaction for reference
      const signatureInfo = await findReference( connection, reference);
      router.push('/confirmed')

    } catch (e) {
      if ( e instanceof FindReferenceError) {
        // no transaction found lets ignore this error
        return;
    }
    console.error('Unkown error', e)
  }
}, 500)
return () =>{
 clearInterval(interval)
}
}, [])


if (!PublicKey) {
  return(
    <div className='flex flex-col gap-8 items-center'>
    <div><BackLink href='/'>Cancel</BackLink></div>

    <WalletMultiButton />

    <p>You need to connect your wallet to make transactions</p>
  </div>
  )
}


  return(
    <div className="flex flex-col gap-8 items-center">
    <div><BackLink href='/'>Cancel</BackLink></div>

    <WalletMultiButton/>

    {message?
    <p>{message} Please approve the transaction using your wallet</p>:
    <p> creating transacrtion .. <Loading/></p>
    }
  </div>
  )
}