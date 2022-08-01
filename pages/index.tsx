import Products from '../components/Products';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import SiteHeading from '../components/SiteHeading';

export default function HomePage() {
  // To get the public key of the currently connected wallet, if any present
   const { publicKey } = useWallet();

    return (
        <div className="flex flex-col gap-8 max-w-4xl items-stretch m-auto pt-24">
      <SiteHeading>FemPure</SiteHeading>
      {/* Adding Sola"na wallet connect button */}
      <div className="basis-1/4">
        <WalletMultiButton className='!bg-gray-900 hover:scale-105' />
      </div>
      {/* we disable checkout page until a connected Wallet */}
      <Products submitTarget='/checkout' enabled={publicKey !== null} />
    </div>
    )
}
