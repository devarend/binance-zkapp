import {FC, PropsWithChildren} from "react";

const Button: FC<PropsWithChildren<ButtonProps>> = ({type = "button", htmlFor, isLoading = false, className = '',  children}) => {
    const loadingClassName = isLoading ? 'loading' : null
    if (type === 'label') return <label htmlFor={htmlFor} className="btn my-1">{children}</label>
    return (
        <button className={`btn ${loadingClassName} ${className}`}>{isLoading ? 'Loading...' : children}</button>
    )
}

interface ButtonProps {
    htmlFor?: string
    type?: 'button' | 'label'
    isLoading?: boolean,
    className?: string
}

export default Button