import "./Checkbox.sass"
import { useEffect, useState } from "react"
import { Procedure } from "../common/lang.ts"

export type CheckboxProps = {
    label: string
    onChange: Procedure<boolean>
    defaultChecked?: boolean
}

export const Checkbox = ({ label, onChange, defaultChecked }: CheckboxProps) => {
    const [isChecked, setIsChecked] = useState(defaultChecked ?? false)

    useEffect(() => onChange(isChecked), [onChange, isChecked])

    return (
        <label className="checkbox">
            <input type="checkbox" checked={isChecked}
                   onChange={() => setIsChecked(value => !value)} />
            <span>{label}</span>
        </label>
    )
}