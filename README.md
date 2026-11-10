# Minecraft Bedrock Homing Launcher Add-On

Koidak 7-one is a Minecraft Bedrock mod add-on that adds a craftable homing launcher, target locking, missile ammunition, and guided missile attacks. Aim at an eligible nearby entity to track it; when the lock indicator turns red, use the launcher to fire.

## Install

1. From the project folder, run `python package_mcpack.py` with Python 3 installed. This creates `AntiTankLauncher.mcaddon` and separate behavior and resource pack files.
2. Import `AntiTankLauncher.mcaddon` into Minecraft Bedrock by opening it with Minecraft.
3. Edit a world and activate both the Anti-Tank Homing Launcher behavior pack and resource pack.
4. Use Minecraft Bedrock 1.21.80 or newer. The add-on uses the `@minecraft/server` 1.18.0 scripting API.

## Use

1. Craft the launcher at a crafting table using iron ingots, redstone, sticks, and a blaze rod, or use `/give @s atl:anti_tank_launcher`.
2. Craft missile ammunition using iron, redstone, blaze powder, and gunpowder. Each recipe creates four rounds. Ammunition can also be obtained with `/give @s atl:missile_ammunition 16`.
3. Keep ammunition in your inventory and sneak-use the launcher to load one missile into its reserve.
4. Aim at an eligible entity within 48 blocks. Keep aiming at the same target until the action-bar square turns red, indicating a lock.
5. Use the launcher to fire. The missile homes toward the locked entity and creates an explosion on impact.

---

More Minecraft mod projects by EnderDevelopment: https://github.com/EnderDevelopment

Project page: https://dash.enderdevelopment.com/community/45e32eaf-a048-4028-a88e-050a51a37a7c?utm_source=github&utm_medium=readme&utm_campaign=auto_publish&utm_content=45e32eaf-a048-4028-a88e-050a51a37a7c
