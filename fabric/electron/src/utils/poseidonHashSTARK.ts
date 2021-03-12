/* eslint-disable max-len */
import { instantiate } from '@guildofweavers/genstark';

const source = `(module
    # modulus = 2^224 - 2^96 + 1
    (field prime 340282366920938463463374607393113505793)

    # MDS matrix for Poseidon hash function
    (const $mds matrix
        (214709430312099715322788202694750992687  54066244720673262921467176400601950806 122144641489288436529811410313120680228  31306921464140082640306742797164216427 175168617969612323849888177639760381562 132141821748092528881872238908581032861)
        ( 83122512782280758906222839313578703456 163244785834732434882219275190570945140  65865044136286518938950810559808473518  18180551964097663916757206212354824776 249870759939216084597363298282234681285 277848157012146393126919156748857149900)
        ( 12333142678723890553278650076570367543 308304933036173868454178201249080175007  76915505462549994902479959396659996669  18709421677975378951783554559899201050 194094680499515472018551780371064260782 307996370140270198980510484883186251320)
        (208379730163689696681819863669840588820 139228116619884689637390357571491341686  20697300236245124157484102630323760041 149868860475127892585325727303994541834 267559900028452092630277575379158932918  82085214952496693902284543143423475908)
        ( 15202238431155429285648564568592062486 336660456679856225851744224588562255722 111484781404051652919056230896785744525  19879940832183425491077957046268887076  12604714924249352815400732976355636593   1385111712720963900529005819570184056)
        ( 56257924185444874124459580258315826298   6609414732577910747612629775769094818 222516026778809277319420550386007789953 186298854479664158795006770633754553086  83847903426790374369611045128936398695  18289323526456896741189879358874983848))

    # execute one round of Poseidon hash function
    (function $poseidonRound
        (result vector 6)
        (param $state vector 6) (param $roundKeys vector 6) (param $isFullRound scalar)
        (local $fullRound vector 6) (local $partRound vector 6)
        (store.local $fullRound
            (prod
                (load.const $mds)
                (exp
                    (add (load.param $state) (load.param $roundKeys))
                    (scalar 5))))
        (store.local $partRound
            (prod
                (load.const $mds)
                (vector
                    (add
                        (slice (load.param $state) 0 4)
                        (slice (load.param $roundKeys) 0 4))
                    (exp
                        (add (get (load.param $state) 5) (get (load.param $roundKeys) 5))
                        (scalar 5)))))
        (add
            (mul (load.local $fullRound) (load.param $isFullRound))
            (mul (load.local $partRound) (sub (scalar 1)  (load.param $isFullRound)))))

    # Poseidon hash function
    (export ComputePoseidonHash
        (registers 6) (constraints 6) (steps 64)
        (static
            (input secret (steps 64) (shift -1))    # 0: v1
            (input secret (steps 64) (shift -1))    # 1: v2
            (input secret (steps 64) (shift -1))    # 2: p1
            (input secret (steps 64) (shift -1))    # 3: p2
            (mask (input 0))
            (cycle 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 0)
            (cycle (prng sha256 0x486164657331 64))
            (cycle (prng sha256 0x486164657332 64))
            (cycle (prng sha256 0x486164657333 64))
            (cycle (prng sha256 0x486164657334 64))
            (cycle (prng sha256 0x486164657335 64))
            (cycle (prng sha256 0x486164657336 64)))
        (init
            (vector (slice (load.static 0) 0 3) (scalar 0) (scalar 0)))
        (transition
            (local vector 6)
            (store.local 0
                (call $poseidonRound (load.trace 0) (slice (load.static 0) 6 11) (get (load.static 0) 5)))
            (add
                (mul
                    (vector (slice (load.static 0) 0 3) (scalar 0) (scalar 0))
                    (get (load.static 0) 4))
                (mul
                    (load.local 0)
                    (sub (scalar 1) (get (load.static 0) 4)) )))
        (evaluation
            (local vector 6)
            (store.local 0
                (call $poseidonRound (load.trace 0) (slice (load.static 0) 6 11) (get (load.static 0) 5)))
            (sub
                (load.trace 1)
                (add
                    (mul
                        (vector (slice (load.static 0) 0 3) (scalar 0) (scalar 0))
                        (get (load.static 0) 4))
                    (mul
                        (load.local 0)
                        (sub (scalar 1) (get (load.static 0) 4))))))
    )
)`;

export const poseidonHashSTARK = instantiate(Buffer.from(source), 'ComputePoseidonHash', {
    hashAlgorithm: 'blake2s256',
    extensionFactor: 32,
    exeQueryCount: 44,
    friQueryCount: 20,
    wasm: true,
}, null);
