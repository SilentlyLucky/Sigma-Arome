"use client";

import { createTheme } from "@mantine/core";

export const theme = createTheme({
  colors: {
    // Primary brand green — index 5 is main (#2E7D32), index 0 is active bg for variant="light"
    primary: [
      "#D7F0DB",  // 0 - active bg (light variant)
      "#C8E6C9",  // 1 - border
      "#A5D6A7",  // 2
      "#81C784",  // 3
      "#4CAF50",  // 4 - dark mode shade
      "#2E7D32",  // 5 - brand (light mode main)
      "#1B5E20",  // 6 - hover
      "#145218",  // 7
      "#0D3B11",  // 8
      "#07230A",  // 9
    ],
    // Cool neutral gray (green-tinted)
    gray: [
      "#F9FAF9",  // 0
      "#F3F5F3",  // 1
      "#DCE5DD",  // 2 - border
      "#D1D9D1",  // 3
      "#9CA3AF",  // 4 - muted
      "#6B7280",  // 5 - body muted
      "#4B5563",  // 6 - body
      "#374151",  // 7
      "#1F2937",  // 8 - heading
      "#111827",  // 9
    ],
    success: [
      "var(--ds-success-100, #F1F8F4)",
      "var(--ds-success-200, #E8F5E9)",
      "var(--ds-success-300, #C8E6C9)",
      "var(--ds-success-400, #A5D6A7)",
      "var(--ds-success-500, #4CAF50)",
      "var(--ds-success, #2E7D32)",
      "var(--ds-success-700, #1B5E20)",
      "var(--ds-success-800, #145218)",
      "var(--ds-success-900, #0D3B11)",
      "var(--ds-success-950, #031004)"
    ],
    info: [
      "var(--ds-info-100, #f0f9ff)",
      "var(--ds-info-200, #e0f2fe)",
      "var(--ds-info-300, #bae6fd)",
      "var(--ds-info-400, #7dd3fc)",
      "var(--ds-info-500, #38bdf8)",
      "var(--ds-info, #0ea5e9)",
      "var(--ds-info-700, #0284c7)",
      "var(--ds-info-800, #0369a1)",
      "var(--ds-info-900, #075985)",
      "var(--ds-info-950, #082f49)"
    ],
    warning: [
      "var(--ds-warning-100, #fffbeb)",
      "var(--ds-warning-200, #fef3c7)",
      "var(--ds-warning-300, #fde68a)",
      "var(--ds-warning-400, #fcd34d)",
      "var(--ds-warning-500, #fbbf24)",
      "var(--ds-warning, #d97706)",
      "var(--ds-warning-700, #b45309)",
      "var(--ds-warning-800, #92400e)",
      "var(--ds-warning-900, #78350f)",
      "var(--ds-warning-950, #451a03)"
    ],
    danger: [
      "var(--ds-danger-100, #fef2f2)",
      "var(--ds-danger-200, #fee2e2)",
      "var(--ds-danger-300, #fecaca)",
      "var(--ds-danger-400, #fca5a5)",
      "var(--ds-danger-500, #f87171)",
      "var(--ds-danger, #DC2626)",
      "var(--ds-danger-700, #B91C1C)",
      "var(--ds-danger-800, #991B1B)",
      "var(--ds-danger-900, #7F1D1D)",
      "var(--ds-danger-950, #450a0a)"
    ],
  },
  primaryColor: "primary",
  primaryShade: { light: 5, dark: 4 },
  fontFamily: "var(--ds-font-family)",
  fontFamilyMonospace: "var(--ds-font-mono, 'JetBrains Mono', SFMono-Regular, Consolas, monospace)",
  headings: {
    fontWeight: "700",
    fontFamily: "var(--ds-font-family)",
    sizes: {
      h1: { lineHeight: "1.2" },
      h2: { lineHeight: "1.25" },
      h3: { lineHeight: "1.3" },
      h4: { lineHeight: "1.35" },
    }
  },
  fontSizes: {
    xs: "var(--ds-font-size-xs)",
    sm: "var(--ds-font-size-sm)",
    md: "var(--ds-font-size-base)",
    lg: "var(--ds-font-size-lg)",
    xl: "var(--ds-font-size-2xl)"
  },
  spacing: {
    xs: "var(--ds-spacing-2)",
    sm: "var(--ds-spacing-3)",
    md: "var(--ds-spacing-4)",
    lg: "var(--ds-spacing-6)",
    xl: "var(--ds-spacing-8)"
  },
  radius: {
    xs: "4px",
    sm: "var(--ds-radius-sm, 6px)",
    md: "var(--ds-radius-md, 12px)",
    lg: "var(--ds-radius-lg, 16px)",
    xl: "var(--ds-radius-xl, 20px)"
  },
  shadows: {
    xs: "var(--ds-shadow-sm)",
    sm: "var(--ds-shadow-sm)",
    md: "var(--ds-shadow)",
    lg: "var(--ds-shadow-md)",
    xl: "var(--ds-shadow-lg)"
  },
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        root: {
          fontWeight: "600",
          fontSize: "var(--mantine-font-size-sm)",
          transition: "transform 0.15s, box-shadow 0.15s, background 0.15s"
        }
      }
    },
    Input: {
      styles: {
        input: {
          borderRadius: "var(--ds-radius-md, 12px)",
          borderColor: "var(--ds-gray-300, #E8ECE8)",
          fontSize: "var(--mantine-font-size-sm)",
          transition: "border-color var(--ds-transition-fast, 150ms ease), box-shadow var(--ds-transition-fast, 150ms ease)"
        }
      }
    },
    Card: {
      defaultProps: {
        radius: "lg",
        shadow: "sm",
      },
      styles: {
        root: {
          borderColor: "var(--ds-border-color, #DCE5DD)",
        }
      }
    },
    Paper: {
      styles: {
        root: {
          borderRadius: "var(--ds-radius-lg, 16px)",
          borderColor: "var(--ds-border-color, #DCE5DD)",
        }
      }
    },
    Modal: {
      styles: {
        header: {
          borderBottom: "1px solid var(--ds-border-color, #E8ECE8)",
          padding: "var(--ds-spacing-4) var(--ds-spacing-6)",
          marginBottom: 0
        },
        title: {
          fontWeight: 600,
          fontSize: "var(--ds-font-size-lg)",
          color: "#0F172A"
        },
        body: {
          padding: "var(--ds-spacing-6)"
        },
        content: {
          borderRadius: "var(--ds-radius-xl, 20px)",
          boxShadow: "var(--ds-shadow-xl)"
        },
        close: {
          color: "var(--ds-gray-600, #6B7280)"
        }
      }
    },
    Popover: {
      styles: {
        dropdown: {
          borderRadius: "var(--ds-radius-lg, 16px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          border: "1px solid var(--ds-border-color, #E8ECE8)"
        }
      }
    },
    Badge: {
      styles: {
        root: {
          borderRadius: "999px",
          fontSize: "var(--ds-font-size-xs)",
          fontWeight: "600",
          textTransform: "none" as const
        }
      }
    },
    TextInput: {
      styles: {
        label: {
          fontSize: "var(--mantine-font-size-sm)",
          fontWeight: "600",
          color: "#0F172A",
          marginBottom: "4px"
        },
        input: {
          fontFamily: "var(--mantine-font-family)"
        }
      }
    },
    NumberInput: {
      styles: {
        label: {
          fontSize: "var(--mantine-font-size-sm)",
          fontWeight: "600",
          color: "#0F172A",
          marginBottom: "4px"
        }
      }
    },
    Select: {
      styles: {
        label: {
          fontSize: "var(--mantine-font-size-sm)",
          fontWeight: "600",
          color: "#0F172A",
          marginBottom: "4px"
        }
      }
    },
    Table: {
      styles: {
        table: {
          fontSize: "var(--mantine-font-size-sm)"
        },
        th: {
          fontWeight: "600",
          fontSize: "var(--ds-font-size-xs)",
          color: "#374151"
        }
      }
    },
    Tabs: {
      styles: {
        tab: {
          fontWeight: "500",
          fontSize: "var(--mantine-font-size-sm)",
          borderRadius: "8px",
          transition: "background var(--ds-transition-fast, 150ms ease), color var(--ds-transition-fast, 150ms ease)"
        }
      }
    },
    NavLink: {
      styles: {
        root: {
          borderRadius: "10px",
          marginBottom: "2px",
          fontWeight: "500",
          fontSize: "var(--ds-font-size-base)",
        },
        label: {
          fontSize: "var(--ds-font-size-base)",
        }
      }
    },
    Tooltip: {
      defaultProps: {
        withArrow: true,
        arrowSize: 6,
      },
      styles: {
        tooltip: {
          fontSize: "var(--ds-font-size-xs)",
          borderRadius: "var(--mantine-radius-sm)"
        }
      }
    },
    Group: {
      defaultProps: {
        gap: "sm"
      }
    },
    Stack: {
      defaultProps: {
        gap: "md"
      }
    }
  }
});
