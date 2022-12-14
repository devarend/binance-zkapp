import {
    Mina,
    isReady,
    PublicKey,
    PrivateKey,
    Field,
    fetchAccount, Signature,
} from 'snarkyjs'

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type { Add } from '../../contracts/src/Add';

const state = {
    Add: null as null | typeof Add,
    zkapp: null as null | Add,
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
        const { Add } = await import('../../contracts/build/src/Add.js');
        state.Add = Add;
    },
    compileContract: async (args: {}) => {
        await state.Add!.compile();
    },
    fetchAccount: async (args: { publicKey58: string }) => {
        const publicKey = PublicKey.fromBase58(args.publicKey58);
        return await fetchAccount({ publicKey });
    },
    initZkappInstance: async (args: { publicKey58: string }) => {
        const publicKey = PublicKey.fromBase58(args.publicKey58);
        state.zkapp = new state.Add!(publicKey);
    },
    getNum: async (args: {}) => {
        const currentNum = await state.zkapp!.verifiedNum.get();
        return JSON.stringify(currentNum.toJSON());
    },
    createUpdateTransaction: async (args: {id: Field, bnbBalance: Field, signature: Signature}) => {
        const {id, bnbBalance, signature} = args
        const transaction = await Mina.transaction(() => {
                state.zkapp!.verify(id, bnbBalance, signature);
            }
        );
        state.transaction = transaction;
    },
    proveUpdateTransaction: async (args: {}) => {
        try {
            await state.transaction!.prove();
        } catch (e) {
            console.log(e)
        }
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
        const returnData = await functions[event.data.fn](event.data.args);

        const message: ZkappWorkerReponse = {
            id: event.data.id,
            data: returnData,
        }
        postMessage(message)
    });
}