import { Connection, SendOptions, VersionedTransaction, Transaction } from "@solana/web3.js";
import { createConnection } from "./createConnection.js";
import { getTransactionStatus } from "./getTransactionStatus.js";
import { TCommitment } from "./types/TCommitment.js";
import pRetry from 'p-retry';

export interface ISendSolanaTransactionParams {
	commitment?: TCommitment;
	connection?: Connection;
	repeatTimeout?: number;
	maxRetries?: number;
	blockHeightLimit?: number;
	sendOptions?: SendOptions;
}

const getIsTransaction = (transaction: VersionedTransaction | Transaction | Uint8Array | string): transaction is VersionedTransaction =>
	typeof transaction === 'object' && typeof (transaction as VersionedTransaction).serialize === 'function';

const getIsTxn = (transaction: VersionedTransaction | Transaction | Uint8Array | string): transaction is string =>
	typeof transaction === 'string';


export default async function sendTransaction(
	transaction: VersionedTransaction | Transaction | Uint8Array | string,
	params?: ISendSolanaTransactionParams,
	_retry = 0,
): Promise<string> {
	const {
		connection = createConnection(),
		repeatTimeout = 1000,
		blockHeightLimit = 150,
		maxRetries = 5,
		commitment = null,
	} = params ? params : {}

	if (getIsTransaction(transaction)) {
		transaction = transaction.serialize();
	}
	if (getIsTxn(transaction)) {
		transaction = Buffer.from(transaction, "base64");
	}

	let tx = '';
	let lastValidBlockHeight: number | null = null;

	const getBlockhash = async () => pRetry(() => connection.getLatestBlockhashAndContext().then((blockhash) => {
		if (!blockhash || !blockhash?.value?.blockhash || (blockhash as any).err || (blockhash as any).value.err) {
			throw new Error('Blockhash not found')
		}
		lastValidBlockHeight = blockhash.value.lastValidBlockHeight - blockHeightLimit;
	}), { retries: 2, onFailedAttempt: () => console.log('Get blockhash failed, retrying...') });

	void getBlockhash();

	const send = () => {
		return connection.sendRawTransaction(transaction as Uint8Array, {
			preflightCommitment: undefined,
			skipPreflight: true,
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
					throw new Error("Transaction expired");
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

		throw e;
	}

	return tx;
}

export { createConnection }
