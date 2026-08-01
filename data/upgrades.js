export const UPGRADE_PRICES=Object.freeze([100,300,700,1500,3000]);
export const MAX_UPGRADE_LEVEL=5;

const upgrade=(id,shop,title,description,visualPrefix,effects)=>Object.freeze({
  id,shop,title,description,maxLevel:MAX_UPGRADE_LEVEL,prices:UPGRADE_PRICES,
  visualPrefix,effects:Object.freeze(effects)
});

export const UPGRADES=Object.freeze([
  upgrade("bucket_level","콩쥐 장비점","바가지 강화","정답 시 물 보상이 증가합니다.","bucket",{
    correctWaterBonus:[0,.08,.16,.26,.38,.5]
  }),
  upgrade("spoon_level","콩쥐 장비점","숟가락 강화","콤보 점수와 숟가락 공격 확률이 증가합니다.","spoon",{
    comboScoreBonus:[0,.08,.16,.24,.32,.4],spoonChance:[.2,.24,.28,.32,.36,.4]
  }),
  upgrade("jar_level","장독대 보강소","장독대 강화","최대·시작 물이 늘고 누수가 감소합니다.","jar",{
    maxWaterBonus:[0,5,10,15,20,25],startWaterBonus:[0,3,6,9,12,15],leakReduction:[0,.07,.14,.21,.28,.35]
  }),
  upgrade("toad_armor_level","두꺼비 개조실","두꺼비 방어구","오답과 시간 초과의 물 손실을 줄입니다.","toad-armor",{
    penaltyReduction:[0,.08,.16,.24,.32,.4]
  }),
  upgrade("fever_level","두꺼비 개조실","피버 강화","피버가 오래가고 발동이 쉬워지며 점수 배율이 증가합니다.","fever",{
    durationMultiplier:[1,1.1,1.2,1.3,1.4,1.5],scoreMultiplierBonus:[0,.1,.2,.35,.5,1],
    requiredComboReduction:[0,0,0,1,1,1]
  }),
  upgrade("water_power_level","장독대 보강소","물의 힘","정답 물 보상과 피버 중 물대포 확률이 증가합니다.","water-power",{
    correctWaterBonus:[0,.04,.08,.12,.16,.2],feverWaterBonus:[0,.05,.1,.15,.2,.25],
    waterCannonChance:[.12,.16,.2,.24,.28,.32]
  })
]);

export const UPGRADE_MAP=Object.freeze(Object.fromEntries(UPGRADES.map(item=>[item.id,item])));
export const BEAN_REWARDS=Object.freeze({
  correct:2,comboStep:1,feverStart:8,trainingClear:25,newHighScore:20,rareEvent:5,
  comboFinisher:Object.freeze({5:8,10:15})
});
export const ACTION_RULES=Object.freeze({
  bucketSmash:Object.freeze({minCombo:5,chance:.08,scoreBonus:120}),
  lidDrop:Object.freeze({chance:.12}),
  criticalHit:Object.freeze({chance:.06,waterMultiplier:1.5}),
  comboFinishers:Object.freeze([5,10])
});

export const defaultUpgradeLevels=()=>Object.fromEntries(UPGRADES.map(item=>[item.id,0]));
