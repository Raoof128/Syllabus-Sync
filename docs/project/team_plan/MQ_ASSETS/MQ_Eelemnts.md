### **🎨 Colours / Tokens**

The system uses a \--c-\[name\]-\[weight\] naming convention.

Brand & Primary

| Variable | Value | Usage |

| :--- | :--- | :--- |

| \--c-red | \#a6192e | Base Brand |

| \--c-bright-red | \#d6001c | Bright Primary |

| \--c-deep-red | \#76232f | Deep Primary |

| \--c-magenta | \#c6007e | Alt Bright |

| \--c-purple | \#80225f | Alt Primary |

| \--c-brand-primary | var(--c-red) | Mapped Primary |

| \--c-brand-secondary | var(--c-sand-200) | Mapped Secondary |

Neutrals (Grey/Sand/Navy)

| Palette | Variables | Range |

| :--- | :--- | :--- |

| Charcoal | \--c-charcoal-\[600-900\] | \#71736b to \#262826 |

| Sand | \--c-sand-\[100-500\] | \#f7f6f3 to \#919288 |

| Navy | \--c-navy-\[600-900\] | \#73808c to \#2d3945 |

| Slate | \--c-slate-\[100-500\] | \#ecf2f6 to \#8d98a1 |

**Specific Mappings**

* **Background:** \--c-background (White), \--c-background-invert (Charcoal 900\)  
* **Content:** \--c-content (Charcoal), \--c-content-faded (Charcoal 600\)  
* **mq-dark:** Overrides brand colors to mq-dark-red, mq-dark-purple, etc.

---

### 

### 

### **✍️ Typography**

Found two distinct font families and a standard scale.

**Font Families**

* **Primary:** \--f-primary: "Work Sans", sans-serif  
* **Secondary:** \--f-secondary: "Source Serif Pro", serif

**Weights & Styles**

* **Primary:** Regular (400), Medium (500), Semi-Bold (600), Bold (700)  
* **Secondary:** Light (300), Regular (400), Semi-Bold (600)

**Scale (fs)**

* \--fs-small (.875rem) → \--fs-regular (1rem) ... up to \--fs-x-mega (3rem)

---

### **🌀 Motion**

Animations use a custom prefix \--t- (likely "transition" or "time").

| Variable | Time | Bezier Curve |
| :---- | :---- | :---- |
| \--t-ease-slow | .6s | cubic-bezier(.5, .5, 0, 1\) |
| \--t-ease-fast | .3s | cubic-bezier(.5, .5, 0, 1\) |
| \--t-snap-slow | .3s | cubic-bezier(0, 0, 0, 1\) |
| \--t-snap-fast | .15s | cubic-bezier(0, 0, 0, 1\) |

---

