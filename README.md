# 🌌 DoL **Megatravel**

**Instant Teleport & Passage Jumping** for *Degrees of Lewdity*

[![Userscript](https://img.shields.io/badge/type-Userscript-2ea44f)](#-what-is-this)
[![Manager](https://img.shields.io/badge/manager-Tampermonkey-blue)](#-installation)
[![Build](https://img.shields.io/badge/Test%20Build-2376-7bff5f)](#-changelog)
[![DoL](https://img.shields.io/badge/DoL-0.5.4.9%2B-6f42c1)](#-compatibility)
[![Status](https://img.shields.io/badge/status-Beta-yellow)](#-status--disclaimer)

> **Megatravel** adds a powerful **Instant Teleport menu** to instantly jump to **any passage** in the game. Includes search, favorites, recents, and categories.

⚠️ **Warning**: Teleporting into certain scripted/event-heavy passages can **break progression** or cause unexpected behavior. Use responsibly.
⚠️ **Spoilers**: This tool exposes hidden scenes and locations.

---

## 💡 What is this

**Megatravel** is a userscript for *Degrees of Lewdity* (SugarCube engine), which:

* provides an **Instant Teleport modal menu** opened via hotkey;
* allows you to **jump instantly** ("TP") to any passage;
* supports **favorites** (★PIN) and **recents**;
* supports categories (Town, School, Forest, Lake/River, Farm, Temple, Prison, Dungeons, Home/Orphanage, Work/Shops, Events/Scenes, Other).

---

## ✨ Features

* **Instant Teleport menu** — hotkey based, no UI clutter.
* **Search by passage name** + filter by category.
* **Favorites (★PIN)** — pin important locations.
* **Recents** — quick access to the last 20 teleports.
* **Lightweight** — no save interference, uses only `localStorage`.
* **Zero Grants** — `@grant none`, no external permissions.

---

## ⚙️ Installation

1. Install **Tampermonkey** (Chrome/Edge/Firefox/Opera).
2. Create a new userscript and paste the contents of `Ketsman_DoL_Megatravel.user.js`.
3. Save — Tampermonkey will auto-activate it for DoL HTML pages.

> **Local `file://` files are also supported** for offline builds.



---

## 🚀 Quick Start

* Launch the game → use the hotkey **`Ctrl + Shift + M`** to open **Instant Teleport**.
* Search for any passage → click **TP** to instantly jump there.
* Pin favorite passages with **★PIN**.

---

## ⌨️ Hotkeys
* **Open/close Instant Teleport**: `Ctrl + Shift + M`
---

## 🛠 How it works

* Waits for **SugarCube.Engine** & **Story** to be ready.
* Collects all passages (via `SugarCube.Story.passages` or `tw-passagedata`).
* Applies categorization rules and filters system passages.
* Provides a fast `engine.play(passageName)` trigger with fallbacks.

---

## 🧩 Storage

* `dol.megatravel.favs` — list of favorite passages.
* `dol.megatravel.recents` — last 20 jumps.

**Reset**: clear these keys via browser DevTools → Application → Local Storage.

---

## 🔗 Compatibility

* **DoL 0.5.4.9+** (SugarCube). + **DoLp**
* Works with online and offline HTML builds.
* No external libraries, no network requests.

---

## ❓ FAQ

**Q: Is this a cheat?**
A: It’s primarily a tool for **testing and modding**. You choose how to use it.

**Q: Does it break saves?**
A: No. Uses only `localStorage` for its own data.

**Q: Can teleporting break the game?**
A: Yes. Jumping into scripted zones, events, or unfinished passages can cause **softlocks, broken states, or spoilers**.

**Q: How do I disable quickly?**
A: Disable the userscript in Tampermonkey.

---

## ⚠️ Known Limitations

* Categorization is heuristic-based (keywords in name/tags).
* Non-standard builds may expose unexpected system passages.
* Large mods → initial indexing may take a moment.

---

## 🧯 Troubleshooting

* **Hotkey not working**: ensure Tampermonkey script is enabled.
* **No modal appears**: check `window.SugarCube` in console.
* **Teleport not working**: forks may require different `engine.play` logic.
* **Reset favorites/recents**: clear `dol.megatravel.*` keys in `localStorage`.

## 🤝 Contributing & License

* Issues/PRs welcome — improve categories, add translations, suggest tweaks.
* License: **MIT**.

---

## 🧪 Status & Disclaimer

* Status: **Beta** — expect rough edges in non-standard builds.
* Intended **only** for testing/modding purposes in *Degrees of Lewdity*.
* ⚠️ **Warning**: Use responsibly. Scripted events may break.

<p align="center">
  <a href="https://discord.gg/mGpRSn9qMF" target="_blank" rel="noopener noreferrer">
    <img alt="Join our Discord" src="https://img.shields.io/badge/Join%20the%20DoL%20Modders%20Server-Discord-5865F2?logo=discord&logoColor=white" />
  </a>
</p>


**For testers and modders, with ❤️ — Ketsman**
