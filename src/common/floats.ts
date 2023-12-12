import { float, int } from "./lang"

const dataView = new DataView(new ArrayBuffer(8))

export namespace Float {
    const EXP_BIT_MASK = 2139095040 as const
    const SIGNIFICANT_BIT_MASK = 8388607 as const
    const ARRAY_BUFFER: ArrayBuffer = new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT)
    const FLOAT_VIEW: Float32Array = new Float32Array(ARRAY_BUFFER)
    const INT_VIEW: Int32Array = new Int32Array(ARRAY_BUFFER)

    /**
     * Returns a representation of the specified floating-point value according to the IEEE 754 floating-point "single format" bit layout.
     * @param value a floating-point number.
     * @returns the bits that represent the floating-point number.
     */
    export const floatToIntBits = (value: float): int => {
        const result = Float.floatToRawIntBits(value)
        if ((result & EXP_BIT_MASK) === EXP_BIT_MASK && (result & SIGNIFICANT_BIT_MASK) !== 0) {
            return 0x7fc00000
        }
        return result
    }

    export const intBitsToFloat = (value: int): float => {
        INT_VIEW[0] = value
        return FLOAT_VIEW[0]
    }

    export const floatToRawIntBits = (value: float): int => {
        FLOAT_VIEW[0] = value
        return INT_VIEW[0]
    }

    export const toFloat32 = (value: number): float => {
        dataView.setFloat32(0, value)
        return dataView.getFloat32(0)
    }
}

export namespace Float16 {
    export const floatToIntBits = (value: float): int => {
        const bits = Float.floatToIntBits(value)
        const sign = bits >>> 16 & 0x8000
        let val = (bits & 0x7fffffff) + 0x1000
        if (val >= 0x47800000) {
            if ((bits & 0x7fffffff) >= 0x47800000) {
                if (val < 0x7f800000) {
                    return sign | 0x7c00
                }
                return sign | 0x7c00 | (bits & 0x007fffff) >>> 13
            }
            return sign | 0x7bff
        }
        if (val >= 0x38800000) {
            return sign | val - 0x38000000 >>> 13
        }
        if (val < 0x33000000) {
            return sign
        }
        val = (bits & 0x7fffffff) >>> 23
        return sign | ((bits & 0x7fffff | 0x800000) + (0x800000 >>> val - 102) >>> 126 - val)
    }

    export const intBitsToFloat = (bits: int): float => {
        let mantissa = bits & 0x03ff
        let exp = bits & 0x7c00
        if (exp === 0x7c00) {
            exp = 0x3fc00
        } else if (exp !== 0) {
            exp += 0x1c000
            if (mantissa === 0 && exp > 0x1c400) {
                return Float.intBitsToFloat((bits & 0x8000) << 16 | exp << 13 | 0x3ff)
            }
        } else if (mantissa !== 0) {
            exp = 0x1c400
            do {
                mantissa <<= 1
                exp -= 0x400
            } while ((mantissa & 0x400) === 0)
            mantissa &= 0x3ff
        }
        return Float.intBitsToFloat((bits & 0x8000) << 16 | (exp | mantissa) << 13)
    }
}