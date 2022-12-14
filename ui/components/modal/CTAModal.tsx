import {FC} from "react";

const CTAModal: FC<CTAModalProps> = ({id, title, description, onClick, buttonText}) => {
    return (
        <>
            <input type="checkbox" id={id} className="modal-toggle"/>
            <label htmlFor={id} className="modal modal-bottom sm:modal-middle">
                <label className="modal-box relative" htmlFor="">
                    <label htmlFor={id}
                           className="btn btn-sm btn-circle absolute right-2 top-2 btn-primary text-black">✕</label>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="py-2">{description}</p>
                    <div className="modal-action">
                        <button onClick={onClick} className="btn btn-primary text-black">{buttonText}</button>
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

    onClick(): void
}

export default CTAModal