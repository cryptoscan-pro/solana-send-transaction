import { Connection, SendOptions, VersionedTransaction } from "@solana/web3.js";
import { createConnection } from "./createConnection";
import { TCommitment } from "./types/TCommitment";
import { getTransactionStatus } from "./getTransactionStatus";

export interface ISendSolanaTransactionParams {
	commitment?: TCommitment;
	connection?: Connection;
	repeatTimeout?: number;
	maxRetries?: number;
	blockHeightLimit?: number;
	sendOptions?: SendOptions;
}

const getIsVersionedTransaction = (transaction: VersionedTransaction | Uint8Array | string): transaction is VersionedTransaction =>
	typeof transaction === 'object' && typeof (transaction as VersionedTransaction).serialize === 'function';

const getIsTxn = (transaction: VersionedTransaction | Uint8Array | string): transaction is string =>
	typeof transaction === 'string';


export default async function sendTransaction(
	transaction: VersionedTransaction | Uint8Array | string,
	params?: ISendSolanaTransactionParams,
	_retry = 0,
): Promise<string | Error> {
	const {
		connection = createConnection(),
		repeatTimeout = 1000,
		blockHeightLimit = 150,
		maxRetries = 5,
		commitment = null,
	} = params ? params : {}

	if (getIsVersionedTransaction(transaction)) {
		transaction = transaction.serialize();
	}
	if (getIsTxn(transaction)) {
		transaction = Buffer.from(transaction, "base64");
	}

	let tx = '';
	let lastValidBlockHeight: number | null = null;

	connection.getLatestBlockhashAndContext().then((blockhash) => {
		lastValidBlockHeight = blockhash.value.lastValidBlockHeight - blockHeightLimit;
	})

	const send = () => {
		return connection.sendRawTransaction(transaction as Uint8Array, {
			preflightCommitment: undefined,
			...(params?.sendOptions || {}),
		});
	}

	try {
		tx = await send();

		if (commitment) {
			let times = 0;
			const status = await getTransactionStatus(tx, connection)
			let isReady = status === commitment;

			while (!isReady) {
				times += 1;
				if (times > 5) {
					break;
				}
				const status = await getTransactionStatus(tx, connection)
				isReady = status === commitment;
				if (!isReady) {
					tx = await send();
				}
				else {
					break;
				}

				const blockHeight = await connection.getBlockHeight();

				if (!lastValidBlockHeight) {
					lastValidBlockHeight = blockHeight;
				}

				if (blockHeight > lastValidBlockHeight) {
					return new Error("Transaction expired");
				}

				await new Promise((resolve) => setTimeout(resolve, repeatTimeout));
			}
		}
	} catch (e: any) {
		if (e.message.includes('429') && _retry < maxRetries) {
			console.log('Retrying...', e.message);
			await new Promise((resolve) => setTimeout(resolve, repeatTimeout));
			return sendTransaction(transaction, params, _retry + 1);
		}

		return e;
	}

	return tx;
}

export { createConnection } from './createConnection'
