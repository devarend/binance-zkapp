import '../styles/globals.css'
import { useEffect, useState } from "react";
import './reactCOIServiceWorker';
import ZkappWorkerClient from './zkappWorkerClient';
import {
  PublicKey,
  PrivateKey,
  Field, Signature,
} from 'snarkyjs'
import Button from "../components/button/Button";
import CTAModal from "../components/modal/CTAModal";
import Spinner from "../components/icons/Spinner";
import axios from "axios";

let transactionFee = 0.1;

export default function App() {

  let [state, setState] = useState({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    hasBeenSetup: false,
    accountExists: false,
    currentNum: null as null | Field,
    publicKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
    creatingTransaction: false,
  });

  // -------------------------------------------------------
  // Do Setup

  useEffect(() => {
    (async () => {
      if (!state.hasBeenSetup) {
        const zkappWorkerClient = new ZkappWorkerClient();

        console.log('Loading SnarkyJS...');
        await zkappWorkerClient.loadSnarkyJS();
        console.log('done');

        await zkappWorkerClient.setActiveInstanceToBerkeley();

        const mina = (window as any).mina;

        if (mina == null) {
          setState({ ...state, hasWallet: false });
          return;
        }

        const publicKeyBase58 : string = (await mina.requestAccounts())[0];
        const publicKey = PublicKey.fromBase58(publicKeyBase58);

        console.log('using key', publicKey.toBase58());

        console.log('checking if account exists...');
        const res = await zkappWorkerClient.fetchAccount({ publicKey: publicKey! });
        const accountExists = res.error == null;

        await zkappWorkerClient.loadContract();

        console.log('compiling zkApp');
        await zkappWorkerClient.compileContract();
        console.log('zkApp compiled');

        const zkappPublicKey = PublicKey.fromBase58('B62qph2VodgSo5NKn9gZta5BHNxppgZMDUihf1g7mXreL4uPJFXDGDA');

        await zkappWorkerClient.initZkappInstance(zkappPublicKey);

        console.log('getting zkApp state...');
        await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey })
        const currentNum = await zkappWorkerClient.getNum();
        console.log('current state:', currentNum.toString());

        setState({
          ...state,
          zkappWorkerClient,
          hasWallet: true,
          hasBeenSetup: true,
          publicKey,
          zkappPublicKey,
          accountExists,
          currentNum
        });
      }
    })();
  }, []);

  // -------------------------------------------------------
  // Wait for account to exist, if it didn't

  useEffect(() => {
    (async () => {
      if (state.hasBeenSetup && !state.accountExists) {
        for (;;) {
          console.log('checking if account exists...');
          const res = await state.zkappWorkerClient!.fetchAccount({ publicKey: state.publicKey! })
          const accountExists = res.error == null;
          if (accountExists) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        setState({ ...state, accountExists: true });
      }
    })();
  }, [state.hasBeenSetup]);

  // -------------------------------------------------------
  // Send a transaction

  const onSendTransaction = async (id: Field, bnbBalance: Field, signature: Signature) => {
    setState({ ...state, creatingTransaction: true });
    console.log('sending a transaction...');

    await state.zkappWorkerClient!.fetchAccount({ publicKey: state.publicKey! });

    await state.zkappWorkerClient!.createUpdateTransaction(id, bnbBalance, signature);

    console.log('creating proof...');
    await state.zkappWorkerClient!.proveUpdateTransaction();

    console.log('getting Transaction JSON...');
    const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON()

    console.log('requesting send transaction...');
    const { hash } = await (window as any).mina.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
        fee: transactionFee,
        memo: '',
      },
    });

    console.log(
        'See transaction at https://berkeley.minaexplorer.com/transaction/' + hash
    );

    setState({ ...state, creatingTransaction: false });
  }

  // -------------------------------------------------------
  // Refresh the current state

  const onRefreshCurrentNum = async () => {
    console.log('getting zkApp state...');
    await state.zkappWorkerClient!.fetchAccount({ publicKey: state.zkappPublicKey! })
    const currentNum = await state.zkappWorkerClient!.getNum();
    console.log('current state:', currentNum.toString());

    setState({ ...state, currentNum });
  }

  // -------------------------------------------------------
  // Create UI elements

  let hasWallet;
  if (state.hasWallet != null && !state.hasWallet) {
    const auroLink = 'https://www.aurowallet.com/';
    const auroLinkElem = <a href={auroLink} target="_blank" rel="noreferrer"> [Link] </a>
    hasWallet = <div> Could not find a wallet. Install Auro wallet here: { auroLinkElem }</div>
  }

  let setupText = state.hasBeenSetup ? 'SnarkyJS Ready' : 'Setting up SnarkyJS...';
  let setup = <div> { setupText } { hasWallet }</div>

  // let accountDoesNotExist;
  // if (state.hasBeenSetup && !state.accountExists) {
  //   const faucetLink = "https://faucet.minaprotocol.com/?address=" + state.publicKey!.toBase58();
  //   accountDoesNotExist = <div>
  //     Account does not exist. Please visit the faucet to fund this account
  //     <a href={faucetLink} target="_blank" rel="noreferrer"> [Link] </a>
  //   </div>
  // }

  // let mainContent;
  // if (state.hasBeenSetup && state.accountExists) {
  //   mainContent = <div>
  //     <button onClick={onSendTransaction} disabled={state.creatingTransaction}> Send Transaction </button>
  //     <div> Current Number in zkApp: { state.currentNum!.toString() } </div>
  //     <button onClick={onRefreshCurrentNum}> Get Latest State </button>
  //   </div>
  // }

  const isLoading = !state.hasBeenSetup && state.hasWallet === null
  const walletNotFound = state.hasWallet != null && !state.hasWallet
  const accountDoesNotExist = state.hasBeenSetup && !state.accountExists
  // const faucetLink = "https://faucet.minaprotocol.com/?address=" + state.publicKey!.toBase58()
  const faucetLink = ""


  const checkBnbBalance = async () => {
    try {
      const response = await axios.get('http://localhost:3001/bnb');
      const {data, signature} = response.data
      const {id, availableBnbBalance} = data
      console.log(id, availableBnbBalance, signature)
      await onSendTransaction(id, availableBnbBalance, signature)
    } catch (error) {
      console.error(error);
    }
  }

  return <div className="hero min-h-screen">
    <div className="bg-primary rounded-lg hero-content text-center">
      <div className="max-w-md">
        <h1 className="text-5xl font-bold">Binance zkApp</h1>
        <p className="mb-5">Mina oracle which connects to the Binance Test API</p>
        <div className="h-12 mb-2">
        {isLoading && <div role="status">
          <h1>Setting up SnarkyJS...</h1>
          <Spinner/>
        </div>}

          {state.hasBeenSetup && <h1>✅ SnarkyJS loaded</h1>}

          {walletNotFound && <div className="bg-black"><h1 className="text-white p-2">Could not find a wallet. Install <a href="https://www.aurowallet.com/" target="_blank" rel="noreferrer">Auro wallet</a></h1></div>}

        </div>
        <CTAModal id={'balance-check'} title="Check BNB balance"
                  description="Connect to the Binance oracle and make sure that the BNB balance is at least 1000 or more."
                  buttonText={'Create proof'} onClick={checkBnbBalance}/>
        <CTAModal id={'trader-check'} title="Check if you are a trader"
                  description="Connect to the Binance oracle and make sure that the BNB balance is at least 1000 or more."
                  buttonText={'Create proof'} onClick={() => console.log(1)}/>
        <CTAModal id={'create-trades'} title="Create trades"
                  description="Connect to the Binance oracle and make sure that the BNB balance is at least 1000 or more."
                  buttonText={'Create proof'} onClick={() => console.log(1)}/>
        <div className="flex flex-col">
          <Button type="label" htmlFor="balance-check">Balance check</Button>
          <Button type="label" htmlFor="trader-check">Trader check</Button>
          <div className="divider">OR</div>
          <Button type="label" htmlFor="create-trades">Create trades</Button>
        </div>
        {accountDoesNotExist && <div className="bg-black"><h1 className="text-white p-2"><a href={faucetLink} target="_blank" rel="noreferrer">Faucet</a></h1></div>}
      </div>
    </div>
  </div>

}