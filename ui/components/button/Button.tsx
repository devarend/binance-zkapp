import { FC, PropsWithChildren } from "react";

const Button: FC<PropsWithChildren<ButtonProps>> = ({
  isLoading = false,
  onClick,
  className = "",
  children,
}) => {
  const loadingClassName = isLoading ? "loading" : null;
  return (
    <button
      onClick={onClick}
      className={`btn my-1 ${loadingClassName} ${className}`}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
};

interface ButtonProps {
  isLoading?: boolean;
  className?: string;

  onClick?(): void;
}

export default Button;
