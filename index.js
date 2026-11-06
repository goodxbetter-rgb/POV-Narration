
import { extension_settings } from "../../../extensions.js";
import { getContext } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const EXT = "pov-narration-refiner";

const DEFAULTS = {
    buttonX: null,
    buttonY: null,
    windowWidth: 460,
    windowHeight: 570
};

let settings;
let root, launcher;
let inputEl, outputEl, refineButton, statusEl;

const PROMPT = `You are a text editor for roleplay messages.

YOUR TASK:
Read the user's original text and polish it so it sounds natural, fluent, and appropriate for the current conversation.

You may use the conversation context only to understand:
- Who the user is portraying.
- Who the user is speaking to.
- The situation and tone of the conversation.
- Appropriate language, vocabulary, politeness, and forms of address.

EDITING RULES:
- Edit ONLY the text supplied by the user.
- Preserve the original meaning and intention.
- Preserve all original actions and events.
- Preserve the original dialogue and its intended meaning.
- Improve wording, grammar, sentence flow, and readability.
- Make the language appropriate to the user's role and the current situation.
- Keep the original language.
- Maintain the user's intended writing style where possible.
- Do not unnecessarily rewrite sentences that are already good.

STRICT RESTRICTIONS:
- Do not continue the scene.
- Do not reply to the user's dialogue.
- Do not write dialogue for other characters.
- Do not invent actions, reactions, thoughts, or emotions.
- Do not add descriptions or events.
- Do not change the user's intentions.
- Do not include conversation history in the output.
- Do not generate timestamps, event logs, or system tags.

IMPORTANT:
Conversation context is for understanding language and tone only.
The source text is the only text you are allowed to edit.

OUTPUT:
Return only the polished version of the user's original text.
No introduction, explanation, commentary, or additional content.`;

function initSettings() {
    if (!extension_settings[EXT]) {
        extension_settings[EXT] = { ...DEFAULTS };
    }
    settings = extension_settings[EXT];
}

function save() {
    saveSettingsDebounced();
}

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

function status(text, type = "") {
    statusEl.textContent = text;
    statusEl.dataset.kind = type;
}

function buildPrompt(text) {
    return `${PROMPT}

USER'S ORIGINAL TEXT:
${JSON.stringify(text.trim())}

Polish the original text according to the instructions.
Return only the polished text.`;
}

async function generate(text) {
    const context = getContext();

    if (typeof context.generateQuietPrompt !== "function") {
        throw new Error("ไม่พบ generateQuietPrompt ใน SillyTavern Context");
    }

    return await context.generateQuietPrompt({
        quietPrompt: buildPrompt(text)
    });
}

function extractResult(result) {
    if (typeof result === "string") return result.trim();

    if (result && typeof result === "object") {
        for (const key of ["text", "content", "output"]) {
            if (typeof result[key] === "string") {
                return result[key].trim();
            }
        }
    }

    return "";
}

async function refine() {
    const text = inputEl.value.trim();

    if (!text || refineButton.disabled) return;

    refineButton.disabled = true;
    refineButton.textContent = "กำลังปรับคำ...";
    outputEl.value = "";
    status("กำลังประมวลผล...", "working");

    try {
        const result = await generate(text);
        const output = extractResult(result);

        if (!output) {
            throw new Error("AI ไม่ได้ส่งข้อความกลับมา");
        }

        outputEl.value = output;
        status("ปรับคำบรรยายเรียบร้อย", "success");

    } catch (error) {
        console.error(`[${EXT}]`, error);
        status(error.message || "เกิดข้อผิดพลาด", "error");

    } finally {
        refineButton.disabled = false;
        refineButton.textContent = "ปรับคำบรรยาย";
    }
}

async function copyResult() {
    const text = outputEl.value.trim();
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        status("คัดลอกข้อความแล้ว", "success");
    } catch {
        outputEl.focus();
        outputEl.select();
        const ok = document.execCommand("copy");
        status(ok ? "คัดลอกข้อความแล้ว" : "คัดลอกไม่สำเร็จ", ok ? "success" : "error");
    }
}

function toggleWindow() {
    root.classList.toggle("pov-hidden");

    if (!root.classList.contains("pov-hidden")) {
        inputEl.focus();
    }
}

function createLauncher() {
    launcher = el("button", "pov-launcher", "✎");
    launcher.type = "button";
    launcher.title = "POV Narration Refiner";

    if (Number.isFinite(settings.buttonX)) {
        launcher.style.left = `${settings.buttonX}px`;
        launcher.style.top = `${settings.buttonY}px`;
        launcher.style.right = "auto";
        launcher.style.bottom = "auto";
    }

    let dragging = false;
    let moved = false;
    let sx = 0, sy = 0, ox = 0, oy = 0;

    launcher.addEventListener("pointerdown", e => {
        if (e.button !== 0) return;

        dragging = true;
        moved = false;
        sx = e.clientX;
        sy = e.clientY;

        const rect = launcher.getBoundingClientRect();
        ox = rect.left;
        oy = rect.top;

        launcher.setPointerCapture(e.pointerId);
    });

    launcher.addEventListener("pointermove", e => {
        if (!dragging) return;

        const dx = e.clientX - sx;
        const dy = e.clientY - sy;

        if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
        if (!moved) return;

        const x = Math.max(0, Math.min(window.innerWidth - 42, ox + dx));
        const y = Math.max(0, Math.min(window.innerHeight - 42, oy + dy));

        launcher.style.left = `${x}px`;
        launcher.style.top = `${y}px`;
        launcher.style.right = "auto";
        launcher.style.bottom = "auto";
    });

    launcher.addEventListener("pointerup", () => {
        if (!dragging) return;
        dragging = false;

        if (moved) {
            const rect = launcher.getBoundingClientRect();
            settings.buttonX = Math.round(rect.left);
            settings.buttonY = Math.round(rect.top);
            save();
        } else {
            toggleWindow();
        }
    });
}

function createWindow() {
    root = el("section", "pov-window pov-hidden");

    const header = el("header", "pov-header");

    const heading = el("div", "pov-heading");
    heading.append(
        el("div", "pov-title", "POV Narration Refiner"),
        el("div", "pov-subtitle", "ปรับคำบรรยายของ {{user}}")
    );

    const close = el("button", "pov-close", "×");
    close.type = "button";
    close.addEventListener("click", toggleWindow);

    header.append(heading, close);

    const body = el("div", "pov-body");

    const inputLabel = el("label", "pov-label", "ข้อความต้นฉบับ");

    inputEl = el("textarea", "pov-textarea");
    inputEl.placeholder = "พิมพ์หรือวางข้อความที่ต้องการปรับ...";
    inputEl.rows = 6;

    const actions = el("div", "pov-actions");

    refineButton = el("button", "pov-primary", "ปรับคำบรรยาย");
    refineButton.type = "button";
    refineButton.addEventListener("click", refine);

    const clear = el("button", "pov-secondary", "ล้าง");
    clear.type = "button";
    clear.addEventListener("click", () => {
        inputEl.value = "";
        outputEl.value = "";
        status("");
        inputEl.focus();
    });

    actions.append(refineButton, clear);

    const outputHeader = el("div", "pov-output-header");

    const outputLabel = el("label", "pov-label", "ผลลัพธ์");

    const copy = el("button", "pov-copy", "คัดลอก");
    copy.type = "button";
    copy.addEventListener("click", copyResult);

    outputHeader.append(outputLabel, copy);

    outputEl = el("textarea", "pov-textarea pov-output");
    outputEl.placeholder = "ผลลัพธ์จะแสดงที่นี่...";
    outputEl.rows = 8;
    outputEl.readOnly = true;

    statusEl = el("div", "pov-status");

    const hint = el(
        "div",
        "pov-hint",
        "ปรับสำนวนเท่านั้น ไม่เขียนต่อฉากและไม่ส่งข้อความเข้าแชทอัตโนมัติ"
    );

    body.append(
        inputLabel,
        inputEl,
        actions,
        outputHeader,
        outputEl,
        statusEl,
        hint
    );

    root.append(header, body);

    root.style.width = `${settings.windowWidth}px`;
    root.style.height = `${settings.windowHeight}px`;

    makeDraggable(header);
    makeResizable();

    return root;
}

function makeDraggable(header) {
    let dragging = false;
    let sx, sy, ox, oy;

    header.addEventListener("pointerdown", e => {
        if (e.target.closest("button")) return;

        dragging = true;
        const rect = root.getBoundingClientRect();

        sx = e.clientX;
        sy = e.clientY;
        ox = rect.left;
        oy = rect.top;

        header.setPointerCapture(e.pointerId);
    });

    header.addEventListener("pointermove", e => {
        if (!dragging) return;

        const x = Math.max(0, Math.min(
            window.innerWidth - root.offsetWidth,
            ox + e.clientX - sx
        ));

        const y = Math.max(0, Math.min(
            window.innerHeight - 60,
            oy + e.clientY - sy
        ));

        root.style.left = `${x}px`;
        root.style.top = `${y}px`;
        root.style.transform = "none";
    });

    header.addEventListener("pointerup", () => {
        dragging = false;
    });
}

function makeResizable() {
    const handle = el("div", "pov-resize");
    root.append(handle);

    let resizing = false;
    let sx, sy, sw, sh;

    handle.addEventListener("pointerdown", e => {
        e.preventDefault();
        resizing = true;

        const rect = root.getBoundingClientRect();
        sx = e.clientX;
        sy = e.clientY;
        sw = rect.width;
        sh = rect.height;

        handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener("pointermove", e => {
        if (!resizing) return;

        const width = Math.max(340, Math.min(
            900,
            sw + e.clientX - sx
        ));

        const height = Math.max(420, Math.min(
            900,
            sh + e.clientY - sy
        ));

        root.style.width = `${width}px`;
        root.style.height = `${height}px`;

        settings.windowWidth = width;
        settings.windowHeight = height;
    });

    handle.addEventListener("pointerup", () => {
        resizing = false;
        save();
    });
}

function init() {
    initSettings();

    const existingLauncher = document.getElementById(
        "pov-narration-refiner-launcher"
    );

    const existingRoot = document.getElementById(
        "pov-narration-refiner-root"
    );

    if (!existingLauncher) {
        createLauncher();
        launcher.id = "pov-narration-refiner-launcher";
        document.body.append(launcher);
    }

    if (!existingRoot) {
        createWindow();
        root.id = "pov-narration-refiner-root";
        document.body.append(root);
    }

    if (!window.povNarrationRefinerKeyHandler) {
        document.addEventListener("keydown", e => {
            if (e.key === "Escape") {
                const windowEl = document.getElementById(
                    "pov-narration-refiner-root"
                );
                if (windowEl) windowEl.classList.add("pov-hidden");
            }
        });

        window.povNarrationRefinerKeyHandler = true;
    }

    console.info(`[${EXT}] loaded`);
}

jQuery(init);
