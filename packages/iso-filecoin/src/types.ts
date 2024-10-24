import type BigNumber from 'bignumber.js'
import type { Driver } from 'iso-kv'
import type { z } from 'zod'
import type { AddressId, PROTOCOL_INDICATOR } from './address'
import type { Schemas as MessageSchemas } from './message'
import type { RPC } from './rpc'
import type { SIGNATURE_TYPE, Schemas as SignatureSchemas } from './signature'

export type ProtocolIndicator = typeof PROTOCOL_INDICATOR
export type ProtocolIndicatorCode = ProtocolIndicator[keyof ProtocolIndicator]

export interface CID {
  '/': string
}

export type Safety = 'safe' | 'finalized' | 'latest'
export type Cache = boolean | Driver | undefined
export interface AddressRpcOptions {
  rpc: RPC
  cache?: Cache
}
export interface AddressRpcSafetyOptions extends AddressRpcOptions {
  safety?: Safety
}

export interface Address {
  protocol: ProtocolIndicatorCode
  payload: Uint8Array
  network: Network
  networkPrefix: NetworkPrefix
  namespace?: number
  id?: bigint
  checksum: () => Uint8Array
  toContractDestination: () => `0x${string}`
  toString: () => string
  toBytes: () => Uint8Array
  /**
   * Convert to ID address
   */
  toIdAddress: (options: AddressRpcOptions) => Promise<AddressId>
  /**
   * Converts any address to a 0x address, either id masked address or eth address depending on the address type.
   * Delegated addresses convert to eth address, f1, f2, f3 convert to id masked address
   * and f0 depends on the underline address type
   */
  to0x: (options: AddressRpcOptions) => Promise<string>
}

export interface DerivationPathComponents {
  purpose: number
  coinType: number
  account: number
  change: number
  addressIndex: number
}

export type Network = 'mainnet' | 'testnet'
export type NetworkPrefix = 'f' | 't'

// Message types
export type MessageObj = z.infer<(typeof MessageSchemas)['message']>
export type PartialMessageObj = z.infer<
  (typeof MessageSchemas)['messagePartial']
>
export interface LotusMessage {
  Version: 0
  To: string
  From: string
  Nonce: number
  Value: string
  GasLimit: number
  GasFeeCap: string
  GasPremium: string
  Method: number
  Params: string
  CID?: CID
}

// Signature types
export type SignatureType = keyof typeof SIGNATURE_TYPE
export type SignatureCode = (typeof SIGNATURE_TYPE)[SignatureType]

export type LotusSignature = z.infer<
  (typeof SignatureSchemas)['lotusSignature']
>
export type SignatureObj = z.infer<(typeof SignatureSchemas)['signature']>

// RPC types
export interface Options {
  token?: string
  api: string | URL
  network?: Network
  fetch?: typeof globalThis.fetch
}

export interface RpcOptions {
  method: `Filecoin.${string}`
  params?: unknown[]
}

export interface MsgReceipt {
  ExitCode: number
  Return: string | null
  GasUsed: number
  EventsRoot: CID | null
}

export type TipSetKey = CID[]
export interface MsgLookup {
  Height: number
  Message: CID
  Receipt: MsgReceipt
  ReturnDec: unknown | null
  TipSet: TipSetKey
}

export interface Block {
  BLSAggregate: {
    Data: string
    Type: 2
  }
  BeaconEntries: {
    Data: string
    Round: number
  }[]
  BlockSig: {
    Data: string
    Type: 2
  }
  ElectionProof: {
    VRFProof: string
    WinCount: number
  }
  ForkSignaling: number
  Height: number
  Messages: CID
  /**
   * The miner address of the block.
   */
  Miner: string
  ParentBaseFee: string
  ParentMessageReceipts: CID
  ParentStateRoot: CID
  /**
   * BitInt as a string
   */
  ParentWeight: string
  Parents: CID[]
  Ticket: {
    VRFProof: string
  }
  Timestamp: number
  WinPoStProof: {
    PoStProof: number
    ProofBytes: string
  }[]
}

export interface TipSet {
  Cids: CID[]
  Height: number
  Blocks: Block[]
}

/**
 * Lotus API responses
 *
 * @see https://filecoin-shipyard.github.io/js-lotus-client/api/api.html
 */

export type VersionResponse = {
  Version: string
  APIVersion: number
  BlockDelay: number
}
export type StateNetworkNameResponse = Network
export type MpoolGetNonceResponse = number
export type GasEstimateMessageGasResponse = LotusMessage

/**
 * Wallet balance in attoFIL
 *
 * @example '99999927137190925849'
 */
export type WalletBalanceResponse = string
export type MpoolPushResponse = CID
export type WaitMsgResponse = MsgLookup

// RPC methods params

export interface GasEstimateParams {
  /**
   * Message to estimate gas for
   *
   * @see https://lotus.filecoin.io/reference/lotus/gas/#gasestimatemessagegas
   */
  msg: PartialMessageObj
  /**
   * Max fee to pay for gas (attoFIL/gas units)
   *
   * @default '0'
   */
  maxFee?: string
}

export interface PushMessageParams {
  msg: MessageObj
  signature: SignatureObj
}

export interface waitMsgParams {
  cid: CID
  /**
   * Confidence depth to wait for
   *
   * @default 2
   */
  confidence?: number
  /**
   * How chain epochs to look back to find the message
   *
   * @default 100
   */
  lookback?: number
}

export interface StateAccountKeyParams {
  address: string
  tipSetKey?: TipSetKey | null
}
export type BlockNumber = '0x${string}'
export interface FilecoinAddressToEthAddressParams {
  /**
   * The Filecoin address to convert.
   */
  address: string
  /**
   * The block number or state for the conversion.
   * Defaults to "finalized" for maximum safety.
   * Possible values: "pending", "latest", "finalized", "safe", or a specific block number represented as hex.
   */
  blockNumber?: 'pending' | 'latest' | 'finalized' | 'safe' | BlockNumber
}

export interface ChainGetTipSetByHeightParams {
  height: number
  tipSetKey?: TipSetKey | null
}

// Token types
export type FormatOptions = BigNumber.Format & {
  /**
   * @default 18
   * @see https://mikemcl.github.io/bignumber.js/#decimal-places
   */
  decimalPlaces?: number
  /**
   * @default BigNumber.ROUND_HALF_DOWN
   * @see https://mikemcl.github.io/bignumber.js/#constructor-properties
   */
  roundingMode?: BigNumber.RoundingMode
}
