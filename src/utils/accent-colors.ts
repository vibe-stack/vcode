import { cn } from "./tailwind";

// Map of accent colors to their gradient classes with complementary secondary colors
const accentGradients: Record<
  string,
  {
    base: string;
    hover: string;
  }
> = {
  blue: {
    base: "from-blue-500 to-indigo-600",
    hover: "from-blue-600 to-indigo-700",
  },
  purple: {
    base: "from-purple-500 to-pink-600",
    hover: "from-purple-600 to-pink-700",
  },
  pink: {
    base: "from-pink-500 to-rose-600",
    hover: "from-pink-600 to-rose-700",
  },
  red: {
    base: "from-red-500 to-rose-600",
    hover: "from-red-600 to-rose-700",
  },
  orange: {
    base: "from-orange-500 to-red-600",
    hover: "from-orange-600 to-red-700",
  },
  yellow: {
    base: "from-yellow-500 to-orange-600",
    hover: "from-yellow-600 to-orange-700",
  },
  green: {
    base: "from-green-500 to-teal-600",
    hover: "from-green-600 to-teal-700",
  },
  teal: {
    base: "from-teal-500 to-cyan-600",
    hover: "from-teal-600 to-cyan-700",
  },
  cyan: {
    base: "from-cyan-500 to-sky-600",
    hover: "from-cyan-600 to-sky-700",
  },
  gray: {
    base: "from-gray-500 to-zinc-600",
    hover: "from-gray-600 to-zinc-700",
  },
};

export function getAccentClasses(accentColor: string, isActive: boolean) {
  const gradient = accentGradients[accentColor] || accentGradients.blue;

  if (!isActive) return "";

  return cn(
    "bg-gradient-to-r text-white",
    gradient.base,
    `hover:${gradient.hover}`,
  );
}

export function getActiveAccentClasses(
  accentColor: string,
  useGradient: boolean = true,
) {
  if (!useGradient) {
    // Solid color classes
    const solidColors: Record<string, { base: string; hover: string }> = {
      blue: { base: "bg-blue-500", hover: "hover:bg-blue-600" },
      purple: { base: "bg-purple-500", hover: "hover:bg-purple-600" },
      pink: { base: "bg-pink-500", hover: "hover:bg-pink-600" },
      red: { base: "bg-red-500", hover: "hover:bg-red-600" },
      orange: { base: "bg-orange-500", hover: "hover:bg-orange-600" },
      yellow: { base: "bg-yellow-500", hover: "hover:bg-yellow-600" },
      green: { base: "bg-green-500", hover: "hover:bg-green-600" },
      teal: { base: "bg-teal-500", hover: "hover:bg-teal-600" },
      cyan: { base: "bg-cyan-500", hover: "hover:bg-cyan-600" },
      gray: { base: "bg-gray-500", hover: "hover:bg-gray-600" },
    };

    const solid = solidColors[accentColor] || solidColors.blue;
    return cn(solid.base, solid.hover, "text-white");
  }

  const gradient = accentGradients[accentColor] || accentGradients.blue;

  return cn(
    "bg-gradient-to-r",
    gradient.base,
    "text-white",
    `hover:${gradient.hover.split(" ").join(" hover:")}`,
  );
}

// Get glow styles for input focus states
export function getAccentGlowStyle(
  accentColor: string,
  useGradient: boolean = true,
) {
  const colors: Record<string, { primary: string; secondary: string }> = {
    blue: { primary: "59, 130, 246", secondary: "79, 70, 229" },
    purple: { primary: "168, 85, 247", secondary: "236, 72, 153" },
    pink: { primary: "236, 72, 153", secondary: "244, 63, 94" },
    red: { primary: "239, 68, 68", secondary: "244, 63, 94" },
    orange: { primary: "249, 115, 22", secondary: "239, 68, 68" },
    yellow: { primary: "234, 179, 8", secondary: "249, 115, 22" },
    green: { primary: "34, 197, 94", secondary: "20, 184, 166" },
    teal: { primary: "20, 184, 166", secondary: "6, 182, 212" },
    cyan: { primary: "6, 182, 212", secondary: "2, 132, 199" },
    gray: { primary: "107, 114, 128", secondary: "82, 82, 91" },
  };

  const color = colors[accentColor] || colors.blue;

  if (!useGradient) {
    return {
      borderColor: `rgb(${color.primary})`,
      borderWidth: "2px",
      boxShadow: `0 0 12px rgba(${color.primary}, 0.5)`,
    };
  }

  // Return gradient glow with animation
  return {
    borderColor: `rgb(${color.primary})`,
    borderWidth: "2px",
    boxShadow: `0 0 12px rgba(${color.primary}, 0.5), 0 0 20px rgba(${color.secondary}, 0.3)`,
    animation: "gradient-glow 2s ease-in-out infinite",
  };
}

// Get message background tint classes
export function getAccentMessageClasses(accentColor: string) {
  const messageColors: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20",
    purple: "bg-purple-500/10 border-purple-500/20",
    pink: "bg-pink-500/10 border-pink-500/20",
    red: "bg-red-500/10 border-red-500/20",
    orange: "bg-orange-500/10 border-orange-500/20",
    yellow: "bg-yellow-500/10 border-yellow-500/20",
    green: "bg-green-500/10 border-green-500/20",
    teal: "bg-teal-500/10 border-teal-500/20",
    cyan: "bg-cyan-500/10 border-cyan-500/20",
    gray: "bg-gray-500/10 border-gray-500/20",
  };

  return messageColors[accentColor] || messageColors.blue;
}
