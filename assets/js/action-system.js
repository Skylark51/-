import{ACTION_RULES,BEAN_REWARDS}from"../../data/upgrades.js";
export class ActionSystem{
 constructor({upgrades,storage,random=Math.random,eventTarget=globalThis.window}={}){this.upgrades=upgrades;this.storage=storage;this.random=random;this.eventTarget=eventTarget}
 emit(type,detail={}){this.storage?.recordAction?.(type,detail.trainingId);this.eventTarget?.dispatchEvent?.(new CustomEvent(type,{detail}));const dialogue={"action:spoon-hit":"spoonHit","action:bucket-smash":"bucketSmash","action:critical-hit":"criticalWater","action:combo-finisher":"comboFinisher","upgrade:purchased":"upgradePurchased"}[type];if(dialogue)this.speak?.(dialogue);return detail}
 chance(value){return this.random()<value}
 earn(amount,reason,trainingId){const value=Math.max(0,Math.floor(amount||0));if(!value)return 0;this.storage?.earnBeans(value,reason,trainingId);this.emit("currency:earned",{amount:value,reason,trainingId,beans:this.storage?.data.economy?.beans||value});return value}
 correct({combo,fever,trainingId,baseWaterGain}){let waterMultiplier=1,scoreBonus=0,beans=BEAN_REWARDS.correct+Math.floor(combo/3)*BEAN_REWARDS.comboStep;const actions=[];
  const critical=this.chance(ACTION_RULES.criticalHit.chance);if(critical){waterMultiplier=ACTION_RULES.criticalHit.waterMultiplier;actions.push(this.emit("action:critical-hit",{trainingId,combo,waterMultiplier,intensity:.9}));beans+=BEAN_REWARDS.rareEvent}
  if(combo>=3&&this.chance(this.upgrades.effect("spoon_level","spoonChance"))){actions.push(this.emit("action:spoon-hit",{trainingId,level:this.upgrades.level("spoon_level"),combo,damageText:"깡!",intensity:Math.min(1,.45+combo/30)}))}
  if(combo>=ACTION_RULES.bucketSmash.minCombo&&this.chance(ACTION_RULES.bucketSmash.chance)){scoreBonus+=ACTION_RULES.bucketSmash.scoreBonus;actions.push(this.emit("action:bucket-smash",{trainingId,level:this.upgrades.level("bucket_level"),combo,scoreBonus,intensity:.85}))}
  if(fever&&this.chance(this.upgrades.effect("water_power_level","waterCannonChance"))){actions.push(this.emit("action:water-cannon",{trainingId,level:this.upgrades.level("water_power_level"),combo,intensity:.8}))}
  if(ACTION_RULES.comboFinishers.includes(combo)){const bonus=BEAN_REWARDS.comboFinisher[combo]||0;beans+=bonus;actions.push(this.emit("action:combo-finisher",{trainingId,combo,beans:bonus,intensity:1}))}
  this.earn(beans,"correct",trainingId);return{waterMultiplier,scoreBonus,beans,critical,actions,waterGainPreview:baseWaterGain*waterMultiplier}}
 penalty({reason,trainingId}){if(this.chance(ACTION_RULES.lidDrop.chance))this.emit("action:lid-drop",{reason,trainingId,intensity:.65})}
 feverStart({form,duration,tier,trainingId}){this.earn(BEAN_REWARDS.feverStart,"fever_start",trainingId);this.emit("toad:transform",{trainingId,form,duration:Math.round(duration*1000),feverTier:tier})}
 feverEnd(reason){this.emit("toad:transform-end",{form:"normal",reason})}
}
