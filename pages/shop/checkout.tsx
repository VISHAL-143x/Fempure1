import { useRouter } from 'next/router';
import { useEffect, useMemo , useRef} from 'react';
import BackLink from '../../components/BackLink';
import PageHeading from '../../components/PageHeading';
import calculatePrice from '../../lib/calculatePrice';
import { createQR, encodeURL, findReference, FindReferenceError, TransferRequestURLFields, validateTransfer, ValidateTransferError } from "@solana/pay";
import { shopAddress, usdcAddress } from '../../lib/addresses';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl, Connection, Keypair } from '@solana/web3.js';



export default function Checkout() {
    const router = useRouter()

    // ref to div where QR code will be rendered
    const qrRef = useRef<HTMLDivElement>(null)

    // unique address that we can listen for payments to
    const reference = useMemo(() => Keypair.generate().publicKey, [])

    // Get a connection to Solana devnet
    const network = WalletAdapterNetwork.Devnet
    const endpoint = clusterApiUrl(network)
    const connection = new Connection(endpoint)

    const amount = useMemo(() => calculatePrice(router.query), [router.query])

    // Solana Pay transfer params
    const urlParams: TransferRequestURLFields = {
        recipient: shopAddress,
        splToken: usdcAddress,
        amount,
        reference,
        label: "Chocolate Inc",
        message: "Thank you for your purchase!🍪 ",
    }
    /* Add a new useEffect to detect payment */
    // Check every 0.5s if the transacation has been confirmed
    useEffect(() => {
        const interval = setInterval(async () => {
            try{
                // check if there is a transaction with the same reference
                const signatureInfo = await findReference(connection, reference, {finality: 'confirmed'})
                // validate that the transaction has the expected recipient, amount and spl token
                await validateTransfer(
                    connection,
                    signatureInfo.signature,
                    {
                        recipient: shopAddress,
                        amount,
                        splToken: usdcAddress,
                        reference,
                    },
                    { commitment: 'confirmed' }
                ) 
                router.push('/shop/confirmed')
            } catch (e) {
                if ( e instanceof FindReferenceError){
                    // do nothing if the transaction is not found
                    return;
                }
                if (e instanceof ValidateTransferError){
                    // transaction is invalid
                    console.error('transaction is inavlid', e)
                    return;
                }
                console.error('unknown error', e)
            }
    },500)
    return () => clearInterval(interval)
}, [])



    // Encode the params into the format shown

    const url = encodeURL(urlParams)
    console.log({urlParams})

    // display the QR code
    useEffect(() => {
        const qr = createQR(url, 512, 'transparent')
        if(qrRef.current && amount.isGreaterThan(0)){
            qrRef.current.innerHTML = ''
            qr.append(qrRef.current)
        }
    })


    return(
        <div className="flex flex-col gap-8 items-center">
        <BackLink href='/shop'>Cancel</BackLink>
        <PageHeading>Checkout ${amount.toString()}</PageHeading>

        {/* QR code Display */}
        <div ref={qrRef}/>
      </div>
    )
}
