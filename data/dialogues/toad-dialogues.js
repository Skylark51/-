export const TOAD_DIALOGUES=Object.freeze({
normalCorrect:["오, 물 들어온다!","조금만 더 부어 줘!","등짝은 아프지만 버틸 만하다!","좋아, 장독대가 살아난다!"],
fastCorrect:["벌써 풀었다고?","콩쥐 손이 번개구나!","문제보다 물이 더 늦게 들어오겠네!"],
combo:["연속 정답이다!","이 속도면 나도 살겠어!","콩쥐야, 오늘 좀 하는데?"],
feverStart:["뜨거워! 물을 더 부어!","지금이야, 장독대를 채워!","내 등짝 멀쩡할 때 끝내자!"],feverCorrect:["피버가 계속된다!","물은 차고 마음은 놓인다!","좋아, 멈추지 마!"],waterCritical:["콩쥐야, 물이 거의 없어!","내 등짝의 한계가 온다!","나 빠지면 끝이야, 어서!"],
spoonHit:["왜 맞는 건 나냐!","문제는 네가 풀고 내가 맞네!","등으로 막으랬지 머리로 막으랬냐!","이 숟가락 어디서 났어!"],
bucketSmash:["바가지로 물을 뜨랬지 휘두르랬냐!","장독대까지 깨지는 건 아니지?","그 바가지 강화가 공격용이었어?"],
goldTransform:["황금색이면 덜 아픈 줄 알았냐!","드디어 내 몸값이 올랐다!","지금 나는 국보급 두꺼비다!"],giantTransform:["커졌다고 구멍도 커지는 건 아니야!","이 정도면 장독대 뚜껑도 막겠다!","거대 두꺼비 출근했다!"],upgradePurchased:["강화했으면 내 복지도 챙겨 줘!","새 장비 냄새가 나는군!","콩을 썼으니 성능을 보여 줘!"],criticalWater:["이건 물이 아니라 폭포잖아!","크리티컬로 등짝까지 씻겼다!","장독대가 한 번에 찬다!"],comboFinisher:["마무리까지 나를 때리냐!","콤보 끝에 왜 내가 있지?","이게 바로 교육의 충격인가!"],gameOver:["물은 끝났고 내 허리도 끝났다.","다음에는 조금만 빨리 풀자.","구멍은 내가 막았지만 운명은 못 막았다."],gameClear:["해냈다! 장독대가 가득 찼어!","콩쥐야, 화학 좀 하는구나!","오늘 훈련은 완벽하게 끝났다!"]
});
export class ToadDialogueSelector{constructor(dialogues=TOAD_DIALOGUES,random=Math.random){this.dialogues=dialogues;this.random=random;this.recent=[]}pick(category="normalCorrect"){const requested=this.dialogues[category]||this.dialogues.normalCorrect;let candidates=requested.filter(text=>!this.recent.includes(text));if(!candidates.length)candidates=requested.length?[...requested]:[...this.dialogues.normalCorrect];const text=candidates[Math.floor(this.random()*candidates.length)];this.recent=[text,...this.recent.filter(item=>item!==text)].slice(0,3);return{category:this.dialogues[category]?category:"normalCorrect",text,duration:2200}}}
