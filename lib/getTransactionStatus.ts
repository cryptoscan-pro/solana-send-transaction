import { createConnection } from "./createConnection";
import { TCommitment } from "./types/TCommitment";

export const getTransactionStatus = async (tx: string, connection = createConnection()): Promise<TCommitment | null> => {
    const status = await connection.getSignatureStatus(tx);

    if ('Err' in status) {
        throw new Error('Transaction confirmed and failed with errors: ' + Object.keys((status as any).Err).join(', '));
    }
    if (status?.value === null) {
        return null;
    }
    if ('confirmationStatus' in status.value) {
        return status.value.confirmationStatus || null;
    }
    if ('status' in status.value) {
        return 'Ok' in (status.value as any).status ? 'confirmed' : 'processed';
    }

    return null;
}

