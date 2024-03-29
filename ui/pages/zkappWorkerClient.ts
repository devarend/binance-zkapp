import { fetchAccount, PublicKey, Field, Signature } from "snarkyjs";

import type { ZkappWorkerRequest, WorkerFunctions } from "./zkappWorker";

export default class ZkappWorkerClient {
  // ---------------------------------------------------------------------------------------

  loadSnarkyJS() {
    return this._call("loadSnarkyJS", {});
  }

  setActiveInstanceToBerkeley() {
    return this._call("setActiveInstanceToBerkeley", {});
  }

  loadContract() {
    return this._call("loadContract", {});
  }

  compileContract() {
    return this._call("compileContract", {});
  }

  fetchAccount({
    publicKey,
  }: {
    publicKey: PublicKey;
  }): ReturnType<typeof fetchAccount> {
    const result = this._call("fetchAccount", {
      publicKey58: publicKey.toBase58(),
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  initZkappInstance(publicKeyBalance: PublicKey, publicKeyTrader: PublicKey) {
    return this._call("initZkappInstance", {
      publicKeyBalance: publicKeyBalance.toBase58(),
      publicKeyTrader: publicKeyTrader.toBase58(),
    });
  }

  async getVerifiedBalanceNum(): Promise<Field> {
    const result = await this._call("getVerifiedBalanceNum", {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  async getVerifiedTraderNum(): Promise<Field> {
    const result = await this._call("getVerifiedTraderNum", {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  createUpdateTransaction(
    contract: "Balance" | "Trader",
    id: Field,
    data: Field,
    signature: Signature
  ) {
    return this._call("createUpdateTransaction", {
      contract,
      id,
      data,
      signature,
    });
  }

  proveUpdateTransaction() {
    return this._call("proveUpdateTransaction", {});
  }

  async getTransactionJSON() {
    const result = await this._call("getTransactionJSON", {});
    return result;
  }

  // ---------------------------------------------------------------------------------------

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL("./zkappWorker.ts", import.meta.url));
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<any>) => {
      if (event.data.error) return this.promises[event.data.id].reject("error");
      this.promises[event.data.id].resolve(event.data.data);
      delete this.promises[event.data.id];
    };
  }

  _call(fn: WorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }
}
