import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import Head from 'next/head'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

// Default styles that can be overridden by app
require('@solana/wallet-adapter-react-ui/styles.css');


function Myapp({ Component, pageProps }: AppProps) {

  // Used in setting network to 'devnet' or 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // can also provide a custom RPC endpoint.
  const endpoint = clusterApiUrl(network);


  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.

  const wallets = [ new PhantomWalletAdapter(), new SolflareWalletAdapter({network}), ];

  return (
    <ConnectionProvider endpoint={endpoint}> 
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
        <Layout>
          <Head>
            <title>My page</title>
          </Head>
         <Component {...pageProps} />
       </Layout>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default Myapp