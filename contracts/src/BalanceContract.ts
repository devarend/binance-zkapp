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
  'B62qmjsaQv6wD4aurd8WUouiFkNxcFX2WNY5zrRHK4pXpCB3gZsP87E';

export class BalanceContract extends SmartContract {
  @state(PublicKey) oraclePublicKey = State<PublicKey>();
  @state(Field) verifiedNum = State<Field>();

  init(zkappKey: PrivateKey) {
    super.init(zkappKey);
    this.verifiedNum.set(Field(0));
    this.oraclePublicKey.set(PublicKey.fromBase58(ORACLE_PUBLIC_KEY));
    // this.requireSignature();
  }

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }

  @method verify(id: Field, bnbBalance: Field, signature: Signature) {
    const oraclePublicKey = this.oraclePublicKey.get();
    this.oraclePublicKey.assertEquals(oraclePublicKey);
    const validSignature = signature.verify(oraclePublicKey, [id, bnbBalance]);
    validSignature.assertTrue();
    bnbBalance.assertGte(Field(1000));

    const currentState = this.verifiedNum.get();
    this.verifiedNum.assertEquals(currentState);
    const newState = currentState.add(1);
    this.verifiedNum.set(newState);
  }
}
