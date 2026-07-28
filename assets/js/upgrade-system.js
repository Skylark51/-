import{UPGRADES,UPGRADE_MAP,MAX_UPGRADE_LEVEL,defaultUpgradeLevels}from"../../data/upgrades.js";
const clampLevel=value=>Math.max(0,Math.min(MAX_UPGRADE_LEVEL,Math.floor(Number(value)||0)));
export class UpgradeSystem{
 constructor(storage){if(!storage)throw new Error("UpgradeSystem에는 storage가 필요합니다.");this.storage=storage;this.buying=false}
 levels(){return{...defaultUpgradeLevels(),...(this.storage.data.upgrades||{})}}
 level(id){return clampLevel(this.levels()[id])}
 definition(id){return UPGRADE_MAP[id]||null}
 effect(id,key){const item=this.definition(id),level=this.level(id);return item?.effects?.[key]?.[level]??0}
 card(id){const item=this.definition(id);if(!item)return null;const level=this.level(id);return{id:item.id,shop:item.shop,title:item.title,level,maxLevel:item.maxLevel,nextCost:level<item.maxLevel?item.prices[level]:null,description:item.description,visualKey:`${item.visualPrefix}-${level}`}}
 cards(shop=null){return UPGRADES.filter(item=>!shop||item.shop===shop).map(item=>this.card(item.id))}
 purchase(id){if(this.buying)return{ok:false,reason:"busy"};const item=this.definition(id);if(!item)return{ok:false,reason:"unknown_upgrade"};const level=this.level(id);if(level>=item.maxLevel)return{ok:false,reason:"max_level",card:this.card(id)};const cost=item.prices[level];if((this.storage.data.economy?.beans||0)<cost)return{ok:false,reason:"insufficient_beans",cost,beans:this.storage.data.economy?.beans||0,card:this.card(id)};
  this.buying=true;try{const before=JSON.stringify(this.storage.data);this.storage.data.economy.beans-=cost;this.storage.data.economy.spentBeans+=cost;this.storage.data.overall.totalBeansSpent+=cost;this.storage.data.upgrades[id]=level+1;if(!this.storage.persist()){this.storage.data=JSON.parse(before);return{ok:false,reason:"save_failed"}}const detail={id,previousLevel:level,level:level+1,cost,beans:this.storage.data.economy.beans,card:this.card(id)};globalThis.dispatchEvent?.(new CustomEvent("upgrade:purchased",{detail}));globalThis.dispatchEvent?.(new CustomEvent("upgrade:changed",{detail}));globalThis.dispatchEvent?.(new CustomEvent("upgrade:change",{detail:{upgrades:this.levels()}}));return{ok:true,...detail}}finally{this.buying=false}}
}
