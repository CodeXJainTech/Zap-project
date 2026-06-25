export const ZapCell = ({
  name,
  index,
  onClick,
  onRemove,
  image,
  isLast = false,
}: {
  name?: string;
  index: number;
  onClick: () => void;
  onRemove?: (e: React.MouseEvent) => void;
  image?: string;
  isLast?: boolean;
}) => {
  const isTrigger = index === 1;

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      {/* card */}
      <div
        onClick={onClick}
        className={`
          flex items-center gap-3 w-full px-5 py-4 cursor-pointer rounded-xl border-2
          transition-all duration-150 shadow-sm hover:shadow-md
          ${isTrigger
            ? "border-amber-400 bg-amber-50 hover:bg-amber-100"
            : "border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50"
          }
        `}
      >
        {/* step badge */}
        <div
          className={`
            w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
            ${isTrigger ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-600"}
          `}
        >
          {index}
        </div>

        {/* icon */}
        {image ? (
          <img
            src={image}
            className="w-9 h-9 rounded-xl object-contain bg-white border border-gray-200 p-0.5 shrink-0"
          />
        ) : (
          <div
            className={`
              w-9 h-9 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0
              ${isTrigger ? "border-amber-400 bg-amber-100" : "border-gray-300 bg-gray-100"}
            `}
          >
            <span className="text-gray-400 text-base leading-none">+</span>
          </div>
        )}

        {/* label */}
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {isTrigger ? "Trigger" : "Action"}
          </span>
          <span
            className={`text-sm font-semibold truncate ${
              name ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {name || (isTrigger ? "Choose a trigger" : "Choose an action")}
          </span>
        </div>

        {/* chevron or remove */}
        {onRemove ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(e);
            }}
            className="ml-auto shrink-0 text-gray-300 hover:text-red-500 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <svg
            className="ml-auto shrink-0 text-gray-300"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* connector line — only shown between steps, never after last */}
      {!isLast && (
        <div className="flex flex-col items-center py-0.5">
          <div className="w-px h-5 bg-gray-300" />
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M5 6L0 0H10L5 6Z" fill="#d1d5db" />
          </svg>
        </div>
      )}
    </div>
  );
};