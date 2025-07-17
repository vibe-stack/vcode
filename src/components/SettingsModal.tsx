import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings";
import {
  Settings,
  Key,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  Palette,
  Type,
  Terminal,
  Puzzle,
  Users,
  Shield,
  Info,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/tailwind";
import { Switch } from "@/components/ui/switch";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SettingsSection =
  | "appearance"
  | "editor"
  | "terminal"
  | "ai"
  | "extensions"
  | "accounts"
  | "security"
  | "about";

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    settings,
    secureSettings,
    initialize,
    setSetting,
    setSecureSetting,
    deleteSecureSetting,
    getSecureSetting,
  } = useSettingsStore();

  const [xaiApiKey, setXaiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("appearance");

  // Display settings - Initialize from store
  const [selectedAppFont, setSelectedAppFont] = useState(
    settings.appearance?.font?.family || "system",
  );
  const [selectedCodeFont, setSelectedCodeFont] = useState(
    settings.editor?.font?.family || "sf-mono",
  );
  const [appFontSize, setAppFontSize] = useState(
    settings.appearance?.font?.size?.toString() || "14",
  );
  const [codeFontSize, setCodeFontSize] = useState(
    settings.editor?.font?.size?.toString() || "13",
  );
  const [appFontBold, setAppFontBold] = useState(
    settings.appearance?.font?.bold || false,
  );
  const [codeFontBold, setCodeFontBold] = useState(
    settings.editor?.font?.bold || false,
  );
  const [selectedTerminalFont, setSelectedTerminalFont] = useState(
    settings.terminal?.font?.family || "sf-mono",
  );
  const [terminalFontSize, setTerminalFontSize] = useState(
    settings.terminal?.font?.size?.toString() || "13",
  );
  const [terminalFontBold, setTerminalFontBold] = useState(
    settings.terminal?.font?.bold || false,
  );
  const [selectedTheme, setSelectedTheme] = useState<
    "light" | "dark" | "dimmed" | "tinted"
  >(settings.appearance?.theme || "dark");
  const [selectedAccent, setSelectedAccent] = useState(
    settings.appearance?.accentColor || "blue",
  );
  const [accentGradient, setAccentGradient] = useState(
    settings.appearance?.accentGradient ?? true,
  );

  useEffect(() => {
    if (open) {
      initialize();
      loadApiKeys();
      // Apply current settings to CSS variables
      updateCSSVariables();
      updateTheme();
    }
  }, [open, initialize]);

  // Sync settings from store when modal opens
  useEffect(() => {
    if (open) {
      setSelectedAppFont(settings.appearance?.font?.family || "system");
      setSelectedCodeFont(settings.editor?.font?.family || "sf-mono");
      setAppFontSize(settings.appearance?.font?.size?.toString() || "14");
      setCodeFontSize(settings.editor?.font?.size?.toString() || "13");
      setAppFontBold(settings.appearance?.font?.bold || false);
      setCodeFontBold(settings.editor?.font?.bold || false);
      setSelectedTerminalFont(settings.terminal?.font?.family || "sf-mono");
      setTerminalFontSize(settings.terminal?.font?.size?.toString() || "13");
      setTerminalFontBold(settings.terminal?.font?.bold || false);
      setSelectedTheme(settings.appearance?.theme || "dark");
      setSelectedAccent(settings.appearance?.accentColor || "blue");
      setAccentGradient(settings.appearance?.accentGradient ?? true);
    }
  }, [open]); // Only sync when modal opens, not when settings change

  const loadApiKeys = async () => {
    try {
      const key = await getSecureSetting("apiKeys.xai");
      if (key && key !== "***") {
        setXaiApiKey(key);
      } else {
        setXaiApiKey("");
      }
    } catch (err) {
      console.error("Failed to load API keys:", err);
    }
  };

  const saveApiKey = async () => {
    if (!xaiApiKey.trim()) {
      setError("Please enter a valid API key");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await setSecureSetting("apiKeys.xai", xaiApiKey.trim());
      setSuccess("API key saved successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save API key");
      console.error("Save API key error:", err);
    } finally {
      setSaving(false);
    }
  };

  const removeApiKey = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await deleteSecureSetting("apiKeys.xai");
      setXaiApiKey("");
      setSuccess("API key removed successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to remove API key");
      console.error("Remove API key error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleGeneralSettingChange = async (key: string, value: any) => {
    try {
      await setSetting(key, value);
      // Update CSS variables for instant feedback
      if (key.includes("font") || key.includes("Font")) {
        updateCSSVariables();
      } else if (key === "appearance.theme") {
        updateTheme();
      }
    } catch (err) {
      console.error("Failed to save setting:", err);
    }
  };

  const updateCSSVariables = () => {
    const root = document.documentElement;

    // Font mapping
    const fontMap: Record<string, string> = {
      system:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      inter: "Inter, sans-serif",
      helvetica: "Helvetica, Arial, sans-serif",
      arial: "Arial, sans-serif",
      segoe: '"Segoe UI", Tahoma, sans-serif',
      roboto: "Roboto, sans-serif",
      tektur: "Tektur, sans-serif",
    };

    const codeFontMap: Record<string, string> = {
      "sf-mono": "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace",
      "fira-code": "'Fira Code', 'Cascadia Code', 'SF Mono', monospace",
      jetbrains: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      cascadia: "'Cascadia Code', 'Fira Code', 'SF Mono', monospace",
      "source-code-pro": "'Source Code Pro', 'SF Mono', 'Fira Code', monospace",
      "ubuntu-mono": "'Ubuntu Mono', 'SF Mono', monospace",
      consolas: "Consolas, 'SF Mono', monospace",
      menlo: "Menlo, 'SF Mono', monospace",
      monaco: "Monaco, 'SF Mono', monospace",
      courier: "'Courier New', Courier, monospace",
      tektur: "Tektur, 'SF Mono', Monaco, Menlo, monospace",
    };

    // Update font families
    if (selectedAppFont && selectedAppFont !== "system") {
      root.style.setProperty(
        "--font-sans",
        fontMap[selectedAppFont] || fontMap["system"],
      );
    }

    if (selectedCodeFont) {
      root.style.setProperty(
        "--font-mono",
        codeFontMap[selectedCodeFont] || codeFontMap["sf-mono"],
      );
    }

    // Update font sizes
    root.style.setProperty("--app-font-size", `${appFontSize}px`);
    root.style.setProperty("--code-font-size", `${codeFontSize}px`);

    // Update font weights
    root.style.setProperty("--app-font-weight", appFontBold ? "600" : "400");
    root.style.setProperty("--code-font-weight", codeFontBold ? "600" : "400");
  };

  const updateTheme = () => {
    const root = document.documentElement;

    // Update theme separately from fonts
    if (selectedTheme === "light") {
      root.classList.remove("dark", "dimmed", "tinted");
    } else if (selectedTheme === "dark") {
      root.classList.remove("dimmed", "tinted");
      root.classList.add("dark");
    } else if (selectedTheme === "dimmed") {
      root.classList.remove("dark", "tinted");
      root.classList.add("dimmed");
    } else if (selectedTheme === "tinted") {
      root.classList.remove("dark", "dimmed");
      root.classList.add("tinted");
    }
  };

  const isXaiConfigured =
    secureSettings.apiKeys.xai && secureSettings.apiKeys.xai !== "***";

  const renderContent = () => {
    switch (activeSection) {
      case "appearance":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Appearance</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Customize how vCode looks and feels
              </p>
            </div>

            {/* Font Settings */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Fonts</h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Choose fonts for the interface and code editor
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* App Font */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Interface Font</Label>
                  <Select
                    value={selectedAppFont}
                    onValueChange={async (value) => {
                      setSelectedAppFont(value);
                      // Update CSS variable immediately
                      const root = document.documentElement;
                      const fontMap: Record<string, string> = {
                        system:
                          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        inter: "Inter, sans-serif",
                        helvetica: "Helvetica, Arial, sans-serif",
                        arial: "Arial, sans-serif",
                        segoe: '"Segoe UI", Tahoma, sans-serif',
                        roboto: "Roboto, sans-serif",
                        tektur: "Tektur, sans-serif",
                      };
                      root.style.setProperty(
                        "--font-sans",
                        fontMap[value] || fontMap["system"],
                      );
                      await handleGeneralSettingChange(
                        "appearance.font.family",
                        value,
                      );
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System Default</SelectItem>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="helvetica">Helvetica</SelectItem>
                      <SelectItem value="arial">Arial</SelectItem>
                      <SelectItem value="segoe">Segoe UI</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="tektur">Tektur</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={appFontSize}
                    onValueChange={async (value) => {
                      setAppFontSize(value);
                      // Update CSS variable immediately
                      document.documentElement.style.setProperty(
                        "--app-font-size",
                        `${value}px`,
                      );
                      await handleGeneralSettingChange(
                        "appearance.font.size",
                        parseInt(value),
                      );
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11">11px</SelectItem>
                      <SelectItem value="12">12px</SelectItem>
                      <SelectItem value="13">13px</SelectItem>
                      <SelectItem value="14">14px (Default)</SelectItem>
                      <SelectItem value="15">15px</SelectItem>
                      <SelectItem value="16">16px</SelectItem>
                      <SelectItem value="18">18px</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="app-font-bold" className="text-xs">
                      Bold
                    </Label>
                    <Switch
                      id="app-font-bold"
                      checked={appFontBold}
                      onCheckedChange={async (checked) => {
                        setAppFontBold(checked);
                        // Update CSS variable immediately
                        document.documentElement.style.setProperty(
                          "--app-font-weight",
                          checked ? "600" : "400",
                        );
                        await handleGeneralSettingChange(
                          "appearance.font.bold",
                          checked,
                        );
                      }}
                      className="h-4 w-8"
                    />
                  </div>
                </div>

                {/* Code Font */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Code Font</Label>
                  <Select
                    value={selectedCodeFont}
                    onValueChange={async (value) => {
                      console.log(
                        "Font selected:",
                        value,
                        "Current:",
                        selectedCodeFont,
                      );
                      setSelectedCodeFont(value);
                      // Update CSS variable immediately before saving to settings
                      const root = document.documentElement;
                      const codeFontMap: Record<string, string> = {
                        "sf-mono":
                          "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace",
                        "fira-code":
                          "'Fira Code', 'Cascadia Code', 'SF Mono', monospace",
                        jetbrains:
                          "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
                        cascadia:
                          "'Cascadia Code', 'Fira Code', 'SF Mono', monospace",
                        "source-code-pro":
                          "'Source Code Pro', 'SF Mono', 'Fira Code', monospace",
                        "ubuntu-mono": "'Ubuntu Mono', 'SF Mono', monospace",
                        consolas: "Consolas, 'SF Mono', monospace",
                        menlo: "Menlo, 'SF Mono', monospace",
                        monaco: "Monaco, 'SF Mono', monospace",
                        courier: "'Courier New', Courier, monospace",
                        tektur: "Tektur, 'SF Mono', Monaco, Menlo, monospace",
                      };
                      const fontFamily =
                        codeFontMap[value] || codeFontMap["sf-mono"];
                      console.log("Setting CSS font:", fontFamily);
                      root.style.setProperty("--font-mono", fontFamily);
                      await handleGeneralSettingChange(
                        "editor.font.family",
                        value,
                      );
                      // Trigger editor update with NEW value
                      window.dispatchEvent(
                        new CustomEvent("editor-font-change", {
                          detail: { fontFamily: fontFamily },
                        }),
                      );
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sf-mono">SF Mono</SelectItem>
                      <SelectItem value="jetbrains">JetBrains Mono</SelectItem>
                      <SelectItem value="fira-code">Fira Code</SelectItem>
                      <SelectItem value="menlo">Menlo</SelectItem>
                      <SelectItem value="consolas">Consolas</SelectItem>
                      <SelectItem value="monaco">Monaco</SelectItem>
                      <SelectItem value="cascadia">Cascadia Code</SelectItem>
                      <SelectItem value="source-code-pro">
                        Source Code Pro
                      </SelectItem>
                      <SelectItem value="tektur">Tektur</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={codeFontSize}
                    onValueChange={async (value) => {
                      setCodeFontSize(value);
                      // Update CSS variable immediately
                      document.documentElement.style.setProperty(
                        "--code-font-size",
                        `${value}px`,
                      );
                      await handleGeneralSettingChange(
                        "editor.font.size",
                        parseInt(value),
                      );
                      // Force all Monaco editors to update NOW with the NEW value
                      const editors =
                        document.querySelectorAll(".monaco-editor");
                      editors.forEach(() => {
                        window.dispatchEvent(
                          new CustomEvent("editor-font-change", {
                            detail: { fontSize: parseInt(value) },
                          }),
                        );
                      });
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11">11px</SelectItem>
                      <SelectItem value="12">12px</SelectItem>
                      <SelectItem value="13">13px (Default)</SelectItem>
                      <SelectItem value="14">14px</SelectItem>
                      <SelectItem value="15">15px</SelectItem>
                      <SelectItem value="16">16px</SelectItem>
                      <SelectItem value="18">18px</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="code-font-bold" className="text-xs">
                      Bold
                    </Label>
                    <Switch
                      id="code-font-bold"
                      checked={codeFontBold}
                      onCheckedChange={async (checked) => {
                        setCodeFontBold(checked);
                        // Update CSS variable immediately
                        const fontWeight = checked ? "600" : "400";
                        document.documentElement.style.setProperty(
                          "--code-font-weight",
                          fontWeight,
                        );
                        await handleGeneralSettingChange(
                          "editor.font.bold",
                          checked,
                        );
                        // Trigger editor update with NEW value
                        window.dispatchEvent(
                          new CustomEvent("editor-font-change", {
                            detail: { fontWeight: fontWeight },
                          }),
                        );
                      }}
                      className="h-4 w-8"
                    />
                  </div>
                </div>

                {/* Terminal Font */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Terminal Font</Label>
                  <Select
                    value={selectedTerminalFont}
                    onValueChange={async (value) => {
                      setSelectedTerminalFont(value);
                      await handleGeneralSettingChange(
                        "terminal.font.family",
                        value,
                      );
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sf-mono">SF Mono</SelectItem>
                      <SelectItem value="jetbrains">JetBrains Mono</SelectItem>
                      <SelectItem value="fira-code">Fira Code</SelectItem>
                      <SelectItem value="menlo">Menlo</SelectItem>
                      <SelectItem value="consolas">Consolas</SelectItem>
                      <SelectItem value="monaco">Monaco</SelectItem>
                      <SelectItem value="cascadia">Cascadia Code</SelectItem>
                      <SelectItem value="source-code-pro">
                        Source Code Pro
                      </SelectItem>
                      <SelectItem value="tektur">Tektur</SelectItem>
                      <SelectItem value="ubuntu-mono">Ubuntu Mono</SelectItem>
                      <SelectItem value="courier">Courier New</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={terminalFontSize}
                    onValueChange={async (value) => {
                      setTerminalFontSize(value);
                      await handleGeneralSettingChange(
                        "terminal.font.size",
                        parseInt(value),
                      );
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11">11px</SelectItem>
                      <SelectItem value="12">12px</SelectItem>
                      <SelectItem value="13">13px (Default)</SelectItem>
                      <SelectItem value="14">14px</SelectItem>
                      <SelectItem value="15">15px</SelectItem>
                      <SelectItem value="16">16px</SelectItem>
                      <SelectItem value="18">18px</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="terminal-font-bold" className="text-xs">
                      Bold
                    </Label>
                    <Switch
                      id="terminal-font-bold"
                      checked={terminalFontBold}
                      onCheckedChange={async (checked) => {
                        setTerminalFontBold(checked);
                        await handleGeneralSettingChange(
                          "terminal.font.bold",
                          checked,
                        );
                      }}
                      className="h-4 w-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="space-y-3 border-t pt-3">
              <div>
                <h3 className="text-sm font-medium">Theme</h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Select your preferred color theme
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedTheme("light");
                    await handleGeneralSettingChange(
                      "appearance.theme",
                      "light",
                    );
                    updateTheme();
                  }}
                  className={cn(
                    "relative rounded-md border-2 p-4 text-left transition-all",
                    selectedTheme === "light"
                      ? "border-primary"
                      : "border-border hover:border-muted-foreground",
                  )}
                >
                  <div className="mb-2 text-xs font-medium">Light</div>
                  <div className="h-8 rounded-sm border bg-white" />
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setSelectedTheme("dark");
                    await handleGeneralSettingChange(
                      "appearance.theme",
                      "dark",
                    );
                    updateTheme();
                  }}
                  className={cn(
                    "relative rounded-md border-2 p-4 text-left transition-all",
                    selectedTheme === "dark"
                      ? "border-primary"
                      : "border-border hover:border-muted-foreground",
                  )}
                >
                  <div className="mb-2 text-xs font-medium">Dark</div>
                  <div className="h-8 rounded-sm border border-zinc-800 bg-zinc-900" />
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setSelectedTheme("dimmed");
                    await handleGeneralSettingChange(
                      "appearance.theme",
                      "dimmed",
                    );
                    updateTheme();
                  }}
                  className={cn(
                    "relative rounded-md border-2 p-4 text-left transition-all",
                    selectedTheme === "dimmed"
                      ? "border-primary"
                      : "border-border hover:border-muted-foreground",
                  )}
                >
                  <div className="mb-2 text-xs font-medium">Dimmed</div>
                  <div className="h-8 rounded-sm border border-zinc-700 bg-zinc-800" />
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setSelectedTheme("tinted");
                    await handleGeneralSettingChange(
                      "appearance.theme",
                      "tinted",
                    );
                    updateTheme();
                  }}
                  className={cn(
                    "relative rounded-md border-2 p-4 text-left transition-all",
                    selectedTheme === "tinted"
                      ? "border-primary"
                      : "border-border hover:border-muted-foreground",
                  )}
                >
                  <div className="mb-2 text-xs font-medium">Tinted</div>
                  <div className="h-8 rounded-sm border border-indigo-900 bg-indigo-950" />
                </button>
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-3 border-t pt-3">
              <div>
                <h3 className="text-sm font-medium">Accent Color</h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Choose an accent color for interactive elements
                </p>
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {[
                  { name: "blue", color: "bg-blue-500" },
                  { name: "purple", color: "bg-purple-500" },
                  { name: "pink", color: "bg-pink-500" },
                  { name: "red", color: "bg-red-500" },
                  { name: "orange", color: "bg-orange-500" },
                  { name: "yellow", color: "bg-yellow-500" },
                  { name: "green", color: "bg-green-500" },
                  { name: "teal", color: "bg-teal-500" },
                  { name: "cyan", color: "bg-cyan-500" },
                  { name: "gray", color: "bg-gray-500" },
                ].map((accent) => (
                  <button
                    key={accent.name}
                    type="button"
                    onClick={() => {
                      setSelectedAccent(accent.name);
                      handleGeneralSettingChange(
                        "appearance.accentColor",
                        accent.name,
                      );
                    }}
                    className={cn(
                      "h-8 w-8 rounded-md transition-all",
                      accent.color,
                      selectedAccent === accent.name &&
                        "ring-offset-background ring-primary ring-2 ring-offset-1",
                    )}
                    aria-label={`Select ${accent.name} accent`}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Label htmlFor="accent-gradient" className="text-xs">
                  Use gradient effect
                </Label>
                <Switch
                  id="accent-gradient"
                  checked={accentGradient}
                  onCheckedChange={async (checked) => {
                    setAccentGradient(checked);
                    await handleGeneralSettingChange(
                      "appearance.accentGradient",
                      checked,
                    );
                  }}
                  className="h-4 w-8"
                />
              </div>
            </div>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">AI Providers</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Configure AI models and API keys
              </p>
            </div>

            {/* XAI/Grok Configuration */}
            <Card className="border-muted">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>XAI (Grok)</span>
                  {isXaiConfigured && (
                    <Badge variant="default" className="h-5 text-[10px]">
                      Configured
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure XAI/Grok for AI assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="xai-api-key" className="text-xs">
                      API Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="xai-api-key"
                        type={showApiKey ? "text" : "password"}
                        placeholder="Enter your XAI API key"
                        value={xaiApiKey}
                        onChange={(e) => setXaiApiKey(e.target.value)}
                        className="h-8 pr-8 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-8 w-8 p-0"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="xai-model" className="text-xs">
                      Model
                    </Label>
                    <Select
                      value={settings.ai?.providers?.xai?.model || "grok-beta"}
                      onValueChange={(value) =>
                        handleGeneralSettingChange(
                          "ai.providers.xai.model",
                          value,
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grok-beta">Grok Beta</SelectItem>
                        <SelectItem value="grok-2-beta">Grok 2 Beta</SelectItem>
                        <SelectItem value="grok-2-vision-beta">
                          Grok 2 Vision Beta
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="xai-endpoint" className="text-xs">
                    API Endpoint (Optional)
                  </Label>
                  <Input
                    id="xai-endpoint"
                    placeholder="https://api.x.ai/v1"
                    className="h-8 text-xs"
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-500 bg-green-50 py-2">
                    <AlertCircle className="h-3 w-3 text-green-600" />
                    <AlertDescription className="text-xs text-green-800">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={saveApiKey}
                    disabled={saving || !xaiApiKey.trim()}
                    className="h-8 flex-1 text-xs"
                  >
                    <Save className="mr-1.5 h-3 w-3" />
                    {saving ? "Saving..." : "Save Configuration"}
                  </Button>
                  {isXaiConfigured && (
                    <Button
                      variant="outline"
                      onClick={removeApiKey}
                      disabled={saving}
                      className="h-8 text-xs"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="text-muted-foreground text-xs">
                  <p>
                    Get your API key from the{" "}
                    <a
                      href="https://console.x.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      XAI Console
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* OpenAI Configuration */}
            {/* <Card className="border-muted">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>OpenAI</span>
                  <Badge variant="outline" className="h-5 text-[10px]">
                    Not Configured
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure OpenAI GPT models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="openai-api-key" className="text-xs">
                      API Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="openai-api-key"
                        type="password"
                        placeholder="sk-..."
                        className="h-8 pr-8 text-xs"
                        disabled
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-8 w-8 p-0"
                        disabled
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="openai-model" className="text-xs">
                      Model
                    </Label>
                    <Select disabled>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">
                          GPT-3.5 Turbo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="openai-endpoint" className="text-xs">
                    API Endpoint (Optional)
                  </Label>
                  <Input
                    id="openai-endpoint"
                    placeholder="https://api.openai.com/v1"
                    className="h-8 text-xs"
                    disabled
                  />
                </div>

                <div className="text-muted-foreground text-xs">
                  <p>Coming soon</p>
                </div>
              </CardContent>
            </Card> */}

            {/* Anthropic Configuration */}
            {/* <Card className="border-muted">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Anthropic (Claude)</span>
                  <Badge variant="outline" className="h-5 text-[10px]">
                    Not Configured
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure Anthropic Claude models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="anthropic-api-key" className="text-xs">
                      API Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="anthropic-api-key"
                        type="password"
                        placeholder="sk-ant-..."
                        className="h-8 pr-8 text-xs"
                        disabled
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-8 w-8 p-0"
                        disabled
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="anthropic-model" className="text-xs">
                      Model
                    </Label>
                    <Select disabled>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claude-3-opus">
                          Claude 3 Opus
                        </SelectItem>
                        <SelectItem value="claude-3-sonnet">
                          Claude 3 Sonnet
                        </SelectItem>
                        <SelectItem value="claude-3-haiku">
                          Claude 3 Haiku
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="anthropic-endpoint" className="text-xs">
                    API Endpoint (Optional)
                  </Label>
                  <Input
                    id="anthropic-endpoint"
                    placeholder="https://api.anthropic.com"
                    className="h-8 text-xs"
                    disabled
                  />
                </div>

                <div className="text-muted-foreground text-xs">
                  <p>Coming soon</p>
                </div>
              </CardContent>
            </Card> */}
          </div>
        );

      case "about":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">About vCode</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Version and system information
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium">Version</p>
                <p className="text-muted-foreground text-xs">0.0.1</p>
              </div>
              <div>
                <p className="text-xs font-medium">Electron</p>
                <p className="text-muted-foreground text-xs">
                  v
                  {typeof process !== "undefined" && process.versions
                    ? process.versions.electron
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium">Node.js</p>
                <p className="text-muted-foreground text-xs">
                  v
                  {typeof process !== "undefined" && process.versions
                    ? process.versions.node
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium">Chrome</p>
                <p className="text-muted-foreground text-xs">
                  v
                  {typeof process !== "undefined" && process.versions
                    ? process.versions.chrome
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold capitalize">
                {activeSection}
              </h2>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {activeSection} settings coming soon...
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border/50 flex h-[75%] w-full flex-col p-0 sm:max-w-[90%] xl:max-w-7xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="text-base">Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          {/* Left Sidebar - Categories */}
          <div className="bg-muted/30 border-border/50 w-56 border-r p-2">
            <div className="space-y-0.5">
              {/* General */}
              <div className="px-2 py-1.5">
                <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                  General
                </p>
              </div>
              <button
                onClick={() => setActiveSection("appearance")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  activeSection === "appearance"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <Palette className="h-3.5 w-3.5" />
                Appearance
              </button>
              <button
                onClick={() => setActiveSection("editor")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  activeSection === "editor"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <Type className="h-3.5 w-3.5" />
                Editor
              </button>
              <button
                onClick={() => setActiveSection("terminal")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  activeSection === "terminal"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <Terminal className="h-3.5 w-3.5" />
                Terminal
              </button>

              {/* AI & Extensions */}
              <div className="px-2 py-1.5 pt-3">
                <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                  AI & Extensions
                </p>
              </div>
              <button
                onClick={() => setActiveSection("ai")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  activeSection === "ai"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <Key className="h-3.5 w-3.5" />
                AI Providers
              </button>
              <button
                onClick={() => setActiveSection("extensions")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  activeSection === "extensions"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <Puzzle className="h-3.5 w-3.5" />
                Extensions
              </button>

              {/* System */}
              <div className="px-2 py-1.5 pt-3">
                <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                  System
                </p>
              </div>
              <button
                onClick={() => setActiveSection("accounts")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  activeSection === "accounts"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <Users className="h-3.5 w-3.5" />
                Accounts
              </button>
              <button
                onClick={() => setActiveSection("security")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  activeSection === "security"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <Shield className="h-3.5 w-3.5" />
                Security
              </button>
              <button
                onClick={() => setActiveSection("about")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  activeSection === "about"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <Info className="h-3.5 w-3.5" />
                About
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="bg-background flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
