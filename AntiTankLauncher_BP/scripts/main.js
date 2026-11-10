import { world, system } from "@minecraft/server";

const LAUNCHER_ID = "atl:anti_tank_launcher";
const AMMO_ID = "atl:missile_ammunition";
const MISSILE_ID = "atl:homing_missile";
const LOCK_TICKS = 20;
const MAX_RANGE = 48;
const targets = new Map();
const missiles = new Map();
const ammunition = new Map();

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scale(v, amount) {
  return { x: v.x * amount, y: v.y * amount, z: v.z * amount };
}

function length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function normalize(v) {
  const size = length(v);
  return size === 0 ? { x: 0, y: 0, z: 0 } : scale(v, 1 / size);
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function isTarget(entity, player) {
  if (entity.id === player.id || !entity.isValid()) return false;
  return !entity.hasTag("atl_missile");
}

function findTarget(player) {
  const head = player.getHeadLocation();
  const direction = normalize(player.getViewDirection());
  let best;
  let bestScore = -Infinity;
  for (const entity of player.dimension.getEntities({ location: player.location, maxDistance: MAX_RANGE })) {
    if (!isTarget(entity, player)) continue;
    const center = add(entity.location, { x: 0, y: 0.9, z: 0 });
    const offset = subtract(center, head);
    const distance = length(offset);
    const alignment = dot(direction, normalize(offset));
    if (alignment < 0.78) continue;
    const score = alignment * 100 - distance;
    if (score > bestScore) {
      best = entity;
      bestScore = score;
    }
  }
  return best;
}

function lockColor(progress) {
  if (progress >= 1) return "§c■";
  if (progress >= 0.75) return "§6■";
  if (progress >= 0.4) return "§e■";
  return "§a■";
}

function ammoCount(player) {
  return ammunition.get(player.id) ?? 0;
}

function showStatus(player, state, target) {
  const ammo = ammoCount(player);
  if (!state || !target || !target.isValid()) {
    player.onScreenDisplay.setActionBar(`§a■ §fSCAN FOR TARGET §7| MISSILES: ${ammo}`);
    return;
  }
  const progress = Math.min(1, state.ticks / LOCK_TICKS);
  const label = progress >= 1 ? (ammo > 0 ? "§cLOCKED - TAP TO LAUNCH" : "§eLOCKED - RELOAD") : "§fTRACKING TARGET";
  player.onScreenDisplay.setActionBar(`${lockColor(progress)} ${label} §7${Math.floor(progress * 100)}% §8| MISSILES: ${ammo}`);
}

function reload(player) {
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory) return false;
  for (let slot = 0; slot < inventory.size; slot++) {
    const item = inventory.getItem(slot);
    if (!item || item.typeId !== AMMO_ID) continue;
    if (item.amount === 1) inventory.setItem(slot, undefined);
    else {
      item.amount -= 1;
      inventory.setItem(slot, item);
    }
    ammunition.set(player.id, ammoCount(player) + 1);
    player.onScreenDisplay.setActionBar(`§aRELOADED §f| MISSILES: ${ammoCount(player)}`);
    return true;
  }
  player.onScreenDisplay.setActionBar(`§eNO MISSILE AMMUNITION §f| MISSILES: ${ammoCount(player)}`);
  return false;
}

function launch(player, state) {
  if (!state || state.ticks < LOCK_TICKS || !state.target?.isValid()) return false;
  if (ammoCount(player) <= 0) {
    player.onScreenDisplay.setActionBar("§eOUT OF MISSILES - SNEAK AND USE TO RELOAD");
    return false;
  }
  const origin = add(player.getHeadLocation(), scale(normalize(player.getViewDirection()), 1.4));
  const missile = player.dimension.spawnEntity(MISSILE_ID, origin);
  missile.addTag("atl_missile");
  missiles.set(missile.id, { entity: missile, target: state.target, owner: player.id, age: 0 });
  ammunition.set(player.id, ammoCount(player) - 1);
  player.dimension.playSound("random.explode", origin, { volume: 0.35, pitch: 1.8 });
  state.ticks = 0;
  state.target = undefined;
  player.onScreenDisplay.setActionBar(`§cMISSILE AWAY §f| MISSILES: ${ammoCount(player)}`);
  return true;
}

world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  if (!player || event.itemStack.typeId !== LAUNCHER_ID) return;
  if (player.isSneaking) {
    reload(player);
    return;
  }
  const state = targets.get(player.id);
  if (launch(player, state)) return;
  if (ammoCount(player) <= 0) {
    player.onScreenDisplay.setActionBar("§eOUT OF MISSILES - SNEAK AND USE TO RELOAD");
    return;
  }
  player.onScreenDisplay.setActionBar("§e■ §fHold aim on a target until the square turns red");
});

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    let state = targets.get(player.id);
    if (!state) {
      state = { ticks: 0, target: undefined };
      targets.set(player.id, state);
    }
    const target = findTarget(player);
    if (target && state.target?.id === target.id) state.ticks++;
    else {
      state.target = target;
      state.ticks = target ? 1 : 0;
    }
    showStatus(player, state, target);
  }

  for (const [id, missileData] of missiles) {
    const missile = missileData.entity;
    const target = missileData.target;
    missileData.age++;
    if (!missile.isValid() || !target?.isValid() || missileData.age > 100) {
      if (missile.isValid()) missile.remove();
      missiles.delete(id);
      continue;
    }
    const aim = normalize(subtract(add(target.location, { x: 0, y: 0.8, z: 0 }), missile.location));
    const next = add(missile.location, scale(aim, 1.25));
    missile.teleport(next, { dimension: missile.dimension });
    missile.dimension.spawnParticle("minecraft:basic_smoke_particle", missile.location);
    if (length(subtract(target.location, missile.location)) < 1.8) {
      missile.dimension.createExplosion(missile.location, 5.5, { breaksBlocks: true, causesFire: true, source: missile });
      missile.remove();
      missiles.delete(id);
    }
  }
}, 1);
