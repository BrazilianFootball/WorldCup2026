import os
import time
import unicodedata
from playwright.sync_api import sync_playwright

def main():
    # Folder to save screenshots
    output_dir = "/Users/luisfernandolaguardia/Documents/WorldCup2026/docs/images/figurinhas"
    os.makedirs(output_dir, exist_ok=True)
    print(f"Salvando as figurinhas em: {output_dir}")

    with sync_playwright() as p:
        # Launch headless browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 2000},
            device_scale_factor=2 # Double scale factor is vital for 2x retina output
        )
        page = context.new_page()

        # Navigate to the previsoes page
        print("Carregando previsoes.html...")
        page.goto("http://localhost:8000/previsoes.html", wait_until="networkidle")

        # Wait for all cards to render
        time.sleep(2)

        # Make all panels visible so we can capture all cards across all stages
        page.evaluate("""
            // Cache buster for previsoes.css to ensure we load the absolute latest dimensions!
            const link = document.querySelector('link[href*="previsoes.css"]');
            if (link) {
                link.href = link.href.split('?')[0] + '?v=' + Date.now();
            }

            document.querySelectorAll('.panel').forEach(p => {
                p.style.display = 'block';
                p.style.visibility = 'visible';
                p.style.opacity = '1';
            });
            // Align all sticker-wrappers perfectly upright and upright
            document.querySelectorAll('.sticker-wrapper').forEach(w => {
                w.style.setProperty('--rand-rot', '0deg');
                w.style.setProperty('--rand-y', '0px');
                w.style.transform = 'none';
                w.style.margin = '15px';
                w.style.padding = '0px';
                w.style.background = 'transparent';
                w.style.border = 'none';
                w.style.boxShadow = 'none';
            });
        """)
        time.sleep(0.5)

        # Find all sticker elements
        stickers = page.query_selector_all(".sticker-container")
        print(f"Encontradas {len(stickers)} figurinhas para exportar.")

        for idx, sticker in enumerate(stickers):
            # Try to get the home and away team names to name the file
            parent = sticker.evaluate_handle("el => el.closest('.sticker-wrapper')")
            home = "time1"
            away = "time2"
            group = "fase"
            if parent:
                home = page.evaluate("el => el.dataset.home", parent) or "time1"
                away = page.evaluate("el => el.dataset.away", parent) or "time2"
                group = page.evaluate("el => el.dataset.group", parent) or "fase"
            
            # Format filename
            filename = f"{group.lower().replace(' ', '_')}_{home.lower()}_vs_{away.lower()}.png"
            # Normalize filename (remove accents/special chars)
            filename = "".join(
                c for c in unicodedata.normalize('NFD', filename)
                if unicodedata.category(c) != 'Mn'
            ).replace("ç", "c").replace(" ", "_")

            filepath = os.path.join(output_dir, filename)
            
            print(f"[{idx+1}/{len(stickers)}] Capturando {home} vs {away} ({group}) -> {filename}...")
            
            # Scroll the element into view to ensure its coordinates are inside the viewport bounds
            sticker.scroll_into_view_if_needed()
            time.sleep(0.05) # Settle scroll

            # Precise Clip sizing for EXACTLY 528x814 output under device_scale_factor=2!
            # Since scale=2, a width of 264px becomes 528px.
            # The sticker container itself is height: 404px (--sticker-h: 404px).
            # To get exactly 814px high (which is 407px CSS height), we expand the height of our
            # capture area clip by exactly 3px at the bottom.
            # Under scale=2, this translates to exactly:
            # - Width: 528px (264px * 2)
            # - Height: 814px (407px * 2)
            # This perfectly preserves the entire 404px sticker, and extends the viewport crop 
            # by 3px past the bottom border (yielding exactly 6px of background gap at @2x scale)!
            box = sticker.bounding_box()
            if box:
                clip_box = {
                    "x": box["x"],
                    "y": box["y"],
                    "width": 264.0,
                    "height": 407.0 # 404px (card) + 3px (extra margin) = 407px (x2 = 814px!)
                }
                page.screenshot(path=filepath, clip=clip_box, omit_background=True)
            else:
                sticker.screenshot(path=filepath)

        browser.close()
        print("Concluído! Todas as figurinhas foram exportadas em resolução exata de 528x814 com margem inferior.")

if __name__ == "__main__":
    main()
