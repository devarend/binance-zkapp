import {FC} from "react";
import Button from "../button/Button";

const CTAModal: FC<CTAModalProps> = ({id, title, description, onClick, buttonText, isLoading = false, isVisible, close}) => {
    const openModalClassName = isVisible ? 'modal-open' : null
    return (
        <>
            <input onChange={close} type="checkbox" id={id} className="invisible"/>
            <label htmlFor={id} className={`modal modal-bottom sm:modal-middle ${openModalClassName}`}>
                <label className="modal-box relative" htmlFor="">
                    <label htmlFor={id}
                           className="btn btn-sm btn-circle absolute right-2 top-2 btn-primary text-black">✕</label>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="py-2">{description}</p>
                    <div className="modal-action">
                        <Button isLoading={isLoading} onClick={onClick} className="btn-primary text-black">{buttonText}</Button>
                    </div>
                </label>
            </label>
        </>
    )
}

interface CTAModalProps {
    id: string
    title: string
    description: string
    buttonText: string
    isLoading?: boolean
    isVisible: boolean
    close(): void

    onClick(): void
}

export default CTAModal
