import assert from 'assert'
import { Address } from '../src/index.js'
import { Message } from '../src/message.js'
import { RPC } from '../src/rpc.js'
import * as Wallet from '../src/wallet.js'

const API = 'https://api.calibration.node.glif.io'

describe('lotus rpc', function () {
  this.retries(3)
  this.timeout(10_000)
  it('version', async () => {
    const rpc = new RPC({ api: API })

    const version = await rpc.version()
    if (version.error) {
      return assert.fail(version.error.message)
    }

    assert(version.result.Version)
    assert(version.result.APIVersion)
    assert(version.result.BlockDelay)
  })

  it('networkName', async () => {
    const rpc = new RPC({ api: API })

    const version = await rpc.networkName()
    if (version.error) {
      return assert.fail(version.error.message)
    }

    assert.equal(version.result, 'calibrationnet')
  })

  it('nonce', async () => {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const version = await rpc.nonce('t1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna')
    if (version.error) {
      return assert.fail(version.error.message)
    }

    assert.ok(Number.isInteger(version.result))
  })

  it('nonce fail with wrong network', async () => {
    const rpc = new RPC({ api: API, network: 'testnet' })

    await assert.rejects(() =>
      rpc.nonce('f1jbnosztqwadgh4smvsnojdvwjgqxsmtzy5n5imi')
    )
  })

  it('gas estimate', async () => {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const nonce = await rpc.nonce('t1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna')
    if (nonce.error) {
      return assert.fail(nonce.error.message)
    }

    const msg = new Message({
      from: 't1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna',
      to: 't1sfizuhpgjqyl4yjydlebncvecf3q2cmeeathzwi',
      nonce: nonce.result,
      value: '100000000000000000',
    })

    const estimate = await rpc.gasEstimate({ msg })
    if (estimate.error) {
      return assert.fail(estimate.error.message)
    }

    assert.equal(Message.fromLotus(estimate.result).value, msg.value)
  })

  it('gas estimate to delegated address', async () => {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const nonce = await rpc.nonce('t1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna')
    if (nonce.error) {
      return assert.fail(nonce.error.message)
    }

    const msg = new Message({
      from: 't1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna',
      to: 't410fpzfl2y5hzayuzqunhcbqgrzdkpmij4uswh5uumi',
      nonce: nonce.result,
      value: '100000000000000000',
    })

    const estimate = await rpc.gasEstimate({ msg })
    if (estimate.error) {
      return assert.fail(estimate.error.message)
    }

    assert.equal(Message.fromLotus(estimate.result).value, msg.value)
  })

  it('gas estimate to 0x address', async () => {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const nonce = await rpc.nonce('t1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna')
    if (nonce.error) {
      return assert.fail(nonce.error.message)
    }

    const msg = new Message({
      from: 't1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna',
      to: Address.from(
        '0x7e4ABd63A7C8314Cc28D388303472353D884f292',
        'testnet'
      ).toString(),
      nonce: nonce.result,
      value: '100000000000000000',
    })

    const estimate = await rpc.gasEstimate({ msg })
    if (estimate.error) {
      return assert.fail(estimate.error.message)
    }

    assert.equal(Message.fromLotus(estimate.result).value, msg.value)
  })

  it('balance', async () => {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const balance = await rpc.balance(
      't1jzly7yqqff5fignjddktuo2con2pjoz5yajemli'
    )
    if (balance.error) {
      return assert.fail(balance.error.message)
    }

    assert.ok(typeof balance.result === 'string')
  })

  it('balance from delegated address', async () => {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const balance = await rpc.balance(
      't410fpzfl2y5hzayuzqunhcbqgrzdkpmij4uswh5uumi'
    )
    if (balance.error) {
      return assert.fail(balance.error.message)
    }

    assert.ok(typeof balance.result === 'string')
    assert.ok(BigInt(balance.result) > 0n)
  })

  it('balance from 0x address', async () => {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const balance = await rpc.balance(
      Address.from(
        '0x7e4ABd63A7C8314Cc28D388303472353D884f292',
        'testnet'
      ).toString()
    )
    if (balance.error) {
      return assert.fail(balance.error.message)
    }

    assert.ok(typeof balance.result === 'string')
    assert.ok(BigInt(balance.result) > 0n)
  })

  it('send message', async () => {
    const rpc = new RPC({ api: API, network: 'testnet' })
    const account = Wallet.accountFromMnemonic(
      'already turtle birth enroll since owner keep patch skirt drift any dinner',
      'SECP256K1',
      "m/44'/1'/0'/0/0",
      'testnet'
    )
    const message = await new Message({
      to: 't1sfizuhpgjqyl4yjydlebncvecf3q2cmeeathzwi',
      from: account.address.toString(),
      value: '1',
    }).prepare(rpc)

    const balance = await rpc.pushMessage({
      msg: message,
      signature: {
        type: 'SECP256K1',
        data: Wallet.signMessage(account.privateKey, 'SECP256K1', message).data,
      },
    })
    if (balance.error) {
      return assert.fail(balance.error.message)
    }

    assert.ok(typeof balance.result['/'] === 'string')
  })

  it('send message to 0x', async () => {
    const rpc = new RPC({ api: API, network: 'testnet' })
    const account = Wallet.accountFromMnemonic(
      'already turtle birth enroll since owner keep patch skirt drift any dinner',
      'SECP256K1',
      "m/44'/1'/0'/0/0",
      'testnet'
    )
    const message = await new Message({
      to: Address.from(
        '0x7e4ABd63A7C8314Cc28D388303472353D884f292',
        'testnet'
      ).toString(),
      from: account.address.toString(),
      value: '1',
    }).prepare(rpc)

    const balance = await rpc.pushMessage({
      msg: message,
      signature: {
        type: 'SECP256K1',
        data: Wallet.signMessage(account.privateKey, 'SECP256K1', message).data,
      },
    })
    if (balance.error) {
      return assert.fail(balance.error.message)
    }

    assert.ok(typeof balance.result['/'] === 'string')
  })

  it('get ID from f1 unsafe', async () => {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const balance = await rpc.stateLookupID({
      address: 't1jzly7yqqff5fignjddktuo2con2pjoz5yajemli',
    })
    if (balance.error) {
      return assert.fail(balance.error.message)
    }

    assert.strictEqual(balance.result, 't023576')
  })

  it('get ID from f1 safe', async () => {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const balance = await rpc.filecoinAddressToEthAddress({
      address: 't1jzly7yqqff5fignjddktuo2con2pjoz5yajemli',
    })
    if (balance.error) {
      return assert.fail(balance.error.message)
    }

    assert.strictEqual(
      Address.fromEthAddress(balance.result, 'testnet').toString(),
      't023576'
    )
  })

  it('get f4 from ID', async () => {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const idAddress = await rpc.stateLookupID({
      address: 't410fpzfl2y5hzayuzqunhcbqgrzdkpmij4uswh5uumi',
    })
    if (idAddress.error) {
      return assert.fail(idAddress.error.message)
    }

    assert.strictEqual(idAddress.result, 't025575')

    const fAddress = await rpc.stateAccountKey({
      address: idAddress.result,
    })
    if (fAddress.error) {
      return assert.fail(fAddress.error.message)
    }
    assert.strictEqual(
      fAddress.result,
      't410fpzfl2y5hzayuzqunhcbqgrzdkpmij4uswh5uumi'
    )
  })
})

describe('lotus rpc aborts', function () {
  this.retries(3)
  this.timeout(10_000)
  it('timeout', async () => {
    const rpc = new RPC({ api: API }, { timeout: 100 })

    const version = await rpc.version()

    assert.ok(version.error)

    assert.ok(version.error.message.includes('FETCH_ERROR'))
  })

  it('timeout on method', async () => {
    const rpc = new RPC({ api: API }, { timeout: 100 })

    const version = await rpc.version({ timeout: 10 })

    assert.ok(version.error)
    assert.ok(version.error.message.includes('FETCH_ERROR'))
  })

  it('timeout default', async () => {
    const rpc = new RPC({ api: API })

    const version = await rpc.version()

    assert.ok(version.result)
  })

  it('aborted', async () => {
    const rpc = new RPC({ api: API }, { signal: AbortSignal.abort() })

    const version = await rpc.version()

    assert.ok(version.error)

    assert.ok(version.error.message.includes('FETCH_ERROR'))
  })

  it('abort', async () => {
    const controller = new AbortController()
    const rpc = new RPC({ api: API })

    const version = rpc.version({ signal: controller.signal })
    controller.abort()

    const rsp = await version
    assert.ok(rsp.error)

    assert.ok(rsp.error.message.includes('FETCH_ERROR'))
  })
})
