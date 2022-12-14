import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  DeployArgs,
  Permissions,
  PrivateKey,
  Signature,
} from 'snarkyjs';

// The public key of our trusted data provider
const ORACLE_PUBLIC_KEY =
  'B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy';

export class Add extends SmartContract {
  @state(PublicKey) oraclePublicKey = State<PublicKey>();
  @state(Field) verifiedNum = State<Field>();

  init(zkappKey: PrivateKey) {
    super.init(zkappKey);
    this.verifiedNum.set(Field(0));
    this.oraclePublicKey.set(PublicKey.fromBase58(ORACLE_PUBLIC_KEY));
    this.requireSignature();
  }

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }

  @method update() {
    const currentState = this.verifiedNum.get();
    this.verifiedNum.assertEquals(currentState);
    const newState = currentState.add(2);
    this.verifiedNum.set(newState);
  }

  @method verify(id: Field, bnbBalance: Field, signature: Signature) {
    const oraclePublicKey = this.oraclePublicKey.get();
    const currentState = this.verifiedNum.get();

    this.verifiedNum.assertEquals(currentState);
    this.oraclePublicKey.assertEquals(oraclePublicKey);

    const validSignature = signature.verify(oraclePublicKey, [id, bnbBalance]);
    validSignature.assertTrue();
    bnbBalance.assertGte(Field(1000));

    const newState = currentState.add(1);
    this.verifiedNum.set(newState);
  }
}
