import assert from 'assert';
import crypto from 'crypto';

import { prng } from '@guildofweavers/air-assembly';
import { createPrimeField, FiniteField } from '@guildofweavers/galois';

const getConstants = (field: FiniteField, seed: string, count: number): bigint[] => {
    const result = new Array<bigint>(count);
    for (let i = 0; i < count; i++) {
        const value = crypto.createHash('sha256').update(`${seed}${i}`).digest();
        result[i] = field.add(BigInt(`0x${value.toString('hex')}`), 0n);
    }
    return result;
};

const getMdsMatrix = (field: FiniteField, width: number) => {
    const xValues = getConstants(field, 'HadesMDSx', width);
    const yValues = getConstants(field, 'HadesMDSy', width);

    if (new Set([...xValues, ...yValues]).size !== width * 2) {
        throw new Error('MDS values are not all different');
    }

    const result = new Array<bigint[]>(width);
    for (let i = 0; i < width; i++) {
        result[i] = new Array<bigint>(width);
        for (let j = 0; j < width; j++) {
            result[i][j] = field.inv(field.sub(xValues[i], yValues[j]));
        }
    }
    return result;
};

const transpose = (matrix: bigint[][]) => {
    const rowCount = matrix.length;
    const colCount = matrix[0].length;

    const result = new Array<bigint[]>(colCount);
    for (let i = 0; i < colCount; i++) {
        result[i] = new Array<bigint>(rowCount);
        for (let j = 0; j < rowCount; j++) {
            result[i][j] = matrix[j][i];
        }
    }

    return result;
};

const createHash = (field: FiniteField, exp: bigint, rf: number, rp: number, stateWidth: number, rc: bigint[][]) => {
    const m = stateWidth;
    const mds = field.newMatrixFrom(getMdsMatrix(field, m));
    const ark = rc.map((v) => field.newVectorFrom(v));

    return function (inputs: bigint[]) {
        let stateValues: bigint[] = [];
        assert(inputs.length < m);
        assert(inputs.length > 0);
        for (let i = 0; i < inputs.length; i++) stateValues[i] = inputs[i];
        for (let i = inputs.length; i < m; i++) stateValues[i] = field.zero;

        let state = field.newVectorFrom(stateValues);
        for (let i = 0; i < rf + rp; i++) {
            state = field.addVectorElements(state, ark[i]);

            if ((i < rf / 2) || (i >= rf / 2 + rp)) {
                state = field.expVectorElements(state, exp);
            } else {
                stateValues = state.toValues();
                stateValues[m - 1] = field.exp(stateValues[m - 1], exp);
                state = field.newVectorFrom(stateValues);
            }

            state = field.mulMatrixByVector(mds, state);
        }
        return state.toValues().slice(0, 2);
    };
};

const modulus = 2n ** 128n - 9n * 2n ** 32n + 1n;
const field = createPrimeField(modulus);
const sBoxExp = 5n;
const stateWidth = 6;
const fRounds = 8;
const pRounds = 55;
export const rounds = fRounds + pRounds;
const roundConstants = transpose([
    prng.sha256(Buffer.from('Hades1'), 64, field),
    prng.sha256(Buffer.from('Hades2'), 64, field),
    prng.sha256(Buffer.from('Hades3'), 64, field),
    prng.sha256(Buffer.from('Hades4'), 64, field),
    prng.sha256(Buffer.from('Hades5'), 64, field),
    prng.sha256(Buffer.from('Hades6'), 64, field),
]);

export const poseidonHashJS = createHash(field, sBoxExp, fRounds, pRounds, stateWidth, roundConstants);
export const serializePoseidon = (poseidon: bigint[]) => poseidon.map((i) => i.toString(16).padStart(32, '0')).join('');
