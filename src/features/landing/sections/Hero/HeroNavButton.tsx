import { ChevronLeft, ChevronRight } from "@/components/foundations/hugeicons";

interface HeroNavButtonProps {
  direction: "left" | "right";
  disabled?: boolean;
  onClick: () => void;
}

export const HeroNavButton = ({
  direction,
  disabled,
  onClick,
}: HeroNavButtonProps) => {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        absolute top-1/2 -translate-y-1/2 ${
          direction === "left" ? "left-0 md:-left-16" : "right-0 md:-right-16"
        }
        z-20 p-4 rounded-lg border border-border
        bg-card
        hover:bg-primary/20 hover:border-primary/50
        transition-all active:scale-95
        disabled:opacity-30 disabled:cursor-not-allowed
      `}
    >
      <Icon className="w-6 h-6 text-primary" />
    </button>
  );
};
