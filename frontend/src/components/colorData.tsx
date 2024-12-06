
import numeral from "numeral"

interface colorDataProps {
    value: number;
    formatStr: string
}

const colorFlag = (v: number) => { return v > 0 ? "#FF4646" : "#408888" }

const ColorData = ({
    value,
    formatStr
}: colorDataProps) => {
    return <span style={{ color: colorFlag(value), fontWeight: "bold" }}>
        {numeral(value).format(formatStr)}
    </span>
}

export default ColorData;