/* INFINITODE 5 — balance data & pure logic. No DOM. Works in browser + Node. */
(function () {
  'use strict';
  const TILE = 64, COLS = 20, ROWS = 12, W = COLS * TILE, H = ROWS * TILE;

  // kind -> air capability: 0 ground only, 1 both, 2 air only
  const TOWERS = {
    basic:   { order: 1,  kind: 'basic',   cost: 50,  dmg: 9,   rate: 1.7,  range: 2.6, ps: 560, air: 0, color: '#9aa5d6', color2: '#39f5c8',
      name: { uk: 'Базова', en: 'Basic' }, desc: { uk: 'Дешева і надійна. Добре тримає старт.', en: 'Cheap and reliable. Holds the early game.' } },
    cannon:  { order: 2,  kind: 'cannon',  cost: 100, dmg: 26,  rate: 0.7,  range: 2.9, ps: 420, air: 0, color: '#ff9a3c', splash: 1.15,
      name: { uk: 'Гармата', en: 'Cannon' }, desc: { uk: 'Вибухові снаряди з площею ураження.', en: 'Explosive shells with splash damage.' } },
    multishot:{ order: 3, kind: 'multishot',cost: 130, dmg: 8,   rate: 1.25, range: 3.0, ps: 520, air: 1, color: '#c792ff', count: 4,
      name: { uk: 'Дробовик', en: 'Multishot' }, desc: { uk: 'Віяло снарядів. Косить натовп.', en: 'Fan of projectiles. Shreds crowds.' } },
    sniper:  { order: 4,  kind: 'sniper',  cost: 130, dmg: 95,  rate: 0.5,  range: 6.5, air: 0, color: '#7db4ff', aim: 0.7,
      name: { uk: 'Снайпер', en: 'Sniper' }, desc: { uk: 'Величезна дальність і шкода, але довго цілиться.', en: 'Huge range and damage, slow to aim.' } },
    freezing:{ order: 5,  kind: 'freezing',cost: 80,  dmg: 0,   rate: 1,    range: 2.4, air: 1, color: '#9fe8ff', slow: 0.40,
      name: { uk: 'Морозилка', en: 'Freezing' }, desc: { uk: 'Сповільнює всіх у радіусі. Посилює отруту й теслу.', en: 'Slows everything nearby. Boosts venom & tesla.' } },
    antiair: { order: 6,  kind: 'antiair', cost: 110, dmg: 13,  rate: 3.2,  range: 3.4, ps: 700, air: 2, color: '#ff5d7e',
      name: { uk: 'ППО', en: 'Antiair' }, desc: { uk: "Б'є тільки по повітрю, зате дуже боляче.", en: 'Hits only air, but hits hard.' } },
    splash:  { order: 7,  kind: 'splash',  cost: 170, dmg: 7,   rate: 1.15, range: 2.3, ps: 460, air: 0, color: '#ffe27a', radial: 10,
      name: { uk: 'Шрапнель', en: 'Splash' }, desc: { uk: 'Стріляє кільцем у всі боки. Не цілиться.', en: 'Radial burst in all directions. No aiming.' } },
    blast:   { order: 8,  kind: 'blast',   cost: 150, dmg: 24,  rate: 0.55, range: 1.9, air: 0, color: '#ff6b4a', stun: 0.6,
      name: { uk: 'Вибух', en: 'Blast' }, desc: { uk: 'Нова: шкода + оглушення всіх поруч.', en: 'Nova: damages and stuns everything near.' } },
    minigun: { order: 9,  kind: 'minigun', cost: 210, dmg: 5,   rate: 2.0,  range: 3.3, ps: 760, air: 0, color: '#8affda', maxRate: 9,
      name: { uk: 'Мініган', en: 'Minigun' }, desc: { uk: 'Розкручується до шаленого темпу.', en: 'Spins up to an insane fire rate.' } },
    venom:   { order: 10, kind: 'venom',   cost: 150, dmg: 12,  rate: 0.65, range: 3.1, ps: 260, air: 0, color: '#7dff5e', pdps: 7, pdur: 4,
      name: { uk: 'Отрута', en: 'Venom' }, desc: { uk: 'Отруює: шкода з часом і сповільнення швидких.', en: 'Poisons: damage over time, slows fast enemies.' } },
    tesla:   { order: 11, kind: 'tesla',   cost: 230, dmg: 32,  rate: 0.85, range: 2.7, air: 1, color: '#7df9ff', jumps: 4, falloff: 0.7, jumpR: 1.6,
      name: { uk: 'Тесла', en: 'Tesla' }, desc: { uk: 'Ланцюгова блискавка по кількох цілях.', en: 'Chain lightning across several targets.' } },
    missile: { order: 12, kind: 'missile', cost: 260, dmg: 45,  rate: 0.5,  range: 4.6, ps: 380, air: 1, color: '#ff8ad8', splash: 1.0, lrm: 4,
      name: { uk: 'Ракети', en: 'Missile' }, desc: { uk: 'Самонавідні ракети. LRM б’є по всій мапі.', en: 'Homing missiles. LRM strikes map-wide.' } },
    flame:   { order: 13, kind: 'flame',   cost: 190, dmg: 30,  rate: 1,    range: 2.3, air: 0, color: '#ffb52e', bdps: 9, bdur: 3,
      name: { uk: 'Вогнемет', en: 'Flamethrower' }, desc: { uk: 'Конус вогню + підпал ворогів.', en: 'Fire cone that ignites enemies.' } },
    laser:   { order: 14, kind: 'laser',   cost: 320, dmg: 170, rate: 1,    range: 8.0, air: 0, color: '#ff4d6d', charge: 2.2,
      name: { uk: 'Лазер', en: 'Laser' }, desc: { uk: 'Заряджається і прошиває лінію променем.', en: 'Charges up and pierces a line with a beam.' } },
    gauss:   { order: 15, kind: 'gauss',   cost: 360, dmg: 280, rate: 0.28, range: 7.5, air: 0, color: '#b06bff',
      name: { uk: 'Гаус', en: 'Gauss' }, desc: { uk: 'Рейковий постріл крізь усіх на лінії.', en: 'Railgun shot through everyone in line.' } },
    crusher: { order: 16, kind: 'crusher', cost: 290, dmg: 34,  rate: 1,    range: 1.7, air: 0, color: '#c9d4ff', arms: 2, hold: 3,
      name: { uk: 'Дробарка', en: 'Crusher' }, desc: { uk: 'Хапає ворогів і перемелює.', en: 'Grabs enemies and grinds them.' } },
    plasma:  { order: 17, kind: 'plasma',  cost: 280, dmg: 16,  rate: 1.6,  range: 3.6, ps: 560, air: 1, color: '#ff7ad9',
      name: { uk: 'Плазма', en: 'Plasma' }, desc: { uk: 'Самонавідні згустки плазми. Б’є і по повітрю.', en: 'Homing plasma orbs. Hits air too.' } },
    heli:    { order: 18, kind: 'heli',    cost: 420, dmg: 14,  rate: 2.0,  range: 5.0, air: 1, color: '#ffd968', drones: 2,
      name: { uk: 'Ангара (вертоліт)', en: 'Heli Hangar' }, desc: { uk: 'Бойові вертольоти-дрони патрулюють зону.', en: 'Attack heli drones patrol the zone.' } },
    miner:   { order: 19, kind: 'miner',   cost: 150, dmg: 0,   rate: 0.2,  range: 0,   air: 0, color: '#5ef2b8', income: 12.5,
      name: { uk: 'Майнер', en: 'Miner' }, desc: { uk: 'Видобуває монети кожні 5 секунд.', en: 'Mines coins every 5 seconds.' } },
  };

  // Abilities: [L4a, L4b, L7a, L7b, L10ult]. apply(tw) mutates tower instance.
  const A = (id, name, desc, apply) => ({ id, name, desc, apply });
  const ABILITIES = {
    basic: [
      A('caliber', { uk: 'Великий калібр', en: 'Large caliber' }, { uk: '+35% шкоди', en: '+35% damage' }, t => t.m.dmgMul *= 1.35),
      A('double', { uk: 'Спарені стволи', en: 'Double gun' }, { uk: '+30% темпу', en: '+30% fire rate' }, t => t.m.rateMul *= 1.3),
      A('rico', { uk: 'Рикошет', en: 'Ricochet' }, { uk: '35% шанс влучити ще в одного', en: '35% chance to hit one more' }, t => t.m.ricochet = 0.35),
      A('found', { uk: 'Фундамент', en: 'Foundation' }, { uk: '+60% швидкості снаряда, +15% дальності', en: '+60% projectile speed, +15% range' }, t => { t.m.psMul *= 1.6; t.m.rangeMul *= 1.15; }),
      A('over', { uk: 'УЛЬТ: Овердрайв', en: 'ULT: Overdrive' }, { uk: '+60% темпу, +40% шкоди', en: '+60% rate, +40% damage' }, t => { t.m.rateMul *= 1.6; t.m.dmgMul *= 1.4; }),
    ],
    sniper: [
      A('heavy', { uk: 'Важка куля', en: 'Heavy round' }, { uk: '+40% шкоди', en: '+40% damage' }, t => t.m.dmgMul *= 1.4),
      A('aim', { uk: 'Швидке наведення', en: 'Fast aim' }, { uk: '-40% часу прицілювання', en: '-40% aim time' }, t => t.m.aimMul = (t.m.aimMul || 1) * 0.6),
      A('pierce', { uk: 'Проникнення', en: 'Piercing' }, { uk: 'Куля прошиває ще 2 цілі', en: 'Shot pierces 2 more targets' }, t => t.m.pierce = 2),
      A('head', { uk: 'Хедшот', en: 'Headshot' }, { uk: '25% шанс крит x2.5', en: '25% crit chance x2.5' }, t => t.m.crit = { ch: 0.25, mul: 2.5 }),
      A('rail', { uk: 'УЛЬТ: Рейлган', en: 'ULT: Railgun' }, { uk: '+100% шкоди, прошиває лінію', en: '+100% damage, pierces line' }, t => { t.m.dmgMul *= 2; t.m.pierce = 99; }),
    ],
    cannon: [
      A('boom', { uk: 'Біг-бум', en: 'Big boom' }, { uk: '+45% радіуса вибуху', en: '+45% blast radius' }, t => t.m.splashMul = (t.m.splashMul || 1) * 1.45),
      A('dmg', { uk: 'Фугаси', en: 'HE shells' }, { uk: '+30% шкоди', en: '+30% damage' }, t => t.m.dmgMul *= 1.3),
      A('shrap', { uk: 'Шрапнель', en: 'Shrapnel' }, { uk: 'Вибух розкидає 4 осколки', en: 'Blast throws 4 fragments' }, t => t.m.shrapnel = 4),
      A('rate', { uk: 'Автозаряд', en: 'Autoloader' }, { uk: '+30% темпу', en: '+30% fire rate' }, t => t.m.rateMul *= 1.3),
      A('clus', { uk: 'УЛЬТ: Касетний', en: 'ULT: Cluster' }, { uk: '+80% шкоди, +60% радіуса', en: '+80% damage, +60% radius' }, t => { t.m.dmgMul *= 1.8; t.m.splashMul = (t.m.splashMul || 1) * 1.6; }),
    ],
    freezing: [
      A('deep', { uk: 'Глибока заморозка', en: 'Deep freeze' }, { uk: '+12% сповільнення', en: '+12% slow' }, t => t.m.slowPlus = (t.m.slowPlus || 0) + 0.12),
      A('range', { uk: 'Кріо-поле', en: 'Cryo field' }, { uk: '+25% радіуса', en: '+25% radius' }, t => t.m.rangeMul *= 1.25),
      A('brit', { uk: 'Крихкість', en: 'Brittle' }, { uk: 'Вороги в радіусі отримують +20% шкоди', en: 'Enemies in radius take +20% damage' }, t => t.m.brittle = 0.2),
      A('perma', { uk: 'Вічна мерзлота', en: 'Permafrost' }, { uk: '+10% сповільнення і радіуса', en: '+10% slow and radius' }, t => { t.m.slowPlus = (t.m.slowPlus || 0) + 0.1; t.m.rangeMul *= 1.1; }),
      A('zero', { uk: 'УЛЬТ: Абсолютний нуль', en: 'ULT: Absolute zero' }, { uk: '+20% сповільнення, +35% вразливість', en: '+20% slow, +35% vulnerability' }, t => { t.m.slowPlus = (t.m.slowPlus || 0) + 0.2; t.m.brittle = Math.max(t.m.brittle || 0, 0.35); }),
    ],
    antiair: [
      A('dmg', { uk: 'Зенітні снаряди', en: 'Flak rounds' }, { uk: '+35% шкоди', en: '+35% damage' }, t => t.m.dmgMul *= 1.35),
      A('rate', { uk: 'Швидкий затвор', en: 'Fast breech' }, { uk: '+25% темпу', en: '+25% fire rate' }, t => t.m.rateMul *= 1.25),
      A('ign', { uk: 'Запальні', en: 'Incendiary' }, { uk: '30% шанс підпалити', en: '30% chance to ignite' }, t => t.m.ignite = 0.3),
      A('flak', { uk: 'Розривні', en: 'Explosive flak' }, { uk: 'Влучання вибухають (р. 0.8)', en: 'Hits explode (r 0.8)' }, t => t.m.flak = 0.8),
      A('sky', { uk: 'УЛЬТ: Зачистка неба', en: 'ULT: Skysweep' }, { uk: '+60% темпу, завжди підпалює', en: '+60% rate, always ignites' }, t => { t.m.rateMul *= 1.6; t.m.ignite = 1; }),
    ],
    splash: [
      A('more', { uk: 'Ще стволи', en: 'More barrels' }, { uk: '+4 снаряди в залпі', en: '+4 projectiles per burst' }, t => t.m.radialPlus = (t.m.radialPlus || 0) + 4),
      A('dmg', { uk: 'Важкий дріб', en: 'Heavy shot' }, { uk: '+30% шкоди', en: '+30% damage' }, t => t.m.dmgMul *= 1.3),
      A('cold', { uk: 'По холодних', en: 'Cold bonus' }, { uk: '+80% шкоди по сповільнених', en: '+80% vs slowed' }, t => t.m.coldBonus = 0.8),
      A('rate', { uk: 'Барабан', en: 'Drum feed' }, { uk: '+30% темпу', en: '+30% fire rate' }, t => t.m.rateMul *= 1.3),
      A('storm', { uk: 'УЛЬТ: Шторм', en: 'ULT: Storm' }, { uk: '+8 снарядів, +50% шкоди', en: '+8 projectiles, +50% damage' }, t => { t.m.radialPlus = (t.m.radialPlus || 0) + 8; t.m.dmgMul *= 1.5; }),
    ],
    blast: [
      A('dmg', { uk: 'Потужний заряд', en: 'Heavy charge' }, { uk: '+35% шкоди', en: '+35% damage' }, t => t.m.dmgMul *= 1.35),
      A('rad', { uk: 'Широка нова', en: 'Wide nova' }, { uk: '+25% радіуса', en: '+25% radius' }, t => t.m.rangeMul *= 1.25),
      A('stun', { uk: 'Контузія', en: 'Concussion' }, { uk: '+0.7с оглушення і відкидання', en: '+0.7s stun and knockback' }, t => { t.m.stunPlus = (t.m.stunPlus || 0) + 0.7; t.m.knock = 26; }),
      A('rate', { uk: 'Конденсатори', en: 'Capacitors' }, { uk: '+35% темпу', en: '+35% fire rate' }, t => t.m.rateMul *= 1.35),
      A('nova', { uk: 'УЛЬТ: Супернова', en: 'ULT: Supernova' }, { uk: '+80% шкоди, +50% радіуса, стан 1.5с', en: '+80% dmg, +50% radius, 1.5s stun' }, t => { t.m.dmgMul *= 1.8; t.m.rangeMul *= 1.5; t.m.stunPlus = (t.m.stunPlus || 0) + 0.9; t.m.knock = 40; }),
    ],
    multishot: [
      A('more', { uk: "П'ятий ствол", en: 'Fifth barrel' }, { uk: '+1 снаряд у віялі', en: '+1 projectile in fan' }, t => t.m.countPlus = (t.m.countPlus || 0) + 1),
      A('dmg', { uk: 'Гострі наконечники', en: 'Sharp tips' }, { uk: '+30% шкоди', en: '+30% damage' }, t => t.m.dmgMul *= 1.3),
      A('pen', { uk: 'Проникнення', en: 'Penetration' }, { uk: 'Снаряди прошивають 2 цілі', en: 'Shots pierce 2 targets' }, t => t.m.pierce = 2),
      A('gold', { uk: 'Мисливець за головами', en: 'Bounty hunter' }, { uk: '+25% монет з убивств', en: '+25% coins from kills' }, t => t.m.bounty = 0.25),
      A('fan', { uk: 'УЛЬТ: Віяло смерті', en: 'ULT: Death fan' }, { uk: '+4 снаряди, +40% шкоди', en: '+4 projectiles, +40% damage' }, t => { t.m.countPlus = (t.m.countPlus || 0) + 4; t.m.dmgMul *= 1.4; }),
    ],
    minigun: [
      A('dmg', { uk: 'Бронебійні', en: 'AP rounds' }, { uk: '+30% шкоди', en: '+30% damage' }, t => t.m.dmgMul *= 1.3),
      A('spin', { uk: 'Турбо-привід', en: 'Turbo drive' }, { uk: 'Вдвічі швидша розкрутка', en: '2x faster spin-up' }, t => t.m.spinMul = 2),
      A('ign', { uk: 'Розпечені', en: 'Hot rounds' }, { uk: 'На максимумі підпалює', en: 'Ignites at max speed' }, t => t.m.maxIgnite = true),
      A('max', { uk: 'Форсаж', en: 'Overclock' }, { uk: '+3 до макс. темпу', en: '+3 max fire rate' }, t => t.m.maxRatePlus = (t.m.maxRatePlus || 0) + 3),
      A('shred', { uk: 'УЛЬТ: Шредер', en: 'ULT: Shredder' }, { uk: '+100% макс. темпу, +50% шкоди', en: '+100% max rate, +50% damage' }, t => { t.m.maxRateMul = (t.m.maxRateMul || 1) * 2; t.m.dmgMul *= 1.5; }),
    ],
    venom: [
      A('dps', { uk: 'Концентрат', en: 'Concentrate' }, { uk: '+60% шкоди отрути', en: '+60% poison damage' }, t => t.m.pMul = (t.m.pMul || 1) * 1.6),
      A('rate', { uk: 'Насос', en: 'Pump' }, { uk: '+30% темпу', en: '+30% fire rate' }, t => t.m.rateMul *= 1.3),
      A('stack', { uk: 'Передоз', en: 'Overdose' }, { uk: '+2 стаки, +2с тривалості', en: '+2 stacks, +2s duration' }, t => { t.m.pStacks = (t.m.pStacks || 0) + 2; t.m.pDur = (t.m.pDur || 0) + 2; }),
      A('slow', { uk: "Нейротоксин", en: 'Neurotoxin' }, { uk: 'Отрута сповільнює на 25%', en: 'Poison slows by 25%' }, t => t.m.pSlow = 0.25),
      A('plag', { uk: 'УЛЬТ: Чума', en: 'ULT: Plague' }, { uk: '+200% шкоди, +100% тривалості', en: '+200% damage, +100% duration' }, t => { t.m.pMul = (t.m.pMul || 1) * 3; t.m.pDurMul = (t.m.pDurMul || 1) * 2; }),
    ],
    tesla: [
      A('dmg', { uk: 'Висока напруга', en: 'High voltage' }, { uk: '+35% шкоди', en: '+35% damage' }, t => t.m.dmgMul *= 1.35),
      A('jump', { uk: 'Розрядник', en: 'Discharger' }, { uk: '+2 стрибки блискавки', en: '+2 chain jumps' }, t => t.m.jumpsPlus = (t.m.jumpsPlus || 0) + 2),
      A('stun', { uk: 'Шокер', en: 'Stunner' }, { uk: 'Влучання оглушують на 0.3с', en: 'Hits stun for 0.3s' }, t => t.m.tStun = 0.3),
      A('rate', { uk: 'Трансформатор', en: 'Transformer' }, { uk: '+35% темпу', en: '+35% fire rate' }, t => t.m.rateMul *= 1.35),
      A('storm', { uk: 'УЛЬТ: Володар шторму', en: 'ULT: Stormlord' }, { uk: '+80% шкоди, +4 стрибки', en: '+80% damage, +4 jumps' }, t => { t.m.dmgMul *= 1.8; t.m.jumpsPlus = (t.m.jumpsPlus || 0) + 4; t.m.falloff = 0.85; }),
    ],
    missile: [
      A('dmg', { uk: 'Важкі БЧ', en: 'Heavy warheads' }, { uk: '+40% шкоди', en: '+40% damage' }, t => t.m.dmgMul *= 1.4),
      A('rate', { uk: 'Пускова установка', en: 'Launcher' }, { uk: '+30% темпу', en: '+30% fire rate' }, t => t.m.rateMul *= 1.3),
      A('big', { uk: 'Великий калібр', en: 'Big caliber' }, { uk: '+60% радіуса вибуху', en: '+60% blast radius' }, t => t.m.splashMul = (t.m.splashMul || 1) * 1.6),
      A('exec', { uk: 'Перший удар', en: 'First strike' }, { uk: "+60% шкоди по цілях з повним HP", en: '+60% vs full-HP targets' }, t => t.m.execute = 0.6),
      A('barr', { uk: 'УЛЬТ: Залп', en: 'ULT: Barrage' }, { uk: 'Випускає 3 ракети', en: 'Fires 3 missiles' }, t => t.m.barrage = 3),
    ],
    flame: [
      A('dps', { uk: 'Напалм', en: 'Napalm' }, { uk: '+40% шкоди струменя', en: '+40% stream damage' }, t => t.m.dmgMul *= 1.4),
      A('len', { uk: 'Довгий струмінь', en: 'Long jet' }, { uk: '+30% довжини', en: '+30% length' }, t => t.m.rangeMul *= 1.3),
      A('cold', { uk: 'Холодний вогонь', en: 'Cold fire' }, { uk: 'Підпал ще й сповільнює на 30%', en: 'Burn also slows 30%' }, t => t.m.coldFire = 0.3),
      A('burn', { uk: 'Терміт', en: 'Thermite' }, { uk: '+100% шкоди підпалу', en: '+100% burn damage' }, t => t.m.bMul = (t.m.bMul || 1) * 2),
      A('inf', { uk: 'УЛЬТ: Інферно', en: 'ULT: Inferno' }, { uk: '+80% шкоди, +40% конуса', en: '+80% damage, +40% cone' }, t => { t.m.dmgMul *= 1.8; t.m.rangeMul *= 1.4; }),
    ],
    laser: [
      A('dmg', { uk: 'Фокусування', en: 'Focusing' }, { uk: '+40% шкоди', en: '+40% damage' }, t => t.m.dmgMul *= 1.4),
      A('chg', { uk: 'Швидкий заряд', en: 'Fast charge' }, { uk: '-30% часу заряду', en: '-30% charge time' }, t => t.m.chargeMul = (t.m.chargeMul || 1) * 0.7),
      A('ign', { uk: 'Висока частота', en: 'High frequency' }, { uk: 'Промінь підпалює', en: 'Beam ignites' }, t => t.m.lIgnite = true),
      A('rot', { uk: 'Батареї', en: 'Batteries' }, { uk: 'Швидке обертання під час стрільби', en: 'Fast rotation while firing' }, t => t.m.lRot = true),
      A('death', { uk: 'УЛЬТ: Промінь смерті', en: 'ULT: Deathray' }, { uk: '+100% шкоди, прошиває всіх', en: '+100% damage, pierces all' }, t => { t.m.dmgMul *= 2; t.m.lPierce = 0.7; }),
    ],
    gauss: [
      A('dmg', { uk: 'Потужні котушки', en: 'Heavy coils' }, { uk: '+40% шкоди', en: '+40% damage' }, t => t.m.dmgMul *= 1.4),
      A('rate', { uk: 'Експрес-заряд', en: 'Express charge' }, { uk: '+35% темпу', en: '+35% fire rate' }, t => t.m.rateMul *= 1.35),
      A('stun', { uk: 'ЕМП', en: 'EMP' }, { uk: 'Постріл оглушує на 1с', en: 'Shot stuns for 1s' }, t => t.m.gStun = 1),
      A('rng', { uk: 'Далекобійність', en: 'Long range' }, { uk: '+25% дальності', en: '+25% range' }, t => t.m.rangeMul *= 1.25),
      A('ann', { uk: 'УЛЬТ: Анігіляція', en: 'ULT: Annihilation' }, { uk: '+120% шкоди, подвійний постріл', en: '+120% damage, double shot' }, t => { t.m.dmgMul *= 2.2; t.m.gDouble = true; }),
    ],
    crusher: [
      A('dps', { uk: 'Гострі жорна', en: 'Sharp grinders' }, { uk: '+40% шкоди', en: '+40% damage' }, t => t.m.dmgMul *= 1.4),
      A('hold', { uk: 'Лещата', en: 'Vise' }, { uk: '+1.5с утримання', en: '+1.5s hold time' }, t => t.m.holdPlus = (t.m.holdPlus || 0) + 1.5),
      A('arm', { uk: 'Третя клешня', en: 'Third claw' }, { uk: '+1 захоплення', en: '+1 grab slot' }, t => t.m.armsPlus = (t.m.armsPlus || 0) + 1),
      A('grind', { uk: 'Шліфовка', en: 'Grinding' }, { uk: 'Боси сповільнюються на 60%', en: 'Bosses slowed 60%' }, t => t.m.bossSlow = 0.6),
      A('maw', { uk: 'УЛЬТ: Паща', en: 'ULT: Maw' }, { uk: '+80% шкоди, +2 клешні', en: '+80% damage, +2 claws' }, t => { t.m.dmgMul *= 1.8; t.m.armsPlus = (t.m.armsPlus || 0) + 2; }),
    ],
    heli: [
      A('dmg', { uk: 'Бортові гармати', en: 'Door guns' }, { uk: '+40% шкоди дронів', en: '+40% drone damage' }, t => t.m.dmgMul *= 1.4),
      A('dr', { uk: 'Третій борт', en: 'Third chopper' }, { uk: '+1 вертоліт', en: '+1 helicopter' }, t => t.m.dronesPlus = (t.m.dronesPlus || 0) + 1),
      A('rate', { uk: 'Екіпажі аси', en: 'Ace crews' }, { uk: '+35% темпу дронів', en: '+35% drone fire rate' }, t => t.m.rateMul *= 1.35),
      A('mis', { uk: 'НУРСи', en: 'Rockets' }, { uk: 'Постріли вибухають (р. 0.7)', en: 'Shots explode (r 0.7)' }, t => t.m.dSplash = 0.7),
      A('wing', { uk: 'УЛЬТ: Ескадрилья', en: 'ULT: Squadron' }, { uk: '+2 вертольоти, +60% шкоди', en: '+2 helicopters, +60% damage' }, t => { t.m.dronesPlus = (t.m.dronesPlus || 0) + 2; t.m.dmgMul *= 1.6; }),
    ],
    plasma: [
      A('dmg', { uk: 'Гаряча плазма', en: 'Hot plasma' }, { uk: '+40% шкоди', en: '+40% damage' }, t => t.m.dmgMul *= 1.4),
      A('rate', { uk: 'Прискорювач', en: 'Accelerator' }, { uk: '+30% темпу', en: '+30% fire rate' }, t => t.m.rateMul *= 1.3),
      A('burst', { uk: 'Вибухова плазма', en: 'Burst plasma' }, { uk: 'Згустки вибухають (р. 0.7)', en: 'Orbs explode (r 0.7)' }, t => t.m.pSplash = 0.7),
      A('multi', { uk: 'Подвійний залп', en: 'Double volley' }, { uk: '+1 згусток за постріл', en: '+1 orb per shot' }, t => t.m.pMulti = (t.m.pMulti || 1) + 1),
      A('sun', { uk: 'УЛЬТ: Сонце', en: 'ULT: Sun' }, { uk: '+80% шкоди, +2 згустки', en: '+80% damage, +2 orbs' }, t => { t.m.dmgMul *= 1.8; t.m.pMulti = (t.m.pMulti || 1) + 2; }),
    ],
    miner: [
      A('rich', { uk: 'Багата жила', en: 'Rich vein' }, { uk: '+60% доходу', en: '+60% income' }, t => t.m.incMul = (t.m.incMul || 1) * 1.6),
      A('eff', { uk: 'Ефективність', en: 'Efficiency' }, { uk: 'Тік кожні 3.5с', en: 'Tick every 3.5s' }, t => t.m.tickMul = (t.m.tickMul || 1) * 0.7),
      A('deep', { uk: 'Глибока шахта', en: 'Deep shaft' }, { uk: '+60% доходу', en: '+60% income' }, t => t.m.incMul = (t.m.incMul || 1) * 1.6),
      A('auto', { uk: 'Автонавантажувач', en: 'Autoloader' }, { uk: 'Тік кожні 3с', en: 'Tick every 3s' }, t => t.m.tickMul = (t.m.tickMul || 1) * 0.6),
      A('moth', { uk: 'УЛЬТ: Материнська жила', en: 'ULT: Motherlode' }, { uk: '+150% доходу', en: '+150% income' }, t => t.m.incMul = (t.m.incMul || 1) * 2.5),
    ],
  };

  const ENEMIES = {
    regular: { hp: 30,  speed: 1.1,  reward: 6,  flying: false, r: 13, color: '#4ade80', armor: 0, dmg: 1, name: { uk: 'Звичайний', en: 'Regular' } },
    fast:    { hp: 18,  speed: 2.0,  reward: 6,  flying: false, r: 11, color: '#facc15', armor: 0, dmg: 1, name: { uk: 'Швидкий', en: 'Fast' } },
    strong:  { hp: 130, speed: 0.8,  reward: 12, flying: false, r: 16, color: '#fb923c', armor: 0, dmg: 2, name: { uk: 'Сильний', en: 'Strong' } },
    armored: { hp: 95,  speed: 0.9,  reward: 14, flying: false, r: 14, color: '#94a3b8', armor: 3, dmg: 2, name: { uk: 'Броньований', en: 'Armored' } },
    healer:  { hp: 75,  speed: 0.9,  reward: 16, flying: false, r: 13, color: '#f0abfc', armor: 0, dmg: 1, heal: 12, name: { uk: 'Лікар', en: 'Healer' } },
    toxic:   { hp: 65,  speed: 1.35, reward: 12, flying: false, r: 13, color: '#a3e635', armor: 0, dmg: 1, poisonImmune: true, name: { uk: 'Токсик', en: 'Toxic' } },
    icy:     { hp: 90,  speed: 0.85, reward: 15, flying: false, r: 14, color: '#bae6fd', armor: 0, dmg: 2, chill: 0.3, name: { uk: 'Крижаний', en: 'Icy' } },
    fighter: { hp: 48,  speed: 1.7,  reward: 13, flying: false, r: 12, color: '#f87171', armor: 0, dmg: 1, dodge: 0.25, name: { uk: 'Боєць', en: 'Fighter' } },
    light:   { hp: 38,  speed: 2.3,  reward: 14, flying: false, r: 10, color: '#fef08a', armor: 0, dmg: 1, slowRes: 0.7, name: { uk: 'Світляк', en: 'Light' } },
    heli:    { hp: 110, speed: 1.0,  reward: 18, flying: true,  r: 15, color: '#fdba74', armor: 0, dmg: 2, name: { uk: 'Вертоліт', en: 'Heli' } },
    jet:     { hp: 75,  speed: 2.6,  reward: 20, flying: true,  r: 12, color: '#e879f9', armor: 0, dmg: 2, name: { uk: 'Винищувач', en: 'Jet' } },
    boss:    { hp: 4200, speed: 0.55, reward: 300, flying: false, r: 30, color: '#ef4444', armor: 5, dmg: 5, boss: true, stunImmune: true, name: { uk: 'ГРОМІЛА (бос)', en: 'BRUTE (boss)' } },
    splitter:{ hp: 55, speed: 1.2, reward: 9, flying: false, r: 13, color: '#4dd0a6', armor: 0, dmg: 1, split: 'fast', splitN: 2, name: { uk: 'Роздвоювач', en: 'Splitter' } },
    broot:   { hp: 5200, speed: 0.6, reward: 380, flying: false, r: 30, color: '#a06bff', armor: 4, dmg: 8, boss: true, stunImmune: true, spawner: { type: 'fast', n: 4, at: [0.66, 0.33, 0] }, name: { uk: 'БРУТ (бос)', en: 'BROOT (boss)' } },
    constr:  { hp: 6500, speed: 0.5, reward: 450, flying: false, r: 32, color: '#ffa53c', armor: 6, dmg: 10, boss: true, stunImmune: true, spawner: { type: 'strong', n: 5, at: [0.75, 0.5, 0.25] }, name: { uk: 'КОНСТРУКТОР (бос)', en: 'CONSTRUCTOR (boss)' } },
    metaphor:{ hp: 8000, speed: 0.48, reward: 600, flying: false, r: 32, color: '#e8ecff', armor: 5, dmg: 20, boss: true, stunImmune: true, disable: true, healerImmune: true, name: { uk: 'МЕТАФОРА (бос)', en: 'METAPHOR (boss)' } },
  };

  function bossFor(w) {
    const order = ['boss', 'broot', 'constr', 'metaphor'];
    if (w > 30) return order[Math.floor(w / 5) % 4];
    return order[((Math.floor(w / 10) - 1) % 4 + 4) % 4];
  }
  function hpMul(w) {
    return 1 + (w - 1) * 0.22 + Math.max(0, w - 20) * 0.12 + Math.max(0, w - 30) * 0.6;
  }
  function spdMul(w) { return Math.min(1.35, 1 + w * 0.008); }
  function rewardMul(w) { return 1 + w * 0.015; }

  // Wave composition. Returns {groups:[{type,count,gap,delay}], boss:n, bonus}
  function genWave(w) {
    const G = [];
    const bossWave = w % 10 === 0;
    const push = (type, count, gap, delay) => { if (count > 0) G.push({ type, count, gap, delay: delay || 0 }); };
    if (w === 1) push('regular', 8, 1.1, 0.5);
    else if (w === 2) { push('regular', 12, 0.9, 0.5); }
    else if (w === 3) { push('regular', 10, 0.8, 0.3); push('fast', 6, 0.7, 3); }
    else if (w === 4) { push('fast', 14, 0.6, 0.3); push('regular', 8, 0.7, 2); }
    else if (w === 5) { push('strong', 5, 1.4, 0.5); push('regular', 12, 0.6, 1); }
    else if (w === 6) { push('armored', 6, 1.2, 0.5); push('fast', 12, 0.55, 1); push('splitter', 5, 0.9, 2); }
    else if (w === 7) { push('strong', 8, 1.1, 0.3); push('fast', 14, 0.5, 1); }
    else if (w === 8) { push('heli', 5, 1.6, 0.5); push('regular', 14, 0.55, 0.5); }
    else if (w === 9) { push('armored', 10, 0.9, 0.3); push('strong', 6, 1.0, 2); push('fast', 12, 0.45, 3); }
    else if (w === 11) { push('healer', 4, 2.0, 4); push('strong', 10, 0.9, 0.3); push('regular', 16, 0.45, 0); push('splitter', 8, 0.7, 2); }
    else if (w === 12) { push('toxic', 12, 0.7, 0.3); push('fast', 16, 0.4, 1); }
    else if (w === 13) { push('heli', 8, 1.1, 0.3); push('armored', 10, 0.8, 1); }
    else if (w === 14) { push('jet', 8, 0.9, 0.5); push('fast', 18, 0.35, 0.5); }
    else if (w === 15) { push('strong', 12, 0.8, 0.2); push('healer', 5, 1.8, 3); push('armored', 10, 0.7, 1); }
    else if (w === 16) { push('icy', 10, 0.9, 0.3); push('strong', 10, 0.8, 1); push('splitter', 10, 0.6, 2); }
    else if (w === 17) { push('fighter', 16, 0.55, 0.3); push('fast', 16, 0.35, 1); }
    else if (w === 18) { push('heli', 10, 0.9, 0.2); push('jet', 8, 0.7, 2); push('armored', 8, 0.8, 1); }
    else if (w === 19) { push('toxic', 16, 0.5, 0.2); push('icy', 10, 0.7, 1); push('strong', 10, 0.7, 2); }
    else if (w === 21) { push('light', 18, 0.4, 0.3); push('fighter', 14, 0.5, 1); }
    else if (w === 22) { push('jet', 14, 0.55, 0.2); push('heli', 8, 0.9, 1); push('light', 12, 0.4, 2); }
    else if (w === 23) { push('armored', 18, 0.55, 0.2); push('healer', 6, 1.5, 3); push('strong', 12, 0.6, 1); }
    else if (w === 24) { push('icy', 16, 0.5, 0.2); push('toxic', 16, 0.45, 1); push('fighter', 14, 0.45, 2); }
    else if (w === 25) { push('heli', 14, 0.6, 0.2); push('jet', 14, 0.5, 1); push('light', 16, 0.35, 0.5); }
    else if (w === 26) { push('strong', 20, 0.5, 0.2); push('armored', 16, 0.5, 1); push('healer', 6, 1.4, 3); }
    else if (w === 27) { push('fighter', 22, 0.38, 0.2); push('light', 20, 0.32, 1); push('jet', 12, 0.5, 2); }
    else if (w === 28) { push('icy', 18, 0.45, 0.2); push('toxic', 20, 0.4, 1); push('armored', 16, 0.5, 2); }
    else if (w === 29) { push('strong', 22, 0.45, 0.1); push('heli', 12, 0.6, 1); push('healer', 8, 1.2, 3); push('fighter', 18, 0.35, 2); }
    else if (bossWave && w <= 30) {
      const n = w / 10;
      push(bossFor(w), n, 6, 2);
      push('healer', 3 + n, 2, 5);
      push(n >= 2 ? 'armored' : 'strong', 12, 0.6, 0.2);
      push('fast', 14, 0.4, 1);
      if (n >= 3) { push('jet', 10, 0.6, 4); push('heli', 8, 0.8, 5); }
    } else if (w > 30) {
      // ENDLESS: scaling chaos
      const k = w - 30;
      const pool = ['regular', 'fast', 'strong', 'armored', 'healer', 'toxic', 'icy', 'fighter', 'light', 'heli', 'jet', 'splitter'];
      const nGroups = 4 + Math.min(3, Math.floor(k / 4));
      for (let i = 0; i < nGroups; i++) {
        const type = pool[(w + i * 3) % pool.length];
        push(type, 14 + Math.min(30, k * 2), Math.max(0.22, 0.5 - k * 0.01), i * 1.2);
      }
      if (w % 5 === 0) push(bossFor(w), 1 + Math.floor(k / 10), 7, 3);
    }
    const bonus = Math.round(30 + w * 4);
    return { groups: G, boss: bossWave || (w > 30 && w % 5 === 0), bonus };
  }

  const MAPS = [
    { id: 'valley', name: { uk: 'Зелена долина', en: 'Green Valley' }, bg: 'assets/img/bg-map1.png', accent: '#39f5c8',
      desc: { uk: 'Класичний серпантин. Ідеально для старту.', en: 'Classic serpent. Perfect to start.' },
      wp: [[-1, 2], [5, 2], [5, 8], [10, 8], [10, 2], [15, 2], [15, 8], [20, 8]], crystals: [[1, 0], [18, 0], [1, 11], [18, 11]] },
    { id: 'desert', name: { uk: 'Піщаний вир', en: 'Sand Vortex' }, bg: 'assets/img/bg-map2.png', accent: '#ffb52e',
      desc: { uk: 'Спіраль до центральної бази. Довгий шлях.', en: 'Spiral into the central base. Long road.' },
      wp: [[-1, 10], [3, 10], [3, 2], [16, 2], [16, 6], [7, 6], [7, 8], [13, 8], [13, 5], [10, 5]], crystals: [[0, 0], [19, 0], [19, 11], [0, 4]] },
    { id: 'arctic', name: { uk: 'Арктична ніч', en: 'Arctic Night' }, bg: 'assets/img/bg-map3.png', accent: '#7db4ff',
      desc: { uk: 'Зигзаг на всю мапу. Максимум часу для веж.', en: 'Full-map zigzag. Maximum tower uptime.' },
      wp: [[-1, 1], [18, 1], [18, 4], [1, 4], [1, 7], [18, 7], [18, 10], [20, 10]], crystals: [[0, 0], [19, 0], [0, 11], [10, 11]] },
    { id: 'volcano', name: { uk: 'Вулкан', en: 'Volcano' }, bg: 'assets/img/bg-map4.png', accent: '#ff6b4a',
      desc: { uk: 'Лавові потоки і круті повороти.', en: 'Lava flows and sharp turns.' },
      wp: [[-1, 5], [4, 5], [4, 1], [9, 1], [9, 10], [14, 10], [14, 4], [20, 4]], crystals: [[1, 0], [18, 0], [1, 11], [18, 11]] },
    { id: 'caves', name: { uk: 'Кристалові печери', en: 'Crystal Caves' }, bg: 'assets/img/bg-map5.png', accent: '#5ef2d8',
      desc: { uk: 'Довга змія. Рай для майнерів.', en: 'Long snake. Miner paradise.' },
      wp: [[-1, 1], [6, 1], [6, 5], [2, 5], [2, 9], [11, 9], [11, 3], [16, 3], [16, 10], [20, 10]], crystals: [[0, 0], [19, 0], [0, 11], [10, 11]] },
    { id: 'storm', name: { uk: 'Штормовий пік', en: 'Storm Peak' }, bg: 'assets/img/bg-map6.png', accent: '#c7f464',
      desc: { uk: 'Атака з неба прямо в серце бази.', en: 'Attack from the sky into the base heart.' },
      wp: [[10, -1], [10, 3], [5, 3], [5, 8], [15, 8], [15, 5], [12, 5]], crystals: [[0, 0], [19, 0], [0, 11], [19, 11]] },
  ];

  function buildPath(wp) {
    const pts = wp.map(([c, r]) => ({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE }));
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }
    const tiles = new Set();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (TILE / 4));
      for (let s = 0; s <= steps; s++) {
        const x = a.x + ((b.x - a.x) * s) / steps, y = a.y + ((b.y - a.y) * s) / steps;
        const c = Math.floor(x / TILE), r = Math.floor(y / TILE);
        if (c >= 0 && c < COLS && r >= 0 && r < ROWS) tiles.add(c + ',' + r);
      }
    }
    const first = wp[0], last = wp[wp.length - 1];
    return {
      pts, cum, total: cum[cum.length - 1], tiles,
      portal: { x: pts[0].x, y: pts[0].y, c: Math.max(0, first[0]), r: first[1] },
      base: { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y, c: Math.min(COLS - 1, last[0]), r: last[1] },
    };
  }
  function posAt(path, dist) {
    const d = Math.max(0, Math.min(dist, path.total));
    let i = 1;
    while (i < path.cum.length - 1 && path.cum[i] < d) i++;
    const segLen = path.cum[i] - path.cum[i - 1] || 1;
    const t = (d - path.cum[i - 1]) / segLen;
    const a = path.pts[i - 1], b = path.pts[i];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  const xpNeed = (level) => Math.round(50 * Math.pow(level, 1.6));
  const upCost = (def, level) => Math.round(def.cost * (0.5 + 0.35 * level));
  const PRIORITIES = ['first', 'last', 'strong', 'weak', 'fast', 'close'];

  const RESEARCH = [
    { id: 'dmg', max: 5, costs: [1, 2, 3, 4, 6], name: { uk: 'Шкода +8%/рів', en: 'Damage +8%/lvl' }, desc: { uk: 'Всі турелі б’ють сильніше', en: 'All turrets hit harder' }, icon: 'i-dmg' },
    { id: 'rate', max: 5, costs: [1, 2, 3, 4, 6], name: { uk: 'Темп +6%/рів', en: 'Rate +6%/lvl' }, desc: { uk: 'Швидша стрільба', en: 'Faster shooting' }, icon: 'i-rate' },
    { id: 'range', max: 5, costs: [1, 2, 3, 4, 5], name: { uk: 'Дальність +5%/рів', en: 'Range +5%/lvl' }, desc: { uk: 'Більший радіус веж', en: 'Bigger tower radius' }, icon: 'i-range' },
    { id: 'econ', max: 5, costs: [1, 1, 2, 3, 4], name: { uk: '+60 монет на старті', en: '+60 starting coins' }, desc: { uk: 'Більше грошей на початку', en: 'More money at start' }, icon: 'i-coin' },
    { id: 'lives', max: 3, costs: [2, 3, 5], name: { uk: '+2 життя', en: '+2 lives' }, desc: { uk: 'Міцніша база', en: 'Tougher base' }, icon: 'i-heart' },
    { id: 'disc', max: 5, costs: [1, 2, 3, 4, 5], name: { uk: 'Знижка 4%/рів', en: 'Discount 4%/lvl' }, desc: { uk: 'Дешевші турелі', en: 'Cheaper turrets' }, icon: 'i-disc' },
    { id: 'xp', max: 3, costs: [2, 3, 4], name: { uk: 'Досвід +15%/рів', en: 'XP +15%/lvl' }, desc: { uk: 'Швидше левелап веж', en: 'Faster tower level-ups' }, icon: 'i-xp' },
    { id: 'heli', max: 3, costs: [2, 3, 4], name: { uk: 'Удар з неба −10с', en: 'Airstrike −10s' }, desc: { uk: 'Швидший кулдаун вертольота', en: 'Faster heli cooldown' }, icon: 'i-heli' },
    { id: 'crit', max: 5, costs: [2, 3, 4, 5, 7], name: { uk: 'Крит +3%/рів', en: 'Crit +3%/lvl' }, desc: { uk: 'Шанс криту x2 всім турелям', en: 'Crit x2 chance for all turrets' }, icon: 'i-crit' },
    { id: 'miner', max: 5, costs: [1, 2, 3, 4, 5], name: { uk: 'Майнинг +20%/рів', en: 'Mining +20%/lvl' }, desc: { uk: 'Більше доходу з майнерів', en: 'More miner income' }, icon: 'i-miner' },
    { id: 'bossdmg', max: 3, costs: [3, 4, 6], name: { uk: '+12% по босам', en: '+12% vs bosses' }, desc: { uk: 'Всі б’ють босів сильніше', en: 'Everyone hits bosses harder' }, icon: 'i-en-boss' },
    { id: 'nano', max: 5, costs: [5, 10, 20, 35, 50], cur: 'cry', name: { uk: 'Нано-зброя +5%/рів', en: 'Nano-weapons +5%/lvl' }, desc: { uk: 'Шкода всіх турелей (за кристали)', en: 'All-turret damage (for crystals)' }, icon: 'i-nano' },
    { id: 'greed', max: 5, costs: [5, 10, 20, 35, 50], cur: 'cry', name: { uk: 'Жадібність +8%/рів', en: 'Greed +8%/lvl' }, desc: { uk: 'Більше монет з усього (за кристали)', en: 'More coins from everything (for crystals)' }, icon: 'i-greed' },
  ];
  function researchFx(levels, prestige) {
    const L = (id) => (levels && levels[id]) || 0;
    const P = prestige || 0;
    return {
      dmgMul: (1 + 0.08 * L('dmg')) * (1 + 0.05 * L('nano')) * (1 + 0.02 * P),
      rateMul: 1 + 0.06 * L('rate'), rangeMul: 1 + 0.05 * L('range'),
      startCoins: 450 + 60 * L('econ'), maxLives: 20 + 2 * L('lives'),
      discount: Math.max(0.8, 1 - 0.04 * L('disc')), xpMul: 1 + 0.15 * L('xp'),
      heliCd: 60 - 10 * L('heli'),
      critCh: 0.03 * L('crit'), bossDmgMul: 1 + 0.12 * L('bossdmg'),
      minerMul: 1 + 0.2 * L('miner'),
      coinMul: (1 + 0.08 * L('greed')) * (1 + 0.03 * P),
    };
  }

  const ACH = [
    { id: 'first_blood', xp: 20, rp: 1, name: { uk: 'Перша кров', en: 'First blood' }, desc: { uk: 'Знищ першого ворога', en: 'Destroy your first enemy' } },
    { id: 'wave5', xp: 30, rp: 1, name: { uk: 'Розігрів', en: 'Warm-up' }, desc: { uk: 'Пройди 5 хвиль', en: 'Clear 5 waves' } },
    { id: 'wave10', xp: 60, rp: 2, name: { uk: 'Мисливець на боса', en: 'Boss hunter' }, desc: { uk: 'Переможи першого боса', en: 'Beat the first boss' } },
    { id: 'wave20', xp: 100, rp: 2, name: { uk: 'Ветеран', en: 'Veteran' }, desc: { uk: 'Пройди 20 хвиль', en: 'Clear 20 waves' } },
    { id: 'wave30', xp: 200, rp: 4, name: { uk: 'Легенда оборони', en: 'Defense legend' }, desc: { uk: 'Пройди 30 хвиль', en: 'Clear 30 waves' } },
    { id: 'boss5', xp: 120, rp: 2, name: { uk: 'Гроза босів', en: 'Boss bane' }, desc: { uk: 'Знищ 5 босів', en: 'Destroy 5 bosses' } },
    { id: 'kills500', xp: 40, rp: 1, name: { uk: 'Сержант', en: 'Sergeant' }, desc: { uk: '500 убивств за гру', en: '500 kills in one game' } },
    { id: 'kills2500', xp: 100, rp: 2, name: { uk: 'Капітан', en: 'Captain' }, desc: { uk: '2500 убивств за гру', en: '2500 kills in one game' } },
    { id: 'rich', xp: 60, rp: 1, name: { uk: 'Магнат', en: 'Magnate' }, desc: { uk: 'Зароби 5000 монет за гру', en: 'Earn 5000 coins in one game' } },
    { id: 'builder16', xp: 120, rp: 2, name: { uk: 'Інженер', en: 'Engineer' }, desc: { uk: 'Побудуй всі 16 турелей за гру', en: 'Build all 16 turrets in one game' } },
    { id: 'maxlvl', xp: 80, rp: 2, name: { uk: 'Майстер веж', en: 'Tower master' }, desc: { uk: 'Прокачай вежу до 10 рівня', en: 'Level a tower to 10' } },
    { id: 'striker', xp: 60, rp: 1, name: { uk: 'Пілот', en: 'Pilot' }, desc: { uk: 'Виклич удар з неба 5 разів', en: 'Call 5 heli strikes' } },
    { id: 'tycoon', xp: 50, rp: 1, name: { uk: 'Шахтар', en: 'Tycoon' }, desc: { uk: '5 майнерів одночасно', en: '5 miners at once' } },
    { id: 'flawless', xp: 100, rp: 2, name: { uk: 'Ідеальна оборона', en: 'Flawless' }, desc: { uk: '10 хвиль поспіль без втрат', en: '10 waves in a row with no leaks' } },
    { id: 'win_all', xp: 250, rp: 5, name: { uk: 'Захисник світу', en: 'World defender' }, desc: { uk: 'Пройди всі 6 мап', en: 'Beat all 6 maps' } },
    { id: 'brutal', xp: 200, rp: 4, name: { uk: 'Незламний', en: 'Unbreakable' }, desc: { uk: 'Пройди 30 хвиль на Бруталі', en: 'Clear 30 waves on Brutal' } },
    { id: 'lvl20', xp: 150, rp: 3, name: { uk: 'Бог війни', en: 'God of war' }, desc: { uk: 'Прокачай вежу до 20 рівня', en: 'Level a tower to 20' } },
    { id: 'quest3', xp: 100, rp: 2, name: { uk: 'Герой квестів', en: 'Quest hero' }, desc: { uk: 'Виконай 3 квести за гру', en: 'Complete 3 quests in one game' } },
    { id: 'allboss', xp: 200, rp: 4, name: { uk: 'Вбивця титанів', en: 'Titan slayer' }, desc: { uk: 'Знищ усіх 4 босів', en: 'Destroy all 4 bosses' } },
    { id: 'stars18', xp: 250, rp: 5, name: { uk: 'Колекціонер зірок', en: 'Star collector' }, desc: { uk: 'Збери 18 зірок', en: 'Collect 18 stars' } },
    { id: 'prestige1', xp: 100, rp: 0, name: { uk: 'Переродження', en: 'Rebirth' }, desc: { uk: 'Візьми 1 рівень престижу', en: 'Gain 1 prestige level' } },
    { id: 'prime', xp: 300, rp: 5, name: { uk: 'Прайм', en: 'Prime' }, desc: { uk: 'Збери 1000 кубків', en: 'Collect 1000 trophies' } },
    { id: 'endless35', xp: 200, rp: 4, name: { uk: 'Нескінченність', en: 'Infinity' }, desc: { uk: 'Дійди до 35-ї хвилі', en: 'Reach wave 35' } },
  ];

  const MODIFIERS = [
    { id: 'normal', hp: 1, rw: 1, lives: 0, name: { uk: 'Норма', en: 'Normal' }, desc: { uk: 'Класичний баланс', en: 'Classic balance' } },
    { id: 'hard', hp: 1.4, rw: 1.3, lives: 0, name: { uk: 'Хард', en: 'Hard' }, desc: { uk: '+40% HP ворогів, +30% монет', en: '+40% enemy HP, +30% coins' } },
    { id: 'brutal', hp: 2.0, rw: 1.8, lives: -5, name: { uk: 'Брутал', en: 'Brutal' }, desc: { uk: 'x2 HP ворогів, −5 життів, +80% монет', en: 'x2 enemy HP, −5 lives, +80% coins' } },
  ];
  const GENERIC_AB = [
    A('gdmg', { uk: 'Перевантаження', en: 'Overcharge' }, { uk: '+30% шкоди', en: '+30% damage' }, t => t.m.dmgMul *= 1.3),
    A('grate', { uk: 'Форсаж систем', en: 'System overdrive' }, { uk: '+25% темпу', en: '+25% fire rate' }, t => t.m.rateMul *= 1.25),
    A('grange', { uk: 'Сенсори', en: 'Sensors' }, { uk: '+20% дальності', en: '+20% range' }, t => t.m.rangeMul *= 1.2),
  ];
  const ULTIMA = A('ultima', { uk: 'УЛЬТІМА', en: 'ULTIMA' }, { uk: '+50% шкоди, +30% темпу', en: '+50% damage, +30% rate' }, t => { t.m.dmgMul *= 1.5; t.m.rateMul *= 1.3; });
  // ev: kill|build|types|wave|boss|earn|upgrade|towerKill|mine|flawless|cry
  const QUESTS = [
    { id: 'q_kill250', ev: 'kill', need: 250, reward: { coins: 150 }, name: { uk: 'Зачистка', en: 'Extermination' }, desc: { uk: 'Знищ 250 ворогів', en: 'Destroy 250 enemies' } },
    { id: 'q_kill1200', ev: 'kill', need: 1200, reward: { coins: 400, rp: 1 }, name: { uk: 'Армагеддон', en: 'Armageddon' }, desc: { uk: 'Знищ 1200 ворогів', en: 'Destroy 1200 enemies' } },
    { id: 'q_build12', ev: 'build', need: 12, reward: { coins: 200 }, name: { uk: 'Будівельник', en: 'Builder' }, desc: { uk: 'Побудуй 12 веж', en: 'Build 12 towers' } },
    { id: 'q_types8', ev: 'types', need: 8, reward: { coins: 250 }, name: { uk: 'Арсенал', en: 'Arsenal' }, desc: { uk: 'Май 8 різних турелей', en: 'Own 8 different turrets' } },
    { id: 'q_wave15', ev: 'wave', need: 15, reward: { coins: 300, rp: 1 }, name: { uk: 'Довга оборона', en: 'Long defense' }, desc: { uk: 'Дійди до 15-ї хвилі', en: 'Reach wave 15' } },
    { id: 'q_boss1', ev: 'boss', need: 1, reward: { coins: 300, rp: 1 }, name: { uk: 'Мисливець', en: 'Hunter' }, desc: { uk: 'Вбий боса', en: 'Kill a boss' } },
    { id: 'q_earn3k', ev: 'earn', need: 3000, reward: { coins: 300 }, name: { uk: 'Бізнес', en: 'Business' }, desc: { uk: 'Зароби 3000 монет', en: 'Earn 3000 coins' } },
    { id: 'q_up10', ev: 'upgrade', need: 10, reward: { coins: 250 }, name: { uk: 'Інженер', en: 'Engineer' }, desc: { uk: '10 покращень веж', en: '10 tower upgrades' } },
    { id: 'q_tesla', ev: 'towerKill', with: 'tesla', need: 150, reward: { coins: 250, rp: 1 }, name: { uk: 'Електрик', en: 'Electrician' }, desc: { uk: '150 убивств теслою', en: '150 kills with Tesla' } },
    { id: 'q_mine', ev: 'mine', need: 800, reward: { coins: 200, cry: 2 }, name: { uk: 'Шахтар', en: 'Miner' }, desc: { uk: 'Видобудь 800 майнерами', en: 'Mine 800 with miners' } },
    { id: 'q_flaw5', ev: 'flawless', need: 5, reward: { coins: 300, rp: 1 }, name: { uk: 'Стіна', en: 'The Wall' }, desc: { uk: '5 хвиль без втрат поспіль', en: '5 no-leak waves in a row' } },
    { id: 'q_cry', ev: 'cry', need: 10, reward: { rp: 3 }, name: { uk: 'Кристалічне серце', en: 'Crystal heart' }, desc: { uk: 'Збери 10 кристалів', en: 'Collect 10 crystals' } },
  ];
  function pickQuests() {
    const pool = QUESTS.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    return pool.slice(0, 3).map(def => ({ def, prog: 0, done: false }));
  }

  // permanent per-tower upgrades (bought with trophies): +4% output per level, max 10
  const UPG_MAX = 10, UPG_PCT = 4;
  function upgCost(lv) { return 10 * (lv + 1); }
  // hue-shift a #rrggbb color by deg (tower colors evolve with trophies)
  const _shiftCache = new Map();
  function shiftColor(hex, deg) {
    if (!hex || hex[0] !== '#') return hex;
    deg = ((Math.round(deg * 10) / 10) % 360 + 360) % 360;
    if (deg === 0) return hex;
    const key = hex + '|' + deg;
    const hit = _shiftCache.get(key);
    if (hit) return hit;
    const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, st = 0; const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      st = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    const hue2 = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    let R, G, B;
    if (st === 0) { R = G = B = l; } else {
      const q = l < 0.5 ? l * (1 + st) : l + st - l * st, p = 2 * l - q, hk = (((h + deg) % 360) + 360) % 360 / 360;
      R = hue2(p, q, hk + 1 / 3); G = hue2(p, q, hk); B = hue2(p, q, hk - 1 / 3);
    }
    const to = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
    const out = '#' + to(R) + to(G) + to(B);
    if (_shiftCache.size > 2000) _shiftCache.clear();
    _shiftCache.set(key, out);
    return out;
  }

  const api = { TILE, COLS, ROWS, W, H, TOWERS, ABILITIES, ENEMIES, MAPS, RESEARCH, ACH, PRIORITIES,
    hpMul, spdMul, rewardMul, genWave, buildPath, posAt, xpNeed, upCost, researchFx,
    MODIFIERS, GENERIC_AB, ULTIMA, QUESTS, pickQuests, bossFor,
    UPG_MAX, UPG_PCT, upgCost, shiftColor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.BAL = api;
})();
