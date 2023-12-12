import { Communicator } from "../common/communicator"
import { Messenger } from "../common/messenger"
import { Peaks } from "../common/peaks"
import { FloatArray, int, Procedure } from "../common/lang"
import PeakWorkerProtocol = Peaks.PeakWorkerProtocol

Communicator.createProtocolExecutor(Messenger.for(self).channel("peaks"), new class implements PeakWorkerProtocol {
    async generateAsync(progress: Procedure<number>,
                        shifts: Uint8Array,
                        frames: FloatArray[],
                        numFrames: int,
                        numChannels: int): Promise<Peaks.Stages> {
        return Peaks.generate(progress, shifts, frames, numFrames, numChannels)
    }
})