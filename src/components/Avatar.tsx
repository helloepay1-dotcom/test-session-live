import { getInitials } from "@/lib/colors";

interface AvatarProps {
  nom: string;
  couleur: string;
  size?: "sm" | "md" | "lg";
  enLigne?: boolean;
}

const sizes = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

const dotSizes = {
  sm: "w-2 h-2 border",
  md: "w-2.5 h-2.5 border-2",
  lg: "w-3 h-3 border-2",
};

export default function Avatar({
  nom,
  couleur,
  size = "md",
  enLigne,
}: AvatarProps) {
  return (
    <div className="relative inline-flex">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
        style={{ backgroundColor: couleur }}
        title={nom}
      >
        {getInitials(nom)}
      </div>
      {enLigne !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${dotSizes[size]} rounded-full border-surface-raised ${
            enLigne ? "bg-green-400" : "bg-zinc-600"
          }`}
        />
      )}
    </div>
  );
}
