import '../styles/globals.css'
import {useEffect, useState} from "react";
import './reactCOIServiceWorker';
import ZkappWorkerClient from './zkappWorkerClient';
import {
    PublicKey,
    Field, Signature,
} from 'snarkyjs'
import Button from "../components/button/Button";
import CTAModal from "../components/modal/CTAModal";
import Spinner from "../components/icons/Spinner";
import axios from "axios";
import TransactionModal from "../components/modal/TransactionModal";

let transactionFee = 0.1;

export default function App() {

    let [state, setState] = useState({
        zkappWorkerClient: null as null | ZkappWorkerClient,
        hasWallet: null as null | boolean,
        hasBeenSetup: false,
        accountExists: false,
        verifiedBalanceNum: null as null | Field,
        verifiedTraderNum: null as null | Field,
        publicKey: null as null | PublicKey,
        creatingTransaction: false,
    });

    const [isCreatingProof, setIsCreatingProof] = useState(false)
    const [isCreatingTrades, setIsCreatingTrades] = useState(false)

    const [modal, setModal] = useState({
        title: '',
        description: '',
        buttonText: '',
        onClick: () => {
        }
    })
    const [isModalVisible, setIsModalVisible] = useState(false)

    const [transactionModal, setTransactionModal] = useState({
        title: '',
        description: '',
        hash: '',
        error: '',
    })

    const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false)
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
                    setState({...state, hasWallet: false});
                    return;
                }

                const publicKeyBase58: string = (await mina.requestAccounts())[0];
                const publicKey = PublicKey.fromBase58(publicKeyBase58);

                console.log('using key', publicKey.toBase58());

                console.log('checking if account exists...');
                const res = await zkappWorkerClient.fetchAccount({publicKey: publicKey!});
                const accountExists = res.error == null;

                await zkappWorkerClient.loadContract();

                console.log('compiling zkApp');
                await zkappWorkerClient.compileContract();
                console.log('zkApp compiled');

                const publicKeyBalance = PublicKey.fromBase58('B62qr74C34W4PDKMXAtqSpqgx9k9bH5mxnn5m4ztbWn9Cs8hbaNjs9B');
                const publicKeyTrader = PublicKey.fromBase58('B62qrhTLkX6XxFE4X7epBrF3HyZKVpXwgA7bhjt4YfsUYgqWtzVKSCo');

                await zkappWorkerClient.initZkappInstance(publicKeyBalance, publicKeyTrader);

                console.log('getting zkApp state...');
                await zkappWorkerClient.fetchAccount({publicKey: publicKeyBalance})
                await zkappWorkerClient.fetchAccount({publicKey: publicKeyTrader})

                const verifiedBalanceNum = await zkappWorkerClient.getVerifiedBalanceNum();
                const verifiedTraderNum = await zkappWorkerClient.getVerifiedTraderNum();

                console.log('verifiedBalanceNum:', verifiedBalanceNum.toString());
                console.log('verifiedTraderNum:', verifiedTraderNum.toString());

                setState({
                    ...state,
                    zkappWorkerClient,
                    hasWallet: true,
                    hasBeenSetup: true,
                    publicKey,
                    accountExists,
                    verifiedBalanceNum,
                    verifiedTraderNum
                });
            }
        })();
    }, []);

    // -------------------------------------------------------
    // Wait for account to exist, if it didn't

    useEffect(() => {
        (async () => {
            if (state.hasBeenSetup && !state.accountExists) {
                for (; ;) {
                    console.log('checking if account exists...');
                    const res = await state.zkappWorkerClient!.fetchAccount({publicKey: state.publicKey!})
                    const accountExists = res.error == null;
                    if (accountExists) {
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                }
                setState({...state, accountExists: true});
            }
        })();
    }, [state.hasBeenSetup]);

    // -------------------------------------------------------
    // Send a transaction

    const onSendTransaction = async (contract: "Balance" | "Trader", id: Field, data: Field, signature: Signature) => {
        setState({...state, creatingTransaction: true});
        console.log('sending a transaction...');

        await state.zkappWorkerClient!.fetchAccount({publicKey: state.publicKey!});
        await state.zkappWorkerClient!.createUpdateTransaction(contract, id, data, signature)
        console.log('creating proof...');
        await state.zkappWorkerClient!.proveUpdateTransaction();

        console.log('getting Transaction JSON...');
        const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON()

        console.log('requesting send transaction...');
        const {hash} = await (window as any).mina.sendTransaction({
            transaction: transactionJSON,
            feePayer: {
                fee: transactionFee,
                memo: '',
            },
        });

        console.log(
            'See transaction at https://berkeley.minaexplorer.com/transaction/' + hash
        );

        setState({...state, creatingTransaction: false});
        return hash;
    }

    const isLoading = !state.hasBeenSetup && state.hasWallet === null
    const walletNotFound = state.hasWallet != null && !state.hasWallet
    const isReady = state.hasBeenSetup && state.accountExists

    const refreshState = async () => {
        console.log('getting zkApp state...');
        const publicKeyBalance = PublicKey.fromBase58('B62qr74C34W4PDKMXAtqSpqgx9k9bH5mxnn5m4ztbWn9Cs8hbaNjs9B');
        const publicKeyTrader = PublicKey.fromBase58('B62qrhTLkX6XxFE4X7epBrF3HyZKVpXwgA7bhjt4YfsUYgqWtzVKSCo');
        await state.zkappWorkerClient!.fetchAccount({publicKey: publicKeyBalance})
        await state.zkappWorkerClient!.fetchAccount({publicKey: publicKeyTrader})

        const verifiedBalanceNum = await state.zkappWorkerClient!.getVerifiedBalanceNum();
        const verifiedTraderNum = await state.zkappWorkerClient!.getVerifiedTraderNum();

        console.log('verifiedBalanceNum:', verifiedBalanceNum.toString());
        console.log('verifiedTraderNum:', verifiedTraderNum.toString());

        setState({...state, verifiedBalanceNum, verifiedTraderNum});
    }

    const checkContract = async (contract: "Balance" | "Trader") => {
        const mapContractToProps = {
            Balance: {
                endpoint: 'bnb',
                field: 'availableBnbBalance',
                message: 'Balance is not enough'
            },
            Trader: {
                endpoint: 'trades',
                field: 'amountOfTrades',
                message: 'Not enough trades'
            }
        }

        const {endpoint, field, message} = mapContractToProps[contract]

        setIsCreatingProof(true)
        try {
            const response = await axios.get(`https://binance-oracle-3mgae.ondigitalocean.app/${endpoint}`);
            const {data, signature} = response.data
            const {id} = data
            const hash = await onSendTransaction(contract, id, data[field], signature)
            setTransactionModal({
                title: 'Transaction',
                description: 'Transaction successful',
                error: '',
                hash,
            })
        } catch (error) {
            setTransactionModal({
                title: 'Something went wrong',
                description: 'Something went wrong while creating the proof',
                error: message,
                hash: '',
            })
        }
        setIsTransactionModalVisible(true)
        setIsModalVisible(false)
        setIsCreatingProof(false)
    }

    const createTrades = async () => {
        setIsCreatingTrades(true)
        try {
            await axios.post('https://binance-oracle-3mgae.ondigitalocean.app/createTrades');
        } catch (error) {
        }
        setIsCreatingTrades(false)
    }

    return <div className="hero min-h-screen">
        <div className="bg-primary rounded-lg hero-content text-center">
            <div className="max-w-md">
                <h1 className="text-5xl font-bold">Binance zkApp</h1>
                <p className="mb-5">Mina oracle which connects to the Binance Test API</p>
                <div className="h-14 mb-2">
                    {isLoading && <div role="status">
                        <h1>Setting up SnarkyJS...</h1>
                        <Spinner/>
                    </div>}

                    {state.hasBeenSetup && <h1>✅ SnarkyJS loaded</h1>}
                    {isReady &&
                        <button onClick={refreshState} className="btn btn-outline mt-1">↻ Refresh state</button>}

                    {walletNotFound &&
                        <div className="bg-black"><h1 className="text-white p-2">Could not find a wallet. Install <a
                            href="https://www.aurowallet.com/" target="_blank" rel="noreferrer">Auro wallet</a></h1>
                        </div>}

                </div>
                <TransactionModal id={'transaction'} title={transactionModal.title}
                                  isVisible={isTransactionModalVisible}
                                  description={transactionModal.description} error={transactionModal.error}
                                  transactionHash={transactionModal.hash}
                                  close={() => setIsTransactionModalVisible(false)}/>
                <CTAModal isVisible={isModalVisible} close={() => setIsModalVisible(false)} id={'balance-check'}
                          title={modal.title}
                          description={modal.description}
                          buttonText={modal.buttonText} onClick={modal.onClick} isLoading={isCreatingProof}/>
                <div className="flex flex-col">
                    <Button onClick={() => {
                        setModal({
                            title: 'Check BNB balance',
                            description: 'Connect to the Binance oracle and make sure that the BNB balance is at least 1000 or more.',
                            buttonText: 'Create proof',
                            onClick: () => checkContract('Balance')
                        })
                        setIsModalVisible(true)
                    }}>Balance check {isReady && `(verified amount: ${state.verifiedBalanceNum!.toString()})`}</Button>

                    <Button onClick={() => {
                        setModal({
                            title: 'Check if you are a trader',
                            description: 'Connect to the Binance oracle and make sure that you have 10 trades or more.',
                            buttonText: 'Create proof',
                            onClick: () => checkContract('Trader')
                        })
                        setIsModalVisible(true)
                    }}>Trader check {isReady && `(verified amount: ${state.verifiedTraderNum!.toString()})`}</Button>
                    <div className="divider">OR</div>
                    <Button onClick={createTrades} isLoading={isCreatingTrades}>Create trades</Button>
                </div>
                <div className="flex flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                         className="stroke-current flex-shrink-0 w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>This creates 10 trades on your Binance Test account</span>
                </div>
            </div>
        </div>
    </div>
}
