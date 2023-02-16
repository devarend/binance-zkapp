import { FC } from "react";
import Button from "../button/Button";

const TransactionModal: FC<TransactionModalProps> = ({
  id,
  title,
  description,
  transactionHash,
  isVisible = false,
  close,
  error = false,
}) => {
  const openModalClassName = isVisible ? "modal-open" : null;
  const openTransaction = () => {
    window.open(
      "https://berkeley.minaexplorer.com/transaction/" + transactionHash,
      "_blank"
    );
  };

  return (
    <>
      <input onChange={close} type="checkbox" id={id} className="invisible" />
      <label
        htmlFor={id}
        className={`modal modal-bottom sm:modal-middle ${openModalClassName}`}
      >
        <label className="modal-box relative" htmlFor="">
          <label
            htmlFor={id}
            className="btn btn-sm btn-circle absolute right-2 top-2 btn-primary text-black"
          >
            ✕
          </label>
          <h3 className="text-lg font-bold">{title}</h3>
          <div className="my-4">
            {error ? (
              <>
                <div className="alert alert-error shadow-lg">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="stroke-current flex-shrink-0 h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{description}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold my-4">Error message</h3>
                <div className="mockup-code">
                  <pre data-prefix=">">
                    <code>{error}</code>
                  </pre>
                </div>
              </>
            ) : (
              <div className="alert shadow-lg">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current flex-shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{description}</span>
                </div>
                <button
                  onClick={openTransaction}
                  className="btn btn-sm btn-primary text-black"
                >
                  Open transaction
                </button>
              </div>
            )}
          </div>
          <div className="modal-action">
            <Button onClick={close} className="btn-primary text-black">
              Close
            </Button>
          </div>
        </label>
      </label>
    </>
  );
};

interface TransactionModalProps {
  id: string;
  title: string;
  isVisible: boolean;
  description: string;
  error?: string;
  transactionHash?: string;

  close(): void;
}

export default TransactionModal;
