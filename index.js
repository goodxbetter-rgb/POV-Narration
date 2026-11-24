
function createLauncher() {
    launcher = el("button", "pov-launcher", "✎");

    launcher.id = "pov-narration-refiner-launcher";
    launcher.type = "button";
    launcher.title = "RP Assistant";
    launcher.setAttribute("aria-label", "เปิด RP Assistant");

    const getBounds = () => {
        const rect = launcher.getBoundingClientRect();
        const width = rect.width || 42;
        const height = rect.height || 42;

        return {
            width,
            height,
            maxX: Math.max(0, window.innerWidth - width),
            maxY: Math.max(0, window.innerHeight - height)
        };
    };

    const clampLauncher = (x, y) => {
        const bounds = getBounds();

        return {
            x: Math.max(0, Math.min(bounds.maxX, x)),
            y: Math.max(0, Math.min(bounds.maxY, y))
        };
    };

    // Restore saved position, but keep it inside the current screen.
    if (
        Number.isFinite(settings.buttonX) &&
        Number.isFinite(settings.buttonY)
    ) {
        const position = clampLauncher(
            settings.buttonX,
            settings.buttonY
        );

        launcher.style.left = `${position.x}px`;
        launcher.style.top = `${position.y}px`;
        launcher.style.right = "auto";
        launcher.style.bottom = "auto";

        settings.buttonX = position.x;
        settings.buttonY = position.y;
    }

    let dragging = false;
    let moved = false;
    let pointerId = null;

    let sx = 0;
    let sy = 0;
    let ox = 0;
    let oy = 0;

    launcher.addEventListener("pointerdown", e => {
        // Only reject non-primary mouse buttons.
        if (e.pointerType === "mouse" && e.button !== 0) return;

        dragging = true;
        moved = false;
        pointerId = e.pointerId;

        sx = e.clientX;
        sy = e.clientY;

        const rect = launcher.getBoundingClientRect();

        ox = rect.left;
        oy = rect.top;

        try {
            launcher.setPointerCapture(e.pointerId);
        } catch {}

        e.preventDefault();
    });

    launcher.addEventListener("pointermove", e => {
        if (!dragging || e.pointerId !== pointerId) return;

        const dx = e.clientX - sx;
        const dy = e.clientY - sy;

        if (Math.abs(dx) + Math.abs(dy) > 5) {
            moved = true;
        }

        if (!moved) return;

        const position = clampLauncher(ox + dx, oy + dy);

        launcher.style.left = `${position.x}px`;
        launcher.style.top = `${position.y}px`;
        launcher.style.right = "auto";
        launcher.style.bottom = "auto";
    });

    const finishDrag = e => {
        if (!dragging || e.pointerId !== pointerId) return;

        dragging = false;
        pointerId = null;

        if (moved) {
            const rect = launcher.getBoundingClientRect();

            settings.buttonX = Math.round(rect.left);
            settings.buttonY = Math.round(rect.top);

            save();
        } else {
            toggleWindow();
        }
    };

    launcher.addEventListener("pointerup", finishDrag);

    launcher.addEventListener("pointercancel", () => {
        dragging = false;
        pointerId = null;
    });

    // Reposition when screen size or orientation changes.
    const handleResize = () => {
        const rect = launcher.getBoundingClientRect();

        const position = clampLauncher(rect.left, rect.top);

        launcher.style.left = `${position.x}px`;
        launcher.style.top = `${position.y}px`;
        launcher.style.right = "auto";
        launcher.style.bottom = "auto";

        settings.buttonX = Math.round(position.x);
        settings.buttonY = Math.round(position.y);

        save();
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
}
