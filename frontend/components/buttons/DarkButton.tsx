import { ReactNode } from "react";

export const DarkButton = ({
  children,
  onClick,
  size = "small",
}: {
  children: ReactNode;
  onClick: () => void;
  size?: "big" | "small";
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        inline-flex items-center justify-center cursor-pointer font-semibold
        bg-gray-900 text-white hover:bg-gray-700 rounded-lg transition-colors
        ${size === "small" ? "px-4 py-2 text-sm" : "px-6 py-3 text-base"}
      `}
    >
      {children}
    </div>
  );
};
