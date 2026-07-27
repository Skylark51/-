export const TOAD_DIALOGUES=Object.freeze({
normalCorrect:['오, 물 들어온다!','조금만 더 부어 줘!','등짝은 아프지만 버틸 만하다!','좋아, 장독대가 살아난다!'],
fastCorrect:['벌써 풀었다고?','콩쥐 손이 번개구나!','문제보다 물이 늦게 들어오겠네!'],
combo:['연속 정답이다!','이 속도면 나도 살겠다!','콩쥐야, 오늘 좀 하는데?'],
feverStart:['피버다! 물을 들이부어!','지금이다, 장독대를 채워!','내 등짝 멀쩡할 때 끝내자!'],
feverCorrect:['피버가 계속된다!','이 물살, 마음에 드는데!','좋아, 멈추지 마!'],
waterCritical:['콩쥐야, 물이 거의 없어!','내 등짝도 한계야!','한 바가지만 더, 어서!'],
stageHighScore:['오늘 기록이 심상치 않다!','최고 점수가 보인다!','이 훈련은 완전히 익혔구나!'],
gameClear:['살았다! 장독대가 가득 찼어!','콩쥐야, 과학이 사람 아니 두꺼비 살린다!','오늘 훈련도 완벽하게 끝냈구나!']
});
export class ToadDialogueSelector{constructor(dialogues=TOAD_DIALOGUES,random=Math.random){this.dialogues=dialogues;this.random=random;this.recent=[]}pick(category='normalCorrect'){let pool=this.dialogues[category]||this.dialogues.normalCorrect;let candidates=pool.filter(text=>!this.recent.includes(text));if(!candidates.length){pool=this.dialogues.normalCorrect;candidates=pool.filter(text=>!this.recent.includes(text))}if(!candidates.length)candidates=[...pool];const text=candidates[Math.floor(this.random()*candidates.length)];this.recent=[text,...this.recent.filter(item=>item!==text)].slice(0,3);return{category:this.dialogues[category]?category:'normalCorrect',text,duration:2200}}}