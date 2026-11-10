from io import BytesIO
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent
PACKS = ("AntiTankLauncher_BP", "AntiTankLauncher_RP")


def build_mcpack(pack_name):
    pack_dir = ROOT / pack_name
    manifest = pack_dir / "manifest.json"
    if not manifest.is_file():
        raise FileNotFoundError(f"Missing pack manifest: {manifest}")

    buffer = BytesIO()
    with ZipFile(buffer, "w", compression=ZIP_DEFLATED) as archive:
        for path in sorted(pack_dir.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(pack_dir).as_posix())
    return buffer.getvalue()


def main():
    addon_path = ROOT / "AntiTankLauncher.mcaddon"
    with ZipFile(addon_path, "w", compression=ZIP_DEFLATED) as addon:
        for pack_name in PACKS:
            mcpack_data = build_mcpack(pack_name)
            mcpack_path = ROOT / f"{pack_name}.mcpack"
            mcpack_path.write_bytes(mcpack_data)
            addon.writestr(mcpack_path.name, mcpack_data)
            print(f"Created {mcpack_path.name}")

    print(f"Created {addon_path.name}")


if __name__ == "__main__":
    main()
