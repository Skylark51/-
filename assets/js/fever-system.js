export class FeverSystem{
 constructor(config,upgrades){this.config=config;this.upgrades=upgrades}
 values(combo=0){const level=this.upgrades?.level("fever_level")||0;const duration=this.config.durationSeconds*(this.upgrades?.effect("fever_level","durationMultiplier")||1);const required=Math.max(2,this.config.requiredCombo-(this.upgrades?.effect("fever_level","requiredComboReduction")||0));const scoreMultiplier=Math.min(3,this.config.scoreMultiplier+(this.upgrades?.effect("fever_level","scoreMultiplierBonus")||0));return{level,duration,required,scoreMultiplier,waterGainMultiplier:this.config.waterGainMultiplier,leakMultiplier:this.config.leakMultiplier,tier:this.tier(level,combo)}}
 tier(level,combo){if(combo>=20)return 3;if(level>=4||combo>=10)return 2;return 1}
 form(level,combo){return["normal","gold","giant","overdrive"][this.tier(level,combo)]||"gold"}
}
