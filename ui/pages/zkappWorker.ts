import {
    Mina,
    isReady,
    PublicKey,
    Field,
    fetchAccount, Signature,
} from 'snarkyjs'

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type {BalanceContract} from '../../contracts/src/BalanceContract';
import type {TraderContract} from '../../contracts/src/TraderContract';

const state = {
    BalanceContract: null as null | typeof BalanceContract,
    TraderContract: null as null | typeof TraderContract,
    balancezkapp: null as null | BalanceContract,
    traderzkapp: null as null | TraderContract,
    transaction: null as null | Transaction,
}

// ---------------------------------------------------------------------------------------

const functions = {
    loadSnarkyJS: async (args: {}) => {
        await isReady;
    },
    setActiveInstanceToBerkeley: async (args: {}) => {
        const Berkeley = Mina.BerkeleyQANet(
            "https://proxy.berkeley.minaexplorer.com/graphql"
        );
        Mina.setActiveInstance(Berkeley);
    },
    loadContract: async (args: {}) => {
        const {BalanceContract} = await import('../../contracts/build/src/BalanceContract.js');
        const {TraderContract} = await import('../../contracts/build/src/TraderContract.js');
        state.BalanceContract = BalanceContract;
        state.TraderContract = TraderContract;

    },
    compileContract: async (args: {}) => {
        await state.BalanceContract!.compile();
        await state.TraderContract!.compile();
    },
    fetchAccount: async (args: { publicKey58: string }) => {
        const publicKey = PublicKey.fromBase58(args.publicKey58);
        return await fetchAccount({publicKey});
    },
    initZkappInstance: async (args: { publicKeyBalance: string, publicKeyTrader: string }) => {
        const balanceKey = PublicKey.fromBase58(args.publicKeyBalance);
        const traderKey = PublicKey.fromBase58(args.publicKeyTrader);
        state.balancezkapp = new state.BalanceContract!(balanceKey);
        state.traderzkapp = new state.TraderContract!(traderKey);
    },
    getVerifiedBalanceNum: async (args: {}) => {
        const currentNum = await state.balancezkapp!.verifiedNum.get();
        return JSON.stringify(currentNum.toJSON());
    },
    getVerifiedTraderNum: async (args: {}) => {
        const currentNum = await state.traderzkapp!.verifiedNum.get();
        return JSON.stringify(currentNum.toJSON());
    },
    createUpdateTransaction: async (args: { contract: "Balance" | "Trader", id: Field, data: Field, signature: Signature }) => {
        const {contract, id, data, signature} = args
        console.log({id, data, signature})
        console.log(contract)
        const transaction = await Mina.transaction(() => {
                contract === "Balance" ? state.balancezkapp!.verify(Field(id), Field(data), Signature.fromJSON(signature)) : state.traderzkapp!.verify(Field(id), Field(data), Signature.fromJSON(signature));
            }
        );
        state.transaction = transaction;
    },
    proveUpdateTransaction: async (args: {}) => {
        await state.transaction!.prove();
    },
    getTransactionJSON: async (args: {}) => {
        return state.transaction!.toJSON();
    },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
    id: number,
    fn: WorkerFunctions,
    args: any
}

export type ZkappWorkerReponse = {
    id: number,
    data: any
}
if (process.browser) {
    addEventListener('message', async (event: MessageEvent<ZkappWorkerRequest>) => {
        try {
            const returnData = await functions[event.data.fn](event.data.args);
            const message: ZkappWorkerReponse = {
                id: event.data.id,
                data: returnData,
            }
            postMessage(message)
        } catch (e) {
            console.log(e)
            postMessage({
                id: event.data.id,
                error: true
            })
        }
    });
}
