import "./Checkbox.sass"
import { useEffect, useState } from "react"
import { Procedure } from "../common/lang.ts"

export type CheckboxProps = {
    label: string
    color?: string
    onChange: Procedure<boolean>
    checked?: boolean
}

export const Checkbox = ({ label, color, onChange, checked }: CheckboxProps) => {
    const [isChecked, setIsChecked] = useState(checked ?? false)

    useEffect(() => onChange(isChecked), [onChange, isChecked])

    const id = crypto.randomUUID()

    return (
        <>
            <input type="checkbox" id={id} checked={isChecked} onChange={() => setIsChecked(value => !value)} />
            <label className="checkbox" htmlFor={id}>
                <svg style={{ color: color ?? "inherit" }}>
                    <use href="#checkbox-false"></use>
                    <use href="#checkbox-true"></use>
                </svg>
                <span>{label}</span>
            </label>
        </>
    )
}