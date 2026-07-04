import os, zipfile, time

SRC = "noname"                      # run from ./output ; archive keeps top-level "noname/"
OUT = "noname-wuban-win64.zip"

if os.path.exists(OUT):
    os.remove(OUT)

t0 = time.time()
count = 0
with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=1, allowZip64=True) as zf:
    for root, dirs, files in os.walk(SRC):
        # keep empty dirs too (harmless, preserves structure)
        if not files and not dirs:
            zi = zipfile.ZipInfo(root + "/")
            zf.writestr(zi, b"")
        for name in files:
            full = os.path.join(root, name)
            zf.write(full, full)     # non-ASCII arcnames -> Python sets UTF-8 flag (bit 11)
            count += 1
            if count % 3000 == 0:
                print(f"  added {count} files ({time.time()-t0:.0f}s)", flush=True)

print(f"DONE: {count} files in {time.time()-t0:.0f}s")

# --- verify: names decode as UTF-8 directly, flag set, 五班阿 present ---
z = zipfile.ZipFile(OUT)
wba = [i for i in z.infolist() if "五班阿" in i.filename]
print("五班阿 entries:", len(wba))
print("all 五班阿 entries have UTF-8 flag:", all((i.flag_bits & 0x800) for i in wba))
ext = [i for i in wba if i.filename.endswith("五班阿/extension.js")]
if ext:
    print("connect: true count:", z.read(ext[0].filename).decode("utf-8").count("connect: true"))
print("total entries:", len(z.namelist()))
