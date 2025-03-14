import { fetchJson } from './ultil';

const networkId = 'testnet';
const bitcoinRpc = `https://blockstream.info/${networkId === 'testnet' ? 'testnet' : ''
    }/api`;

export const broadcast = async (body: any) => {
    try {
        const res = await fetch(`https://corsproxy.io/?url=${bitcoinRpc}/tx`, {
            method: 'POST',
            body,
        });
        if (res.status === 200) {
            const hash = await res.text();
            console.log('tx hash', hash);
            return;
        }
        console.log(await res.text());
        throw new Error('not 200');
    } catch (e) {
        console.log('error broadcasting bitcoin tx', JSON.stringify(e));
    }
};

export const getChange = async ({ balance, sats }: any) => {
    const feeRate = await fetchJson(`${bitcoinRpc}/fee-estimates`);
    const estimatedSize = 1 * 148 + 2 * 34 + 10; // 1 utxo * 148
    const fee = estimatedSize * Math.ceil(feeRate[6] + 1);
    const change = balance - sats - fee;
    return change;
};

export const getBalance = async ({ address, getUtxos = false }: any) => {
    try {
        const res = await fetchJson(`${bitcoinRpc}/address/${address}/utxo`);

        if (!res) return;

        let utxos = res.map((utxo: any) => ({
            txid: utxo.txid,
            vout: utxo.vout,
            value: utxo.value,
        }));

        let maxValue = 0;
        utxos.forEach((utxo: any) => {
            if (utxo.value > maxValue) maxValue = utxo.value;
        });
        utxos = utxos.filter((utxo: any) => utxo.value === maxValue);
        if (utxos.length > 1) {
            utxos.length = 1;
        }

        // console.log('utxos', utxos);

        if (!utxos || !utxos.length) {
            console.log(
                'no utxos for address',
                address,
                'please fund address and try again',
            );
        }

        return getUtxos ? utxos : maxValue;
    } catch (e) {
        console.log('e', e);
    }
};

export const fetchTransaction = async (transactionId: any) => {
    const data = await fetchJson(`${bitcoinRpc}/tx/${transactionId}`);
    const tx = new data.Transaction();

    if (!data || !tx) throw new Error('Failed to fetch transaction');
    tx.version = data.version;
    tx.locktime = data.locktime;

    data.vin.forEach((vin: any) => {
        const txHash = Buffer.from(vin.txid, 'hex').reverse();
        const vout = vin.vout;
        const sequence = vin.sequence;
        const scriptSig = vin.scriptsig
            ? Buffer.from(vin.scriptsig, 'hex')
            : undefined;
        tx.addInput(txHash, vout, sequence, scriptSig);
    });

    data.vout.forEach((vout: any) => {
        const value = vout.value;
        const scriptPubKey = Buffer.from(vout.scriptpubkey, 'hex');
        tx.addOutput(scriptPubKey, value);
    });

    data.vin.forEach((vin: any, index: any) => {
        if (vin.witness && vin.witness.length > 0) {
            const witness = vin.witness.map((w: any) => Buffer.from(w, 'hex'));
            tx.setWitness(index, witness);
        }
    });

    return tx;
};