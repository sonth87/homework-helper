# Universal Desktop Screen Translator

## Product Requirements, Technical Specification & Implementation Plan

**Document Type:** Product + Technical Requirements + Architecture Specification
**Target Platforms:** Windows 10/11, macOS
**Primary Framework:** Electron + React + TypeScript
**Primary Translation Provider:** Google Translate API
**Document Status:** Technical Planning / Architecture Definition
**Intended Reader:** AI coding agent, software architect, senior developer, frontend/backend engineer

---

# 1. Executive Summary

## 1.1 Product Overview

Build a cross-platform desktop application for Windows and macOS that provides **real-time translation of text displayed anywhere on the user's screen**, regardless of which application currently owns the screen content.

The application should behave similarly to a browser translation extension, but operate at the **desktop/screen level rather than the browser DOM level**.

The core interaction is:

```text
User moves mouse over text
        ↓
Application detects mouse position
        ↓
Determine text under/near cursor
        ↓
Try Accessibility / UI Automation
        ↓
If unavailable → Screen Capture + OCR
        ↓
Identify word / line / sentence / paragraph
        ↓
Extract source text
        ↓
Detect source language
        ↓
Translate
        ↓
Display floating translation overlay
        ↓
Overlay stays above the underlying application
```

The application must support text rendered by:

* Web browsers
* PDF readers
* Microsoft Office
* VS Code
* IDEs
* Electron applications
* Native desktop applications
* Chat applications
* Image viewers
* Video subtitles
* Games
* Images
* Screenshots
* Remote desktop sessions
* Other applications where text is visually rendered

The fundamental design principle is:

> **Use Accessibility/UI Automation whenever possible because it is faster and more accurate. Use OCR as a universal fallback when text is not programmatically accessible.**

---

# 2. Product Goal

## 2.1 Primary Goal

Allow the user to translate text anywhere on their screen without:

* selecting text manually
* copying text
* switching applications
* opening a browser
* opening a translation website
* taking screenshots manually
* typing the text manually

The desired experience is:

```text
Read something
     ↓
Hover over it
     ↓
Translation appears
```

---

# 3. Product Philosophy

The application should feel like a **translation layer on top of the operating system**.

It should not behave like a traditional translation application.

Traditional:

```text
Copy
 ↓
Open Translator
 ↓
Paste
 ↓
Translate
```

Target:

```text
Read
 ↓
Hover
 ↓
Translate
```

The application should minimize user interaction.

---

# 4. Target User Experience

## 4.1 Basic Example

The user opens a webpage containing:

```text
This is a very interesting sentence.
```

The user moves the cursor over the sentence.

After a short delay:

```text
This is a very interesting sentence.
                ↑
              cursor

┌────────────────────────────────────┐
│ Đây là một câu rất thú vị.         │
└────────────────────────────────────┘
```

The translation appears close to the source text.

---

# 5. Supported Interaction Modes

The application should support multiple modes.

## 5.1 Hover Translation

Primary mode.

```text
Mouse
  ↓
Text detection
  ↓
Translation
  ↓
Floating popup
```

Recommended delay:

```text
150–300 ms
```

The delay must be configurable.

Purpose:

* prevent excessive OCR operations
* prevent excessive API requests
* avoid popup flickering
* avoid translating every accidental mouse movement

---

# 5.2 Hotkey Translation

The user presses a global hotkey.

Example:

```text
Ctrl + Shift + T
```

Windows:

```text
Ctrl + Shift + T
```

macOS:

```text
Cmd + Shift + T
```

After activation:

```text
Mouse position
      ↓
Detect text
      ↓
OCR / Accessibility
      ↓
Translate
```

This should be useful when hover mode is disabled.

---

# 5.3 Area Selection

The user activates selection mode.

Example:

```text
Ctrl + Shift + S
```

The screen becomes selectable.

User drags:

```text
┌───────────────────────────────────────┐
│ This is a sentence that the user     │
│ wants to translate.                  │
└───────────────────────────────────────┘
```

Then:

```text
Selected Region
       ↓
OCR
       ↓
Text extraction
       ↓
Translation
```

This mode is important for:

* images
* screenshots
* games
* subtitles
* inaccessible applications
* scanned PDFs

---

# 5.4 Click-to-Translate

Optional mode.

User clicks a text area:

```text
Click
 ↓
Detect region
 ↓
Translate
```

This should be configurable.

---

# 5.5 Continuous Translation

Optional advanced mode.

Example:

```text
Video
 ↓
Subtitle changes
 ↓
OCR
 ↓
Detect new text
 ↓
Translate
 ↓
Update overlay
```

This mode must be heavily optimized because continuous OCR + translation can be expensive.

---

# 6. Supported Applications

The application should not maintain a hardcoded list of supported applications.

Instead, support should be determined by the detection pipeline.

Examples:

| Application Type | Accessibility | OCR |
| ---------------- | ------------: | --: |
| Chrome           |       Usually | Yes |
| Edge             |       Usually | Yes |
| Firefox          |       Usually | Yes |
| Safari           |       Usually | Yes |
| VS Code          |       Usually | Yes |
| Electron apps    |         Often | Yes |
| Word             |       Usually | Yes |
| Excel            |       Usually | Yes |
| PowerPoint       |       Usually | Yes |
| PDF readers      |       Depends | Yes |
| Discord          |       Depends | Yes |
| Slack            |       Depends | Yes |
| Photoshop        |       Depends | Yes |
| Games            |    Usually no | Yes |
| Video subtitles  |    Usually no | Yes |
| Images           |            No | Yes |
| Screenshots      |            No | Yes |
| Remote Desktop   |    Usually no | Yes |

The system must treat OCR as the universal compatibility layer.

---

# 7. Core Architecture

## 7.1 High-Level Architecture

```text
┌──────────────────────────────────────────────────────┐
│                  Desktop Applications                │
│                                                      │
│ Chrome / Word / PDF / VS Code / Game / Image / etc. │
└──────────────────────────┬───────────────────────────┘
                           │
                           │ Screen
                           ▼
┌──────────────────────────────────────────────────────┐
│              Universal Translation Layer              │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ Mouse Tracking                               │    │
│  └──────────────────────┬───────────────────────┘    │
│                         ▼                            │
│  ┌──────────────────────────────────────────────┐    │
│  │ Accessibility / UI Automation               │    │
│  └──────────────────────┬───────────────────────┘    │
│                         │                            │
│                   Text available?                    │
│                    /          \                       │
│                  YES           NO                    │
│                   │             │                    │
│                   ▼             ▼                    │
│               Direct Text      OCR                   │
│                                 │                    │
│                                 ▼                    │
│                         Text + Bounding Box           │
│                                 │                    │
│                                 ▼                    │
│                         Sentence Detection            │
│                                 │                    │
│                                 ▼                    │
│                         Language Detection             │
│                                 │                    │
│                                 ▼                    │
│                         Translation Engine             │
│                                 │                    │
│                                 ▼                    │
│                         Translation Cache              │
│                                 │                    │
│                                 ▼                    │
│                         Overlay Renderer               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

# 8. Recommended Technology Stack

## 8.1 Desktop Framework

### Electron

Recommended because the existing ecosystem and development experience already use:

* React
* TypeScript
* Electron
* Node.js

Electron provides:

* desktop window management
* always-on-top windows
* transparent windows
* global shortcuts
* IPC
* system tray
* packaging
* cross-platform application lifecycle

---

# 8.2 UI

```text
React
TypeScript
Vite
```

Recommended UI responsibilities:

* settings
* language selection
* translation provider configuration
* hotkey configuration
* history
* cache management
* overlay configuration
* appearance
* debugging
* permissions status

---

# 8.3 Native Layer

The application should NOT attempt to implement every OS-level feature purely in JavaScript.

Use a native abstraction layer.

Recommended architecture:

```text
Electron
    │
    ▼
Native Bridge
    │
 ┌──┴───────────────┐
 │                  │
Windows           macOS
 │                  │
UI Automation     Accessibility API
Screen Capture    Screen Capture
OCR               Vision OCR
```

Potential implementation technologies:

### Option A — Rust

Recommended long-term architecture.

```text
Rust
 ├── Windows APIs
 ├── macOS APIs
 └── N-API / FFI
```

Advantages:

* cross-platform native layer
* memory safety
* good performance
* suitable for native modules
* good integration with Electron through N-API

### Option B — Native language per platform

Windows:

```text
C++ / C#
```

macOS:

```text
Swift
```

This may provide easier access to platform APIs but increases codebase complexity.

### Recommended

For long-term product:

```text
Electron + React + TypeScript
+
Rust native module
```

For MVP:

```text
Electron + React + TypeScript
+
platform-specific native helpers
```

---

# 9. Text Acquisition Architecture

The application must have two primary acquisition mechanisms.

```text
Text Acquisition
       │
       ├── Accessibility
       │
       └── OCR
```

---

# 10. Accessibility / UI Automation

## 10.1 Purpose

Obtain text directly from an application without taking a screenshot.

Advantages:

* very fast
* highly accurate
* no OCR errors
* low CPU usage
* no image processing
* potentially provides exact element coordinates

---

# 10.2 Windows

Use Windows UI Automation / accessibility infrastructure.

Conceptual flow:

```text
Mouse Position
      ↓
Find UI element
      ↓
Inspect element
      ↓
Get text/value/name
      ↓
Get bounding rectangle
      ↓
Return:
{
    text,
    bounds,
    role,
    application
}
```

Potential information:

```text
text
name
value
role
boundingRectangle
controlType
processId
windowHandle
```

---

# 10.3 macOS

Use macOS Accessibility APIs.

Conceptual flow:

```text
Mouse Position
      ↓
AXUIElement
      ↓
Find element under/near cursor
      ↓
Read AX attributes
      ↓
Get text
      ↓
Get bounds
```

Potential information:

```text
AXValue
AXRole
AXDescription
AXPosition
AXSize
AXBounds
```

---

# 10.4 Accessibility Failure Cases

Accessibility may fail because:

* application does not expose text
* game renders text through GPU
* custom canvas
* OpenGL rendering
* DirectX rendering
* video
* image
* remote desktop
* custom UI framework
* accessibility permissions are disabled

Therefore Accessibility must NEVER be the only mechanism.

---

# 11. OCR Architecture

OCR is the universal fallback.

```text
Screen
 ↓
Capture region
 ↓
OCR
 ↓
Words
 ↓
Lines
 ↓
Text blocks
 ↓
Sentence detection
```

---

# 12. macOS OCR

Recommended:

```text
Apple Vision Framework
VNRecognizeTextRequest
```

OCR output should conceptually contain:

```text
[
  {
    text: "This",
    confidence: 0.98,
    bounds: {...}
  },
  {
    text: "is",
    confidence: 0.99,
    bounds: {...}
  }
]
```

The system must preserve bounding boxes.

---

# 13. Windows OCR

Potential implementation:

```text
Windows.Media.Ocr
```

The implementation must account for Windows API packaging/identity requirements and should verify which OCR API is appropriate for the final packaging strategy.

OCR output must provide:

```text
text
words
lines
bounding boxes
confidence if available
```

---

# 14. OCR Abstraction

Do not couple the rest of the application directly to Windows or macOS OCR.

Create an abstraction:

```ts
interface OcrEngine {
  recognize(
    image: ImageBuffer,
    options?: OcrOptions
  ): Promise<OcrResult>;
}
```

Example:

```ts
interface OcrResult {
  blocks: OcrBlock[];
  language?: string;
}

interface OcrBlock {
  text: string;
  bounds: Rect;
  words: OcrWord[];
  lines: OcrLine[];
}

interface OcrWord {
  text: string;
  bounds: Rect;
  confidence?: number;
}
```

Platform implementation:

```text
WindowsOcrEngine
MacOcrEngine
```

---

# 15. Screen Capture

Screen capture should be region-based whenever possible.

Do NOT continuously capture the entire screen unless continuous translation explicitly requires it.

Preferred:

```text
Mouse position
      ↓
Small capture region
      ↓
OCR
```

For example:

```text
┌─────────────────────────────────┐
│                                 │
│        OCR search area          │
│                                 │
│              + mouse            │
│                                 │
└─────────────────────────────────┘
```

Initial region might be:

```text
500 × 300 px
```

but should be adaptive.

---

# 16. Adaptive OCR Region

A fixed rectangle is insufficient.

The system should potentially use multiple strategies:

### Strategy A

Small region around cursor.

### Strategy B

Current line.

### Strategy C

Current text block.

### Strategy D

Expanded region when sentence detection fails.

Example:

```text
Stage 1:
300 × 150

       ↓ no useful text

Stage 2:
600 × 300

       ↓

Stage 3:
1000 × 500
```

This minimizes OCR cost.

---

# 17. Mouse Tracking

The application needs global mouse coordinates.

```text
MouseMoved
   ↓
(x, y)
```

The mouse tracker should provide:

```ts
interface MousePosition {
  x: number;
  y: number;
  screenId: string;
}
```

The system must handle:

* multiple monitors
* negative coordinates
* DPI scaling
* Retina scaling
* display rotation
* different resolutions
* monitor arrangement

---

# 18. Coordinate System

This is a critical subsystem.

There may be several coordinate systems:

```text
OS screen coordinates
        ↓
Electron coordinates
        ↓
window coordinates
        ↓
CSS coordinates
        ↓
device pixels
```

macOS may additionally involve:

```text
logical points
vs
physical pixels
```

Windows may involve:

```text
DPI-aware coordinates
vs
physical pixels
```

The application must establish a single internal coordinate representation.

Recommended:

```text
Global Screen Coordinate
```

Use this internally.

Convert only at system boundaries.

---

# 19. Sentence Detection

OCR usually returns words and lines, not semantic sentences.

Example:

```text
This
is
a
very
interesting
sentence.
```

The application must reconstruct:

```text
This is a very interesting sentence.
```

---

# 20. Sentence Detection Pipeline

```text
OCR words
   ↓
Sort by position
   ↓
Group into lines
   ↓
Group lines into text blocks
   ↓
Detect punctuation
   ↓
Detect sentence boundaries
   ↓
Select sentence containing cursor
```

---

# 21. Cursor-to-Text Matching

This is one of the most important algorithms.

Given:

```text
Mouse:
x = 530
y = 340
```

OCR:

```text
Word A:
bounds = (500, 330, 30, 25)

Word B:
bounds = (535, 330, 20, 25)

Word C:
bounds = (560, 330, 40, 25)
```

Determine which word contains the mouse.

```text
Mouse
 ↓
Hit-test OCR bounding boxes
 ↓
Selected word
 ↓
Selected line
 ↓
Selected sentence
```

---

# 22. Tolerance Zone

Mouse does not necessarily need to be exactly inside a word.

Use a configurable tolerance:

```text
word bounds
+
N pixels
```

This improves UX.

Example:

```text
┌───────────────┐
│   sentence    │
│               │
└───────────────┘
       ↑
   tolerance
```

---

# 23. Sentence Selection Algorithm

Recommended priority:

```text
1. Word containing cursor
2. Line containing word
3. Adjacent lines
4. Sentence boundaries
5. Text block
```

If confidence is low:

```text
Expand OCR region
```

rather than immediately translating bad text.

---

# 24. Language Detection

The system should support:

```text
sourceLanguage = auto
targetLanguage = user configured
```

Possible pipeline:

```text
OCR
 ↓
Language detection
 ↓
Translation
```

If Google Translate API supports automatic source-language detection in the chosen API configuration, use it.

Do not perform unnecessary local language detection if the translation provider can reliably handle it.

---

# 25. Translation Engine

Create a provider abstraction.

```ts
interface TranslationProvider {
  translate(
    text: string,
    options: TranslationOptions
  ): Promise<TranslationResult>;
}
```

Example:

```ts
interface TranslationOptions {
  sourceLanguage?: string;
  targetLanguage: string;
}

interface TranslationResult {
  sourceText: string;
  translatedText: string;
  detectedLanguage?: string;
}
```

Primary provider:

```text
Google Translate API
```

Future providers:

```text
Google
DeepL
OpenAI
Gemini
Claude
Local LLM
LibreTranslate
```

The architecture should not hardcode Google into the entire application.

---

# 26. Translation Cache

A cache is mandatory for good UX.

Key:

```text
hash(
    normalizedSourceText
    +
    sourceLanguage
    +
    targetLanguage
    +
    provider
)
```

Example:

```text
"This is a test."
+
"en"
+
"vi"
```

→ cache key.

---

# 27. Cache Flow

```text
Detected Text
     ↓
Normalize
     ↓
Generate Hash
     ↓
Cache?
 ┌───┴────┐
 │        │
YES       NO
 │        │
 ▼        ▼
Return   API
         ↓
       Cache
         ↓
       Return
```

---

# 28. Text Normalization

OCR may produce:

```text
"This   is   a    sentence."
```

Normalize to:

```text
"This is a sentence."
```

Potential normalization:

* trim whitespace
* collapse repeated spaces
* normalize line breaks
* remove OCR artifacts
* preserve punctuation
* preserve meaningful capitalization

Do not aggressively modify text because punctuation can affect translation.

---

# 29. Debouncing

Mouse movement can generate hundreds of events per second.

Never trigger translation for every event.

Example:

```text
Mouse moved
Mouse moved
Mouse moved
Mouse moved
Mouse moved
        ↓
debounce 200ms
        ↓
Process only final position
```

---

# 30. Processing Cancellation

If the user moves away before OCR finishes:

```text
Request A
   ↓
OCR
```

Then:

```text
Request B
```

Request A should be cancellable or ignored.

Otherwise:

```text
Mouse over sentence A
 ↓
OCR starts

Mouse moves to sentence B
 ↓
OCR starts

A finishes later
 ↓
Incorrect popup appears
```

Solution:

```text
requestId
generationId
AbortController
```

Every request should carry a generation ID.

Only the latest valid request may update the overlay.

---

# 31. Main Processing Flow

```text
Mouse Move
   ↓
Debounce
   ↓
Check if position changed meaningfully
   ↓
Accessibility Query
   ↓
Text found?
 ┌───────┴────────┐
 YES              NO
 │                 │
 ▼                 ▼
Direct Text       Capture Region
 │                 │
 │                 ▼
 │                OCR
 │                 │
 │                 ▼
 │           Detect Text Region
 │                 │
 └────────┬────────┘
          ▼
    Text Validation
          ↓
    Sentence Detection
          ↓
    Normalize Text
          ↓
    Cache Lookup
       /       \
     HIT       MISS
      │          │
      │          ▼
      │      Translation API
      │          │
      │          ▼
      │         Cache
      │          │
      └────┬─────┘
           ▼
      Overlay Update
```

---

# 32. Text Validation

Do not translate arbitrary OCR noise.

Examples that should probably be rejected:

```text
asdfgh
...
_____
123456
```

unless the user explicitly wants number/symbol translation.

Validation heuristics may include:

* minimum character count
* alphabetic character ratio
* OCR confidence
* punctuation
* known language patterns
* repeated symbols
* text stability across multiple frames

---

# 33. Text Stability

For hover mode, require text stability.

Example:

```text
Frame 1:
"This is a very"

Frame 2:
"This is a very"

Frame 3:
"This is a very interesting"
```

Do not immediately translate frame 1.

Wait until OCR stabilizes.

Potential algorithm:

```text
OCR result A
OCR result B
OCR result C

if normalized(A) == normalized(B):
    stable = true
```

This is especially useful for animated content.

---

# 34. Overlay Window

The translation UI should be rendered in a transparent Electron window.

Properties:

```text
transparent
frameless
alwaysOnTop
```

Potential behavior:

```text
click-through
non-focusable
```

The overlay should not steal keyboard or mouse interaction from the underlying application.

---

# 35. Overlay Positioning

The popup should be positioned relative to the source text.

Example:

```text
Source:

This is a sentence.

               ┌──────────────────────┐
               │ Đây là một câu.      │
               └──────────────────────┘
```

Position algorithm:

```text
Preferred:
below source

if insufficient space:
above source

if insufficient:
right

if insufficient:
left
```

---

# 36. Overlay Collision Handling

The overlay must remain inside the visible screen.

Algorithm:

```text
desired position
      ↓
screen bounds
      ↓
collision check
      ↓
adjust position
```

Handle:

* screen edge
* taskbar/dock
* notch
* multiple monitors
* fullscreen applications

---

# 37. Overlay Appearance

Minimum information:

```text
Translated text
```

Optional:

```text
Source language
Target language
Original text
Pronunciation
Copy button
Pin button
Close button
```

Example:

```text
┌─────────────────────────────────────────┐
│ 🇬🇧 → 🇻🇳                              │
│                                         │
│ Đây là một câu rất thú vị.             │
│                                         │
│ [Copy]                         [×]       │
└─────────────────────────────────────────┘
```

---

# 38. Overlay Interaction

Default:

```text
pointer-events: none
```

This means the overlay does not interfere with the application below.

When user intentionally interacts with the popup:

```text
temporary interactive mode
```

Potential trigger:

```text
hotkey
```

or:

```text
hold modifier key
```

---

# 39. System Tray

The application should primarily run as a background utility.

System tray/menu bar:

```text
Universal Translator

✓ Translation Enabled

Target Language
  Vietnamese

Mode
  ● Hover
  ○ Hotkey
  ○ Selection

Settings
History
Pause
Quit
```

---

# 40. Global Hotkeys

Examples:

```text
Windows:
Ctrl + Shift + T

macOS:
Cmd + Shift + T
```

Additional:

```text
Selection:
Ctrl/Cmd + Shift + S

Pause:
Ctrl/Cmd + Shift + P
```

Users should be able to customize these.

---

# 41. Permission Requirements

## macOS

Potentially required:

### Accessibility Permission

Needed for:

```text
Accessibility API
```

### Screen Recording Permission

Needed for:

```text
screen capture
```

The application should provide clear permission onboarding.

Example:

```text
┌────────────────────────────────────────────┐
│ Screen Translation needs permission        │
│                                            │
│ Screen Recording                           │
│ Used only to recognize text on screen.     │
│                                            │
│ [Open System Settings]                     │
└────────────────────────────────────────────┘
```

---

# 42. Windows Permissions

Depending on implementation:

* screen capture permissions
* UI Automation access
* package identity requirements for specific OCR APIs
* application execution restrictions
* antivirus/SmartScreen considerations

The exact requirements must be verified during implementation.

---

# 43. Privacy Model

This is extremely important.

The application potentially sees:

```text
everything displayed on screen
```

Therefore the product must explicitly define privacy behavior.

Preferred architecture:

```text
Screen
 ↓
Local OCR
 ↓
Text
 ↓
Only extracted text sent to translation API
```

Never upload the entire screenshot to Google unless explicitly required.

---

# 44. Privacy Principle

Default:

```text
Screenshot
    ↓
LOCAL PROCESSING
    ↓
OCR text
    ↓
Translation API
```

Not:

```text
Screenshot
    ↓
Cloud
    ↓
OCR
    ↓
Translation
```

This minimizes privacy exposure.

---

# 45. Sensitive Application Handling

The user should be able to exclude applications.

Example:

```text
Never translate in:

☑ Password managers
☑ Banking apps
☑ Private messaging
☐ Browser
☐ VS Code
☐ PDF Reader
```

Application exclusion can be based on:

* process name
* bundle ID
* executable path
* window title

---

# 46. Exclusion Zones

Users may define screen areas where OCR should never occur.

Example:

```text
Password field
      ↓
Ignore
```

Could support:

```text
Excluded applications
Excluded windows
Excluded screen regions
```

---

# 47. API Cost Control

Google Translate API requests can become expensive.

Potential causes:

* mouse movement
* repeated OCR
* scrolling
* animations
* subtitles
* repeated text

Therefore implement:

```text
debounce
+
cache
+
text stability
+
duplicate suppression
+
request cancellation
```

---

# 48. Duplicate Suppression

If current text is:

```text
"This is a sentence."
```

and the user moves within the same sentence:

```text
This [is] [a] [sentence]
```

do NOT translate again.

Use:

```text
currentTextHash
```

Only trigger translation when:

```text
newTextHash !== previousTextHash
```

---

# 49. OCR Optimization

OCR is expensive.

Recommended strategy:

```text
Mouse moved
 ↓
Accessibility first
 ↓
If unavailable:
 ↓
Small OCR region
 ↓
If insufficient:
 ↓
Expand region
```

Avoid:

```text
continuous full-screen OCR
```

unless explicitly enabled.

---

# 50. Performance Targets

Suggested targets:

## Accessibility path

```text
Mouse → text:
< 50 ms target
```

## OCR path

Target:

```text
Mouse → OCR result:
< 200–500 ms
```

depending on hardware.

## Translation

Network latency depends on provider.

Target overall perceived experience:

```text
Hover
 ↓
150–300 ms debounce
 ↓
OCR
 ↓
Translation
 ↓
Popup
```

Target:

```text
< 1 second
```

for normal cases.

This is a target, not a guaranteed SLA.

---

# 51. Performance Modes

Provide:

### Fast

```text
small OCR region
low latency
```

### Balanced

```text
adaptive OCR
normal confidence
```

### Accurate

```text
larger region
higher OCR quality
```

---

# 52. Translation Modes

## Mode 1 — Word

```text
hello
 ↓
xin chào
```

## Mode 2 — Sentence

```text
Hello, how are you?
 ↓
Xin chào, bạn khỏe không?
```

## Mode 3 — Paragraph

```text
Several sentences...
 ↓
Translated paragraph
```

Default:

```text
Sentence
```

because it provides the best balance.

---

# 53. Source Text vs Translation

The popup should optionally show both.

Example:

```text
This is a very interesting sentence.

Đây là một câu rất thú vị.
```

Default UI could show only:

```text
Đây là một câu rất thú vị.
```

Configuration:

```text
Show original text:
ON/OFF
```

---

# 54. Translation History

Optional but useful.

Store:

```text
timestamp
sourceText
translatedText
sourceLanguage
targetLanguage
application
```

Example:

```text
10:31
Chrome
"This is interesting."
"Điều này rất thú vị."
```

Storage can use local SQLite.

---

# 55. Local Database

Recommended:

```text
SQLite
```

Possible implementation:

```text
Node SQLite
```

or:

```text
better-sqlite3
```

depending on the final Electron/Node version and packaging strategy.

Tables:

```text
translations
settings
cache
```

---

# 56. Translation Cache vs History

These should be conceptually separate.

### Cache

Performance optimization.

Can be automatically deleted.

### History

User-visible data.

Should be persistent and user-controlled.

---

# 57. Suggested Data Model

```sql
translations
------------
id
source_text
translated_text
source_language
target_language
provider
application
created_at
```

Cache:

```sql
translation_cache
-----------------
cache_key
source_text
translated_text
source_language
target_language
provider
created_at
last_accessed_at
```

---

# 58. Application State

Central state should include:

```ts
interface AppState {
  enabled: boolean;

  mode:
    | "hover"
    | "hotkey"
    | "selection"
    | "click";

  sourceLanguage: string | "auto";

  targetLanguage: string;

  hoverDelay: number;

  showOriginal: boolean;

  overlayEnabled: boolean;
}
```

---

# 59. Suggested Module Architecture

```text
src/
├── main/
│   ├── app/
│   ├── tray/
│   ├── shortcuts/
│   ├── windows/
│   ├── overlay/
│   ├── permissions/
│   └── ipc/
│
├── renderer/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── stores/
│   └── styles/
│
├── core/
│   ├── translation/
│   ├── cache/
│   ├── text/
│   ├── detection/
│   ├── geometry/
│   └── pipeline/
│
├── native/
│   ├── accessibility/
│   ├── mouse/
│   ├── capture/
│   └── ocr/
│
└── shared/
    ├── types/
    ├── constants/
    └── ipc/
```

---

# 60. Native Abstraction Interfaces

The core application must not know whether it is running Windows or macOS.

Example:

```ts
interface AccessibilityProvider {
  getTextAtPoint(
    point: Point
  ): Promise<AccessibilityText | null>;
}
```

Screen capture:

```ts
interface ScreenCaptureProvider {
  captureRegion(
    region: Rect
  ): Promise<ImageBuffer>;
}
```

OCR:

```ts
interface OcrProvider {
  recognize(
    image: ImageBuffer
  ): Promise<OcrResult>;
}
```

Mouse:

```ts
interface MouseProvider {
  getPosition(): Promise<Point>;
  subscribe(
    callback: (point: Point) => void
  ): Unsubscribe;
}
```

---

# 61. Platform Implementations

```text
AccessibilityProvider
        │
 ┌──────┴─────────┐
 │                │
Windows          macOS
UIAutomation     AXUIElement
```

```text
OcrProvider
        │
 ┌──────┴─────────┐
 │                │
Windows          macOS
Windows OCR      Vision
```

---

# 62. Core Pipeline Interface

The central engine could look conceptually like:

```ts
interface TranslationPipeline {
  processPoint(
    point: Point
  ): Promise<TranslationOverlayResult | null>;
}
```

Internally:

```text
processPoint
    ↓
accessibility
    ↓
ocr fallback
    ↓
text selection
    ↓
normalization
    ↓
cache
    ↓
translation
    ↓
overlay result
```

---

# 63. Overlay Result

```ts
interface TranslationOverlayResult {
  sourceText: string;
  translatedText: string;

  sourceLanguage?: string;
  targetLanguage: string;

  sourceBounds: Rect;
  overlayBounds?: Rect;

  confidence?: number;

  application?: ApplicationInfo;
}
```

---

# 64. Application Detection

Determine:

```text
current foreground application
```

Potential data:

```ts
interface ApplicationInfo {
  name: string;
  processName?: string;
  bundleId?: string;
  executablePath?: string;
  windowTitle?: string;
}
```

Used for:

* exclusion
* history
* debugging
* optimization

---

# 65. Full Hover Flow

```text
USER
 │
 │ moves mouse
 ▼
Mouse Tracker
 │
 │ position(x,y)
 ▼
Debounce
 │
 │ stable
 ▼
Application Detector
 │
 ▼
Accessibility Provider
 │
 ├── text found ──────────────┐
 │                            │
 └── no text                  │
      │                       │
      ▼                       │
 Screen Capture               │
      │                       │
      ▼                       │
 OCR                          │
      │                       │
      ▼                       │
 Text + Bounding Boxes        │
      │                       │
      └──────────┬────────────┘
                 ▼
          Text Selector
                 │
                 ▼
         Sentence Detector
                 │
                 ▼
          Text Normalizer
                 │
                 ▼
           Hash / Cache
              /       \
            HIT       MISS
             │          │
             │          ▼
             │       Google API
             │          │
             │          ▼
             │        Cache
             │          │
             └────┬─────┘
                  ▼
             Overlay
                  │
                  ▼
                USER
```

---

# 66. Selection Flow

```text
Hotkey
 ↓
Enter Selection Mode
 ↓
Transparent Fullscreen Window
 ↓
User Drag
 ↓
Selection Rectangle
 ↓
Capture Rectangle
 ↓
OCR
 ↓
Text Block Detection
 ↓
Translation
 ↓
Overlay
```

---

# 67. Continuous Subtitle Flow

```text
Timer / Screen Change
       ↓
Capture subtitle region
       ↓
OCR
       ↓
Normalize
       ↓
Compare with previous OCR
       ↓
Changed?
 ┌─────┴─────┐
 NO          YES
 │            │
 ▼            ▼
Ignore      Translate
             ↓
           Overlay
```

---

# 68. Screen Change Detection

For continuous mode, OCR should not execute continuously at maximum frequency.

Use:

```text
screen difference detection
```

Pipeline:

```text
Capture low-cost frame
 ↓
Compare with previous frame
 ↓
Significant change?
 ↓
YES
 ↓
OCR
```

This can dramatically reduce CPU usage.

---

# 69. Multi-Monitor Support

Must support:

```text
Monitor 1
Monitor 2
Monitor 3
```

with:

* different resolutions
* different scaling
* different DPI
* Retina + non-Retina simultaneously
* different orientations
* monitors arranged left/right/above/below

Example:

```text
       Monitor 2
      ┌───────────┐
      │           │
      └───────────┘

┌──────────────────────┐
│      Monitor 1       │
└──────────────────────┘
```

Global coordinates may be negative.

---

# 70. DPI / Retina

This must be treated as a first-class architecture problem.

Example:

```text
Logical:
100 × 100

Physical:
200 × 200
```

Do not assume:

```text
1 logical pixel = 1 physical pixel
```

Every capture and overlay coordinate conversion must account for scaling.

---

# 71. Fullscreen Applications

Some applications/games use:

```text
exclusive fullscreen
```

or special rendering paths.

The overlay may not work reliably in exclusive fullscreen.

Supported behavior should distinguish:

```text
Windowed
Borderless fullscreen
Exclusive fullscreen
```

Likely:

```text
Windowed          → supported
Borderless        → usually supported
Exclusive fullscreen → potentially unsupported
```

The application should fail gracefully.

---

# 72. Games

Games are a special case.

Potential problems:

* DirectX
* Vulkan
* OpenGL
* anti-cheat
* protected surfaces
* exclusive fullscreen
* hardware overlay
* inaccessible text

OCR may work in some cases, but not universally.

The application must not attempt to bypass anti-cheat or protected rendering mechanisms.

---

# 73. DRM / Protected Content

Some applications may expose:

```text
black screenshot
```

or protected surfaces.

Examples:

* DRM video
* secure content
* protected windows

The application must handle:

```text
capture failed
```

gracefully.

---

# 74. Video Subtitles

Subtitles are a major use case.

Example:

```text
Video
──────────────────────

        Hello there.

──────────────────────
```

OCR region:

```text
bottom 20–30% of screen
```

The user should optionally configure a fixed OCR region.

This is much more efficient than searching the entire screen.

---

# 75. PDF

PDF support should include:

### Text PDF

Prefer Accessibility/direct text if possible.

### Scanned PDF

OCR fallback.

### Browser PDF viewer

Accessibility + OCR fallback.

---

# 76. Images

Images have no Accessibility text.

Therefore:

```text
Image
 ↓
OCR
 ↓
Text
 ↓
Translate
```

Selection mode is especially useful.

---

# 77. Vertical Text

OCR and sentence detection must consider:

* horizontal text
* vertical text
* rotated text

This is especially relevant for some Asian languages.

The OCR abstraction should preserve orientation metadata if available.

---

# 78. Non-Latin Languages

Must support Unicode correctly.

Potential languages:

* Vietnamese
* English
* Chinese
* Japanese
* Korean
* Thai
* Arabic
* Russian
* French
* German
* Spanish
* etc.

The system must not assume:

```text
word separator = space
```

because this fails for languages such as Chinese and Japanese.

---

# 79. Text Segmentation

Language-aware segmentation may be required.

Examples:

```text
English:
Hello world.

Chinese:
你好世界。

Japanese:
こんにちは世界。
```

The sentence detector must handle language-specific punctuation.

---

# 80. OCR Confidence

OCR result should preserve confidence where available.

Example:

```text
confidence = 0.97
```

Potential policy:

```text
confidence > 0.85
    → translate

0.60–0.85
    → verify / expand region

< 0.60
    → retry / ignore
```

Thresholds should be configurable experimentally.

---

# 81. Retry Strategy

If OCR fails:

```text
Attempt 1
small region

Attempt 2
larger region

Attempt 3
different OCR configuration
```

Do not retry indefinitely.

Maximum:

```text
2–3 attempts
```

---

# 82. Error Handling

Possible errors:

```text
Accessibility unavailable
OCR unavailable
Screen capture unavailable
Permission denied
Translation API failure
Network unavailable
Rate limit
Quota exceeded
Invalid API key
Unsupported language
Overlay creation failure
Coordinate mismatch
```

Each must have a defined fallback.

---

# 83. Offline Behavior

The translation provider currently uses Google Translate API, which requires network access.

When offline:

```text
OCR still works
Accessibility still works
Translation unavailable
```

UI should show:

```text
Translation unavailable — offline
```

The application must not crash.

---

# 84. Future Offline Translation

The architecture should permit:

```text
Google API
       OR
Local Translation Model
```

Possible future providers:

```text
NLLB
Marian
OPUS-MT
Gemma
Qwen
other local translation models
```

Do not implement this in MVP unless necessary.

---

# 85. API Key Security

If Google Translate API is used directly from the desktop client, the API credential may be extractable.

Therefore the product must evaluate:

### Option A

Desktop → Google API directly.

Pros:

* simple
* low latency
* no backend

Cons:

* API credential exposure
* users can extract the key
* difficult to enforce quotas

### Option B

Desktop:

```text
Desktop
 ↓
Own backend
 ↓
Google API
```

Pros:

* API key remains server-side
* centralized quota control
* billing management
* abuse protection

Cons:

* backend cost
* additional latency
* requires infrastructure

For a commercial product, backend mediation is preferable.

---

# 86. Translation Backend

Optional architecture:

```text
Electron
   ↓
Translation Service
   ↓
Google Translate
```

API:

```http
POST /translate
```

Request:

```json
{
  "text": "Hello world",
  "sourceLanguage": "en",
  "targetLanguage": "vi"
}
```

Response:

```json
{
  "translatedText": "Xin chào thế giới",
  "sourceLanguage": "en",
  "targetLanguage": "vi"
}
```

---

# 87. Translation Provider Abstraction

The backend should also use:

```ts
interface TranslationProvider {
  translate(...): Promise<TranslationResult>;
}
```

Implementation:

```text
GoogleTranslateProvider
```

Future:

```text
DeepLProvider
OpenAIProvider
GeminiProvider
LocalProvider
```

---

# 88. Security

Electron security must be taken seriously.

Recommended:

```text
contextIsolation: true
nodeIntegration: false
sandbox where practical
```

Renderer should not receive arbitrary Node.js access.

Use a controlled preload bridge.

---

# 89. IPC

Example:

```text
Renderer
   ↓
Preload API
   ↓
IPC
   ↓
Main Process
```

Expose only required methods:

```ts
window.translator.translate()
window.translator.getSettings()
window.translator.setSettings()
window.translator.startSelection()
```

Do not expose:

```ts
require()
process
fs
child_process
```

directly to renderer.

---

# 90. Logging

Use structured logging.

Levels:

```text
DEBUG
INFO
WARN
ERROR
```

Important events:

```text
mouse detection
accessibility success/failure
OCR duration
OCR confidence
translation latency
cache hit/miss
overlay position
permission status
```

Example:

```text
[OCR]
duration=124ms
words=17
confidence=0.94
```

---

# 91. Debug Mode

Provide a developer/debug mode.

When enabled:

```text
┌──────────────────────────────┐
│ OCR bounding boxes            │
│                              │
│ ┌───────────────┐            │
│ │ Hello world   │            │
│ └───────────────┘            │
│        ↑ mouse               │
└──────────────────────────────┘
```

Show:

```text
mouse coordinate
OCR region
OCR words
selected sentence
confidence
processing time
source application
```

This will be extremely useful during development.

---

# 92. Diagnostics

Settings → Diagnostics:

```text
Platform:
macOS 15.x

Accessibility:
✓

Screen Capture:
✓

OCR:
✓

Translation:
✓

Mouse Tracking:
✓

Overlay:
✓
```

This is important for support.

---

# 93. Configuration

Settings should include:

## Translation

```text
Target language
Source language
Translation provider
```

## Hover

```text
Enabled
Delay
Sensitivity
```

## OCR

```text
Accuracy
Region size
Language
```

## Overlay

```text
Position
Font size
Maximum width
Opacity
Theme
```

## Privacy

```text
Excluded applications
Store history
Send text to cloud
```

---

# 94. User Onboarding

First launch:

```text
Welcome
 ↓
Choose target language
 ↓
Grant permissions
 ↓
Test screen capture
 ↓
Test OCR
 ↓
Test translation
 ↓
Complete
```

macOS:

```text
Accessibility permission
Screen Recording permission
```

Windows:

```text
Required permissions / package setup
```

---

# 95. First-Run Test

Provide a built-in test:

```text
Move mouse over this sentence.
```

Then:

```text
Detected:
"This is a test."

Translation:
"Đây là một bài kiểm tra."
```

If successful:

```text
✓ Everything is working
```

---

# 96. State Machine

The application should use an explicit state machine.

```text
DISABLED
   │
   ▼
READY
   │
   ▼
DETECTING
   │
   ├── ACCESSIBILITY_SUCCESS
   │
   └── ACCESSIBILITY_FAILED
             │
             ▼
            OCR
             │
             ▼
        TEXT_DETECTED
             │
             ▼
       TRANSLATING
             │
             ▼
        SHOW_OVERLAY
             │
             ▼
           READY
```

Error:

```text
ANY STATE
   ↓
ERROR
   ↓
RECOVER
```

---

# 97. Important Race Conditions

Example:

```text
Request A:
sentence A

Request B:
sentence B
```

If:

```text
B starts after A
but
A finishes after B
```

A must NOT overwrite B.

Use:

```text
generationId
```

Example:

```ts
const generation = ++currentGeneration;

const result = await process();

if (generation !== currentGeneration) {
  return;
}
```

---

# 98. Memory Management

Avoid storing screenshots indefinitely.

Rules:

```text
Capture
 ↓
OCR
 ↓
Release image
```

Do not keep full-screen images in memory.

History should store text, not screenshots, unless the user explicitly enables screenshot history.

---

# 99. CPU Management

Hover mode should be event-driven.

Avoid:

```text
OCR 30 times/sec
```

Prefer:

```text
Mouse moved
 ↓
meaningful movement?
 ↓
debounce
 ↓
OCR only when needed
```

---

# 100. Network Management

Translation requests should use:

```text
timeout
retry
exponential backoff
rate limiting
```

Example:

```text
Request
 ↓
5 sec timeout
 ↓
retry
 ↓
failure
```

Do not retry indefinitely.

---

# 101. API Rate Limiting

Local:

```text
minimum interval between translations
```

Backend:

```text
per-device / per-user rate limit
```

Cache is the first defense.

---

# 102. Accessibility First Principle

This is a fundamental requirement:

> Never use OCR when direct text extraction is available and reliable.

Example:

```text
Chrome text
 ↓
Accessibility
 ↓
text available
 ↓
NO OCR
```

This reduces:

* CPU
* latency
* OCR errors
* screen capture operations
* privacy risk

---

# 103. OCR Fallback Principle

Second fundamental requirement:

> OCR must be capable of translating content even when the application provides no accessible text.

Example:

```text
Game
 ↓
Accessibility unavailable
 ↓
OCR
 ↓
Translation
```

---

# 104. Hybrid Strategy

Final strategy:

```text
                 Mouse
                   │
                   ▼
          Application Detection
                   │
                   ▼
             Accessibility
              /           \
          success          fail
             │              │
             ▼              ▼
        Direct Text         OCR
             │              │
             └──────┬───────┘
                    ▼
              Text Selection
                    ▼
             Sentence Detection
                    ▼
               Translation
                    ▼
                 Overlay
```

---

# 105. MVP Scope

MVP should NOT attempt every advanced feature.

Recommended MVP:

### Platform

```text
macOS
Windows
```

### Input

```text
Global mouse tracking
```

### Text detection

```text
Accessibility
+
OCR fallback
```

### Translation

```text
Google Translate API
```

### UI

```text
Floating overlay
```

### Interaction

```text
Hover
Hotkey
Selection
```

### Infrastructure

```text
Cache
Debounce
Cancellation
Logging
```

### Settings

```text
source language
target language
hover delay
overlay appearance
enable/disable
```

---

# 106. Phase 2

Add:

```text
translation history
application exclusion
custom hotkeys
advanced OCR configuration
multiple providers
better sentence detection
debug overlay
continuous subtitle mode
```

---

# 107. Phase 3

Potential:

```text
offline translation
local translation models
pronunciation
TTS
dictionary
context-aware translation
terminology glossary
AI translation
translation memory
```

---

# 108. Future AI Translation

Instead of only:

```text
Google Translate
```

allow:

```text
Translation Router
       │
       ├── Google
       ├── DeepL
       ├── Gemini
       ├── OpenAI
       ├── Local LLM
       └── Custom provider
```

User could choose:

```text
Fast
Accurate
Offline
AI
```

---

# 109. Context-Aware Translation

Future advanced mode.

Instead of translating:

```text
"Run"
```

as an isolated word, capture context:

```text
Run the application.
```

or:

```text
The program is currently running.
```

Then translate based on sentence context.

This is another reason sentence-level extraction is preferable to word-only translation.

---

# 110. Dictionary Mode

Potential future feature:

```text
Hover:
run
```

Popup:

```text
run

v. chạy
n. sự chạy

Pronunciation:
/rʌn/

Examples:
...
```

This changes the product from a translator into a reading assistant.

---

# 111. TTS Future Feature

Translation popup could provide:

```text
🔊 Listen
```

Pipeline:

```text
Translated text
 ↓
TTS
 ↓
Audio
```

Could support:

* local TTS
* cloud TTS
* speed
* voice

This should remain outside MVP.

---

# 112. Potential Product Name / Positioning

Conceptually:

```text
Universal Screen Translator
```

Positioning:

> Translate anything you can see.

Core promise:

```text
No copy.
No paste.
No app switching.
Just hover.
```

---

# 113. Main Technical Risks

## Risk 1 — OCR latency

Solution:

```text
Accessibility first
+
small region OCR
+
cache
+
debounce
```

---

## Risk 2 — OCR accuracy

Solution:

```text
adaptive region
confidence scoring
language selection
retry
text stability
```

---

## Risk 3 — Coordinate mismatch

Solution:

```text
single global coordinate system
+
explicit DPI conversion
```

---

## Risk 4 — macOS permissions

Solution:

```text
first-run permission onboarding
diagnostics page
```

---

## Risk 5 — Windows OCR API constraints

Solution:

```text
abstract OCR provider
evaluate API/package requirements during implementation
provide alternative native OCR engine if necessary
```

---

## Risk 6 — API cost

Solution:

```text
cache
deduplication
rate limit
debounce
```

---

## Risk 7 — API key exposure

Solution:

```text
backend proxy
```

for production.

---

## Risk 8 — Overlay interference

Solution:

```text
transparent
click-through
non-focusable
```

---

## Risk 9 — Games / protected content

Solution:

```text
graceful failure
```

Do not attempt to bypass security mechanisms.

---

# 114. Detailed Failure Matrix

| Situation              | Primary Strategy   | Fallback                   |
| ---------------------- | ------------------ | -------------------------- |
| Browser text           | Accessibility      | OCR                        |
| Native text field      | Accessibility      | OCR                        |
| PDF text               | Accessibility      | OCR                        |
| Scanned PDF            | OCR                | Selection OCR              |
| Image                  | OCR                | Selection OCR              |
| Game                   | OCR                | Selection OCR              |
| Video subtitle         | OCR                | Fixed region OCR           |
| Accessibility denied   | OCR                | Selection                  |
| Screen capture denied  | Accessibility      | Error                      |
| Internet unavailable   | Cache              | Offline message            |
| Translation API failed | Cache              | Error                      |
| OCR confidence low     | Expand region      | Ignore                     |
| Popup offscreen        | Reposition         | Alternate position         |
| Multiple monitor       | Global coordinates | Recalculate                |
| Fullscreen exclusive   | Best effort        | Notify unsupported         |
| Protected window       | Capture failure    | Accessibility if available |

---

# 115. Testing Strategy

Testing must be divided into several layers.

## Unit Tests

Test:

```text
sentence detection
text normalization
cache
hashing
coordinate conversion
popup positioning
debounce
request cancellation
```

---

# 116. Integration Tests

Test:

```text
mouse
 ↓
accessibility
 ↓
OCR
 ↓
translation
 ↓
overlay
```

---

# 117. Platform Tests

Windows:

```text
Windows 10
Windows 11
```

macOS:

```text
Intel
Apple Silicon
```

Test:

```text
Retina
non-Retina
multi-monitor
different DPI
```

---

# 118. Application Compatibility Tests

At minimum:

```text
Chrome
Edge
Safari
Firefox
VS Code
Word
PowerPoint
Excel
PDF reader
Discord
Slack
image viewer
video player
```

And several games if relevant.

---

# 119. OCR Test Dataset

Create a local test dataset containing:

```text
English
Vietnamese
Chinese
Japanese
Korean
German
French
Spanish
Arabic
```

Include:

* small font
* large font
* bold
* italic
* dark mode
* light mode
* low contrast
* anti-aliased text
* rotated text
* subtitle text
* image text

---

# 120. Performance Benchmarks

Measure:

```text
mouse → detection
detection → OCR
OCR duration
OCR → translation
translation latency
total latency
CPU
RAM
network requests
cache hit ratio
```

Example benchmark:

```text
Accessibility:
35 ms

OCR:
140 ms

Translation:
210 ms

Total:
385 ms
```

---

# 121. Acceptance Criteria

MVP is considered successful when:

### AC1

User can hover over text in Chrome and receive translation.

### AC2

User can hover over text in VS Code and receive translation.

### AC3

User can translate text in a PDF.

### AC4

User can translate text contained in an image using OCR.

### AC5

User can translate inaccessible text using OCR.

### AC6

Overlay does not block interaction with the underlying application.

### AC7

Repeated hover over the same sentence does not generate repeated API requests.

### AC8

Moving to another sentence cancels/invalidates the previous request.

### AC9

Multi-monitor coordinates work correctly.

### AC10

macOS permissions are handled gracefully.

### AC11

Windows screen capture/OCR works under supported packaging configuration.

### AC12

Application continues running even if translation API fails.

### AC13

No screenshot is sent to the translation API; only extracted text is transmitted.

### AC14

User can disable translation globally.

### AC15

User can select target language.

---

# 122. Recommended Development Order

## Phase 0 — Technical Spike

Before building the UI, validate:

```text
1. Global mouse tracking
2. Screen capture
3. macOS Accessibility
4. Windows UI Automation
5. macOS Vision OCR
6. Windows OCR
7. Electron transparent overlay
8. Multi-monitor coordinates
```

This phase is critical.

Do not start with settings/history/UI.

---

# 123. Phase 1 — macOS Prototype

Build:

```text
Electron
+
React
+
TypeScript
+
macOS native helper
```

Implement:

```text
mouse
 ↓
Accessibility
 ↓
OCR fallback
 ↓
Google Translate
 ↓
overlay
```

---

# 124. Phase 2 — Windows

Implement the same abstraction:

```text
AccessibilityProvider
OcrProvider
ScreenCaptureProvider
MouseProvider
```

Windows implementations must conform to the same interfaces.

---

# 125. Phase 3 — Core Optimization

Implement:

```text
cache
debounce
cancellation
text stability
adaptive OCR
coordinate normalization
```

---

# 126. Phase 4 — UX

Add:

```text
settings
tray
hotkeys
selection
history
permissions onboarding
```

---

# 127. Phase 5 — Packaging

Build:

```text
macOS:
.dmg
.pkg if needed

Windows:
.exe installer
```

Support:

```text
Apple Silicon
Intel Mac
x64 Windows
ARM64 Windows if required
```

---

# 128. Packaging Architecture

Models/native binaries must be platform-specific.

Example:

```text
resources/
├── native/
│   ├── darwin-arm64/
│   ├── darwin-x64/
│   ├── win32-x64/
│   └── win32-arm64/
```

If external OCR models are used, they should also be packaged/downloaded according to platform.

---

# 129. Auto Update

Production application should support:

```text
update check
 ↓
download
 ↓
install
```

But native modules must be compatible with every released Electron version.

Electron version upgrades should therefore be controlled carefully.

---

# 130. Electron Version Compatibility

Important dependencies:

```text
Electron
Node ABI
native module ABI
Rust N-API
platform APIs
```

If native modules use N-API rather than Electron-specific ABI where possible, upgrades become easier.

---

# 131. Recommended Repository Structure

```text
universal-translator/
│
├── apps/
│   ├── desktop/
│   │   ├── electron/
│   │   ├── renderer/
│   │   └── preload/
│
├── packages/
│   ├── core/
│   ├── translation/
│   ├── text-processing/
│   ├── geometry/
│   ├── shared-types/
│   └── ui/
│
├── native/
│   ├── rust/
│   │   ├── accessibility/
│   │   ├── mouse/
│   │   ├── capture/
│   │   └── platform/
│
├── scripts/
├── tests/
└── docs/
```

---

# 132. Recommended Monorepo

Given the existing TypeScript/pnpm ecosystem:

```text
pnpm workspace
```

is appropriate.

Example:

```text
pnpm
├── apps/desktop
├── packages/core
├── packages/translation
├── packages/ui
└── native/
```

---

# 133. Core Package Boundaries

## `@translator/core`

Contains:

```text
pipeline
state machine
interfaces
```

## `@translator/text`

Contains:

```text
normalization
sentence detection
text grouping
language utilities
```

## `@translator/translation`

Contains:

```text
provider abstraction
Google provider
cache
```

## `@translator/geometry`

Contains:

```text
rect
point
intersection
hit testing
coordinate conversion
popup positioning
```

---

# 134. Native Package

Example:

```text
@translator/native
```

API:

```ts
native.mouse.getPosition()

native.accessibility.getTextAtPoint()

native.capture.captureRegion()

native.ocr.recognize()
```

---

# 135. AI Coding Agent Requirements

The AI agent must NOT immediately start writing the entire application.

First it must:

1. Analyze requirements.
2. Identify architectural risks.
3. Identify platform-specific limitations.
4. Verify available Windows/macOS APIs.
5. Propose repository structure.
6. Propose native bridge architecture.
7. Identify APIs that require permissions.
8. Identify packaging constraints.
9. Propose MVP boundaries.
10. Produce an implementation plan.

Only after architecture approval should implementation begin.

---

# 136. AI Agent Investigation Requirements

The AI agent should specifically investigate:

### macOS

```text
AXUIElement
Accessibility permissions
CGEvent / mouse position
Screen capture APIs
ScreenCaptureKit
Vision OCR
Retina coordinate conversion
multi-monitor coordinate systems
fullscreen behavior
```

### Windows

```text
UI Automation
Windows Accessibility
global mouse position
Windows Graphics Capture
Windows.Media.Ocr
DPI awareness
per-monitor DPI
multi-monitor coordinates
MSIX/package identity implications
fullscreen behavior
```

### Electron

```text
transparent window
alwaysOnTop
focusable false
click-through
global shortcuts
multi-monitor
screen APIs
native module loading
packaging
auto-update
```

---

# 137. AI Agent Must Not Assume

The AI must NOT assume:

```text
Accessibility always works.
OCR always works.
Screen capture always works.
Coordinates are identical across APIs.
Windows OCR can be used without packaging considerations.
Electron overlay behaves identically on macOS and Windows.
Exclusive fullscreen supports overlays.
All applications expose accessible text.
```

Every assumption must be validated.

---

# 138. Architectural Decision Principle

When there is a choice:

```text
Native OS capability
    >
Electron capability
    >
third-party library
```

when the native OS capability provides a more reliable solution.

For example:

```text
macOS Vision OCR
```

should generally be preferred over adding a large third-party OCR runtime if it satisfies requirements.

---

# 139. Third-Party OCR Alternative

The architecture should permit another OCR engine.

Possible abstraction:

```text
OcrProvider
```

Implementations:

```text
MacVisionOcr
WindowsOcr

Future:
TesseractOcr
PaddleOcr
ONNXOcr
CloudOcr
```

This is important if native OCR quality is insufficient.

---

# 140. OCR Engine Evaluation Criteria

Evaluate:

```text
accuracy
latency
CPU
RAM
language support
model size
offline capability
bounding boxes
confidence
packaging complexity
license
```

---

# 141. Translation Provider Evaluation

Evaluate:

```text
quality
latency
cost
language coverage
automatic language detection
API stability
rate limits
privacy
offline availability
```

---

# 142. Security Threat Model

Potential risks:

### API credential extraction

Mitigation:

```text
backend proxy
```

### Malicious webpage text

OCR itself should treat text as data.

Do not execute OCR output.

### Electron injection

Use:

```text
contextIsolation
CSP
validated IPC
```

### Local history exposure

Provide:

```text
clear history
disable history
```

---

# 143. Privacy Threat Model

The application can potentially observe sensitive content.

Therefore:

```text
Local OCR by default
Minimal data transmission
No screenshot upload by default
Application exclusion
History control
Clear privacy disclosure
```

---

# 144. Telemetry

Telemetry should be opt-in where appropriate.

Never collect raw screen content by default.

Safe metrics:

```text
OCR latency
translation latency
cache hit rate
crash reports
platform version
application version
```

Do not collect:

```text
screenshots
raw OCR text
translation history
```

unless explicitly enabled.

---

# 145. UX Principle: Don't Surprise the User

The application should not suddenly display translations while the user is:

```text
typing
clicking
dragging
playing a game
using a password field
```

Therefore the hover engine should consider:

```text
mouse velocity
mouse button state
keyboard modifier state
text stability
application exclusion
```

Potential rule:

```text
if mouse button pressed:
    do not translate
```

---

# 146. Mouse Velocity

Fast cursor movement should not trigger OCR.

Concept:

```text
slow/stationary cursor
        ↓
translation candidate
```

rather than:

```text
cursor moving at high speed
        ↓
OCR
```

This can greatly reduce processing.

---

# 147. Hover Candidate

Potential conditions:

```text
cursor velocity < threshold
AND
cursor has remained near same location
AND
application is not excluded
AND
translation enabled
```

Then:

```text
start detection
```

---

# 148. Popup Lifecycle

```text
HIDDEN
  ↓
DETECTING
  ↓
LOADING
  ↓
VISIBLE
  ↓
UPDATING
  ↓
HIDDEN
```

When mouse moves to another text:

```text
VISIBLE A
 ↓
DETECT B
 ↓
translation B
 ↓
VISIBLE B
```

Avoid flicker.

---

# 149. Popup Loading State

Instead of waiting silently:

```text
┌────────────────────┐
│ Translating...     │
└────────────────────┘
```

However, loading UI should be delayed slightly so very fast translations do not cause visual flicker.

---

# 150. Translation Failure UI

Example:

```text
┌──────────────────────────────┐
│ Translation unavailable      │
│ Check your network/API key.  │
└──────────────────────────────┘
```

Do not show technical stack traces to normal users.

---

# 151. Debug Information

Developer mode may show:

```text
Source:
Accessibility

OCR:
not used

Latency:
43 ms

Cache:
HIT

Application:
Chrome
```

Or:

```text
Source:
OCR

OCR:
182 ms

Confidence:
0.94

Translation:
214 ms
```

---

# 152. Important Design Decision: Direct Text vs OCR

The final architecture should explicitly maintain the distinction:

```text
Direct text acquisition
```

and:

```text
Visual text acquisition
```

Do not merge them into a single implementation.

Reason:

```text
Accessibility
= semantic information

OCR
= visual information
```

Both have different strengths.

---

# 153. Important Design Decision: Overlay vs Injected UI

Do NOT inject UI into other applications.

Use a dedicated top-level overlay window.

Reason:

```text
Application A
Application B
Application C
```

cannot reliably host your UI.

Instead:

```text
Desktop
 ├── App A
 ├── App B
 ├── App C
 └── Translator Overlay
```

---

# 154. Important Design Decision: No Browser Dependency

The application must work when:

```text
Chrome is closed
```

It must be a genuine desktop utility.

---

# 155. Important Design Decision: Translation Engine Independence

Core pipeline should not know:

```text
Google
```

It should know:

```text
TranslationProvider
```

This allows future migration.

---

# 156. Important Design Decision: OCR Engine Independence

Core pipeline should not know:

```text
Vision
Windows OCR
```

It should know:

```text
OcrProvider
```

---

# 157. Important Design Decision: Platform Independence

Core logic should be platform-independent.

Platform-specific code should be isolated.

```text
Core
 │
 ├── Windows Adapter
 │
 └── macOS Adapter
```

Avoid:

```text
if (process.platform === "darwin")
```

scattered throughout the codebase.

Prefer:

```ts
platformServices.accessibility
platformServices.ocr
platformServices.capture
```

---

# 158. Proposed Final Architecture

```text
                         ┌─────────────────────┐
                         │      React UI       │
                         └──────────┬──────────┘
                                    │
                              Electron IPC
                                    │
                         ┌──────────▼──────────┐
                         │   Electron Main     │
                         │                     │
                         │ App Lifecycle       │
                         │ Tray                │
                         │ Shortcuts           │
                         │ Overlay              │
                         └──────────┬──────────┘
                                    │
                           Native Service Layer
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
          Mouse Service      Accessibility Service   Capture Service
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                              OCR Service
                                    │
                                    ▼
                           Text Processing
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
              Sentence Detection              Normalization
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
                              Cache Manager
                               /          \
                             HIT          MISS
                              │             │
                              │             ▼
                              │       Translation
                              │          Provider
                              │             │
                              │             ▼
                              │           Cache
                              │             │
                              └──────┬──────┘
                                     ▼
                              Overlay Manager
                                     │
                                     ▼
                               Translation UI
```

---

# 159. Recommended Tech Stack Summary

| Layer                 | Technology                                           |
| --------------------- | ---------------------------------------------------- |
| Desktop               | Electron                                             |
| UI                    | React                                                |
| Language              | TypeScript                                           |
| Build                 | Vite                                                 |
| Workspace             | pnpm                                                 |
| Native layer          | Rust / N-API                                         |
| macOS accessibility   | AXUIElement                                          |
| Windows accessibility | UI Automation                                        |
| macOS OCR             | Vision                                               |
| Windows OCR           | Windows OCR APIs / validated implementation          |
| Screen capture        | Native OS APIs / Electron where appropriate          |
| Translation           | Google Translate API                                 |
| Cache                 | SQLite / in-memory + SQLite                          |
| IPC                   | Electron IPC + preload                               |
| Overlay               | Electron transparent window                          |
| Packaging             | electron-builder or equivalent                       |
| Auto update           | Electron-compatible updater                          |
| Logging               | Structured logger                                    |
| Testing               | Vitest + Playwright/E2E + platform integration tests |

---

# 160. Recommended MVP Technology

Do not over-engineer the first prototype.

Use:

```text
Electron
React
TypeScript
Vite
pnpm
Google Translate API
SQLite
Native platform bridge
```

Then add Rust/native optimization after validating the pipeline.

---

# 161. MVP Architecture

```text
Electron
 │
 ├── React Settings
 │
 ├── Main Process
 │    │
 │    ├── Mouse
 │    ├── Overlay
 │    ├── IPC
 │    └── Pipeline
 │
 └── Native Bridge
      │
      ├── Accessibility
      ├── Screen Capture
      └── OCR
```

---

# 162. Implementation Milestones

## Milestone 1

```text
Electron application
```

Success:

```text
app starts
tray works
settings window works
```

## Milestone 2

```text
global mouse tracking
```

Success:

```text
mouse coordinate available globally
```

## Milestone 3

```text
transparent overlay
```

Success:

```text
overlay follows target coordinates
```

## Milestone 4

```text
macOS Accessibility
```

Success:

```text
Chrome text can be extracted without OCR
```

## Milestone 5

```text
macOS OCR
```

Success:

```text
image text can be extracted
```

## Milestone 6

```text
Google translation
```

Success:

```text
text → translated text
```

## Milestone 7

```text
complete macOS pipeline
```

## Milestone 8

```text
Windows implementation
```

## Milestone 9

```text
cache/debounce/cancellation
```

## Milestone 10

```text
production packaging
```

---

# 163. Architecture Validation Checklist

Before production implementation, verify:

```text
[ ] Global mouse tracking works
[ ] Accessibility works on macOS
[ ] Accessibility works on Windows
[ ] OCR works on macOS
[ ] OCR works on Windows
[ ] Screen capture works
[ ] Overlay works
[ ] Overlay is click-through
[ ] Multi-monitor works
[ ] Retina works
[ ] Windows DPI works
[ ] Fullscreen behavior understood
[ ] Permission onboarding works
[ ] Google API integration works
[ ] Cache works
[ ] Request cancellation works
[ ] Text stability works
[ ] Sentence detection works
[ ] Application exclusion works
[ ] Packaging works
[ ] Auto-update works
```

---

# 164. What the AI Agent Should Produce Before Coding

The AI should first provide:

## A. Architecture proposal

```text
system architecture
module architecture
native architecture
```

## B. Technology validation

For each technology:

```text
why
advantages
limitations
alternative
```

## C. Platform analysis

Separate:

```text
macOS
Windows
```

## D. API analysis

Explain:

```text
Accessibility
OCR
screen capture
mouse
overlay
permissions
```

## E. Risk analysis

List:

```text
technical risks
UX risks
security risks
performance risks
packaging risks
```

## F. Implementation plan

Break into:

```text
Phase
Task
Dependencies
Acceptance criteria
```

---

# 165. AI Agent Coding Rules

The coding agent should follow these principles:

### Rule 1

Do not implement platform-specific code inside business logic.

### Rule 2

Use interfaces for native services.

### Rule 3

Accessibility must be attempted before OCR.

### Rule 4

OCR must remain a fallback.

### Rule 5

Never perform unnecessary full-screen OCR.

### Rule 6

Never send screenshots to the translation provider by default.

### Rule 7

Use cache before network requests.

### Rule 8

Cancel or invalidate stale translation requests.

### Rule 9

All coordinates must be explicitly normalized.

### Rule 10

Do not assume single-monitor environments.

### Rule 11

Do not assume 1 CSS pixel equals 1 physical pixel.

### Rule 12

Do not assume all applications expose text.

### Rule 13

Do not assume fullscreen applications support overlays.

### Rule 14

Do not expose Node APIs directly to the renderer.

### Rule 15

Do not begin with massive abstraction if it prevents rapid MVP validation.

---

# 166. Final Product Flow

The final user experience should be:

```text
                    USER
                      │
                      │ Move mouse
                      ▼
             ┌─────────────────┐
             │ Mouse Tracker   │
             └────────┬────────┘
                      │
                      ▼
                Debounce
                      │
                      ▼
          ┌──────────────────────┐
          │ Accessibility Query  │
          └──────────┬───────────┘
                     │
                Text found?
                /          \
              YES           NO
               │             │
               ▼             ▼
          Direct Text       Capture
               │             │
               │             ▼
               │            OCR
               │             │
               │             ▼
               │      Text + Bounding Box
               │             │
               └──────┬──────┘
                      ▼
               Select Text
                      │
                      ▼
             Sentence Detection
                      │
                      ▼
                Normalize
                      │
                      ▼
                 Cache
                /     \
             HIT       MISS
              │          │
              │          ▼
              │      Google API
              │          │
              │          ▼
              │        Cache
              │          │
              └────┬─────┘
                   ▼
              Overlay
                   │
                   ▼
                 USER
```

---

# 167. Final Assessment

## Feasibility

**High.**

The product is technically feasible on both Windows and macOS.

The biggest challenge is not translation.

The challenging parts are:

```text
1. Global mouse tracking
2. Accessibility integration
3. OCR
4. Text/word bounding boxes
5. Sentence reconstruction
6. Coordinate conversion
7. Multi-monitor/DPI handling
8. Transparent overlay
9. Permission handling
10. Performance optimization
```

---

# 168. Most Important Architectural Insight

The product should NOT be thought of as:

```text
"Electron app that translates text"
```

It should be thought of as:

```text
"Desktop visual text acquisition and translation pipeline"
```

The translation API is only one component.

The real pipeline is:

```text
Screen
 ↓
Text Acquisition
 ↓
Text Localization
 ↓
Text Understanding
 ↓
Translation
 ↓
Overlay
```

---

# 169. Recommended Final Architecture

The preferred long-term architecture is:

```text
Electron
+
React
+
TypeScript
+
pnpm workspace
+
Native platform abstraction
+
Rust/N-API where appropriate
+
macOS Accessibility
+
Windows UI Automation
+
macOS Vision OCR
+
Windows OCR
+
Native/optimized screen capture
+
Google Translate Provider
+
SQLite Cache
+
Transparent Electron Overlay
```

with the following fundamental fallback:

```text
             ┌─────────────────┐
             │ Accessibility   │
             └────────┬────────┘
                      │
               available?
                /          \
              YES           NO
               │             │
               ▼             ▼
           Direct Text      OCR
               │             │
               └──────┬──────┘
                      ▼
                  Translate
                      ▼
                   Overlay
```

---

# 170. Final Principle

The application should follow this philosophy:

> **If the operating system can tell us what the user is looking at, use that information. If it cannot, look at the pixels and use OCR.**

Therefore:

```text
Accessibility = Fast Path
OCR            = Universal Path
Translation    = Language Path
Overlay        = Presentation Path
Electron       = Application Shell
Native Layer   = OS Integration Layer
```

This separation should remain intact throughout implementation.

---

# 171. Expected AI Planning Output

After receiving this specification, the AI coding agent should produce a second-level implementation document containing:

```text
1. Final architecture
2. Repository structure
3. Package structure
4. Native bridge design
5. Windows implementation plan
6. macOS implementation plan
7. Electron implementation plan
8. OCR implementation plan
9. Accessibility implementation plan
10. Screen capture implementation plan
11. Mouse tracking implementation plan
12. Coordinate system implementation
13. Sentence detection algorithm
14. Translation provider implementation
15. Cache implementation
16. Overlay implementation
17. Permission flow
18. Security model
19. Privacy model
20. Testing strategy
21. Build strategy
22. Packaging strategy
23. Auto-update strategy
24. CI/CD strategy
25. Development milestones
26. Risk register
27. Acceptance criteria
28. Task breakdown
29. File-by-file implementation plan
30. MVP vs future roadmap
```

The AI must validate uncertain platform-specific assumptions against current official documentation before implementing them, particularly for:

```text
Windows UI Automation
Windows OCR
Windows screen capture
Windows DPI
macOS Accessibility
macOS ScreenCaptureKit
macOS Vision
macOS permissions
Electron overlay behavior
Electron native module packaging
```

The final implementation should prioritize **correctness, responsiveness, privacy, low API cost, platform compatibility, and maintainability** over prematurely adding advanced features.
